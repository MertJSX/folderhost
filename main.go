package main

import (
	"crypto/tls"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"strings"
	"syscall"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/database/initialize"
	"github.com/MertJSX/folderhost/middleware"
	fhWS "github.com/MertJSX/folderhost/middleware/websocket"
	_ "github.com/MertJSX/folderhost/resources"
	"github.com/MertJSX/folderhost/routes"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/MertJSX/folderhost/utils/config"
	serviceutils "github.com/MertJSX/folderhost/utils/service_utils"
	"github.com/MertJSX/folderhost/utils/tasks"
	"github.com/fatih/color"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"golang.org/x/crypto/acme"
	"golang.org/x/crypto/acme/autocert"
)

//go:embed web/dist/*
var FrontendFS embed.FS

var (
	Version   = "unknown"
	BuildTime = "unknown"
	GitCommit = "unknown"
)

func main() {
	app := fiber.New(fiber.Config{
		BodyLimit:             10 * 1024 * 1024, // 10 MB
		AppName:               "FolderHost",
		DisableStartupMessage: true,
	})

	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestSpeed,
		Next: func(c *fiber.Ctx) bool {
			skipRoutes := []string{
				"/api/explorer/download",
				"/api/upload",
				"/api/raw",
			}
			for _, route := range skipRoutes {
				if strings.HasPrefix(c.Path(), route) {
					return true
				}
			}
			return false
		},
	}))

	app.Use(cors.New())

	utils.Setup()
	utils.GetConfig()
	initialize.InitializeDatabase()

	go cache.ListenDirectorySetCacheEvents()
	go tasks.AutoClearOldLogs()

	config := &config.Config
	var portInt int = config.Port
	if portInt == 0 || !utils.IsPortAvailable(portInt) {
		log.Printf("Your port %d is busy! Searching for another port...", portInt)
		var err error
		portInt, err = utils.FindAvailablePort(5000, 6000)
		if err != nil {
			log.Printf("%v", err)
		}
	}
	var PORT string = fmt.Sprintf(":%d", portInt)
	var skipServices bool = false

	serviceutils.GlobalServiceManager = serviceutils.NewServiceManager()

	err := serviceutils.GlobalServiceManager.LoadConfig("services.yml")
	if err != nil {
		log.Printf("Warning: Can't load services.yml: %v", err)
		skipServices = true // Services are optional
	}

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM, syscall.SIGQUIT)

	go func() {
		<-c

		if !skipServices && serviceutils.GlobalServiceManager.Config.Enabled {
			log.Printf("Stopping services...")

			serviceutils.GlobalServiceManager.Shutdown()
		}

		log.Println("Stopping program...")
		
		if database.DB != nil {
			database.DB.Close()
		}

		os.Exit(0)
	}()

	if !skipServices && serviceutils.GlobalServiceManager.Config.Enabled {
		for name, service := range serviceutils.GlobalServiceManager.Services {
			if service.Config.AutoStart {
				if err := serviceutils.GlobalServiceManager.StartService(name); err != nil {
					log.Printf("%s could not be started: %v", name, err)
				}
			}
		}
	}

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return fhWS.WsConnect(c)
		}
		return c.Next()
	})

	app.Get("/ws/:path", websocket.New(fhWS.HandleWebsocket))

	app.Get("/download", routes.Download)

	app.Get("/shared/:id", routes.GetSharedLink)
	app.Post("/shared/:id/download", routes.PostSharedFileDownload)

	app.Use("/api", middleware.CheckAuth)

	app.Get("/api/user-info", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{
			"username": c.Locals("account").(types.Account).Username,
		})
	})

	app.Get("/api/read-file", routes.ReadFile)

	app.Get("/api/image/:path", routes.Image)

	app.Post("/api/verify-password", routes.VerifyPassword)

	app.Put("/api/logout", routes.Logout)

	app.Get("/api/permissions", routes.GetPermissions)

	app.Get("/api/explorer/read-dir", routes.ReadDirectory)

	app.Get("/api/explorer/get-download-link", routes.GetDownloadLink)

	app.Post("/api/upload", routes.ChunkedUpload)

	app.Get("/api/services", routes.GetServices)

	app.Get("/api/services/:service", routes.GetServiceStatus)

	app.Get("/api/services/:service/permissions", routes.GetUserServicePermissions)

	app.Put("/api/services/:service/stop", routes.StopService)

	app.Put("/api/services/:service/start", routes.StartService)

	app.Get("/api/services/logs/:service", routes.GetServiceLogs)

	app.Post("/api/services/send-command", routes.SendServiceCommand)

	app.Delete("/api/explorer/delete", routes.Delete)

	app.Post("/api/explorer/create-item", routes.CreateItem)

	app.Post("/api/explorer/create-copy", routes.CreateCopy)

	app.Put("/api/explorer/rename", routes.Rename)

	app.Post("/api/shared", routes.PostCreateSharedFile)

	app.Get("/api/shared/*", routes.GetSharedFile)

	app.Delete("/api/shared/*", routes.DeleteSharedFile)

	app.Get("/api/raw/:filepath", routes.RawFile)

	app.Get("/api/recovery", routes.Recovery)

	app.Put("/api/recovery/recover", routes.RecoverItem)

	app.Delete("/api/recovery/remove", routes.RemoveRecoveryRecord)

	app.Delete("/api/recovery/clear", routes.ResetRecoveryRecords)

	app.Get("/api/users", routes.GetAllUsers)

	app.Get("/api/users/:username", routes.GetUser)

	app.Put("/api/users/edit", routes.EditUser)

	app.Put("/api/users/change-password", routes.ChangeUserPassword)

	app.Post("/api/users/new", routes.CreateUser)

	app.Delete("/api/users/remove/:id", routes.RemoveUser)

	app.Get("/api/logs", routes.Logs)

	if !utils.IsDevelopment() {
		distFS, err := fs.Sub(FrontendFS, "web/dist")
		if err != nil {
			log.Fatal("Error creating sub FS:", err)
		}

		app.Get("/share/:id", func(c *fiber.Ctx) error {
			id := c.Params("id")
			indexFile, err := distFS.Open("index.html")
			if err != nil {
				return c.Status(404).SendString("Not Found")
			}
			defer indexFile.Close()

			content, err := io.ReadAll(indexFile)
			if err != nil {
				return c.Status(500).SendString("Internal Server Error")
			}

			htmlStr := utils.InjectShareMetaTags(string(content), id, c.BaseURL())

			c.Type("html")
			return c.SendString(htmlStr)
		})

		app.Use("/", filesystem.New(filesystem.Config{
			Root:         http.FS(distFS),
			Index:        "index.html",
			NotFoundFile: "index.html",
			MaxAge:       86400, // 1 day cache
		}))

		app.Get("*", func(c *fiber.Ctx) error {
			indexFile, err := distFS.Open("index.html")
			if err != nil {
				return c.Status(404).SendString("Not Found")
			}
			defer indexFile.Close()

			stat, err := indexFile.Stat()
			if err != nil {
				return c.Status(500).SendString("Internal Server Error")
			}

			c.Type("html")
			return c.SendStream(indexFile, int(stat.Size()))
		})
	}

	asciiFormat := color.New(color.FgCyan).Add(color.Bold)
	sign := color.New(color.FgHiCyan).Add(color.Italic).Add(color.Underline)
	asciiFormat.Print(`
      _______   __   __
     / _____/  / /  / /
    / /__     / /__/ /
   / ___/    / ___  /
  / /       / /  / /
 /_/       /_/  /_/  `)
	sign.Print("By MertJSX\n")
	defaultText := color.RGB(169, 169, 169)
	greenText := color.New(color.FgGreen)
	errorText := color.New(color.FgRed)
	warningText := color.New(color.FgYellow)
	cyanText := color.New(color.FgCyan)

	protocol := "http"
	if config.SSL.Enabled {
		protocol = "https"
	}

	// defaultText.Printf("\nThe server has started on port %d!\n", portInt)
	defaultText.Print("\nVersion: ")
	greenText.Printf("%s ", Version)
	defaultText.Print("/ OS: ")
	warningText.Printf("%s", runtime.GOOS)
	defaultText.Print("\nDocumentation: ")
	cyanText.Printf("https://folderhost.org")
	defaultText.Print("\nGitHub: ")
	cyanText.Printf("https://github.com/MertJSX/folderhost")
	defaultText.Print("\nLocal URL: ")
	warningText.Printf("%s://127.0.0.1:%d\n", protocol, portInt)

	_, size, err := utils.GetDirectorySize(config.Folder)
	if err != nil {
		errorText.Printf("\nError while getting foldersize:\n %v\n", err)
		return
	}
	defaultText.Print("Folder size: ")
	greenText.Print(size)
	if config.StorageLimit != "" {
		defaultText.Print(" / ")
		greenText.Printf("%s\n", config.StorageLimit)
	}

	localIPs := utils.GetLocalIPs()
	if len(localIPs) > 0 {
		defaultText.Print("Share with other devices on same network:\n")
		for _, ip := range localIPs {
			cyanText.Printf("   %s://%s:%d\n", protocol, ip, portInt)
		}
	} else {
		fmt.Printf("\n")
	}

	if !serviceutils.GlobalServiceManager.Config.Enabled {
		defaultText.Print("\nServices are disabled. You can enable them if you need from services.yml!")
	}

	warningText.Printf("\nPlease restart the server if you make any changes on config.yml or services.yml!\n\n")

	utils.StartVersionChecker(Version)

	if config.SSL.Enabled {
		if config.SSL.Type == "letsencrypt" {
			m := &autocert.Manager{
				Prompt:     autocert.AcceptTOS,
				HostPolicy: autocert.HostWhitelist(config.SSL.Domains...),
				Cache:      autocert.DirCache("./certs"),
				Email:      config.SSL.Email,
			}

			tlsConfig := &tls.Config{
				GetCertificate: m.GetCertificate,
				NextProtos:     []string{"h2", "http/1.1", acme.ALPNProto},
			}

			ln, err := tls.Listen("tcp", "0.0.0.0"+PORT, tlsConfig)
			if err != nil {
				log.Fatalf("SSL Listen error: %v", err)
			}

			log.Printf("Server is starting with Let's Encrypt SSL on port %d...\n", portInt)
			if err := app.Listener(ln); err != nil {
				log.Fatalf("Server error: %v", err)
			}
		} else if config.SSL.Type == "self_signed" {
			certFile := "./certs/self-signed.crt"
			keyFile := "./certs/self-signed.key"

			os.MkdirAll("./certs", 0755)
			if _, err := os.Stat(certFile); os.IsNotExist(err) {
				log.Println("Generating self-signed certificate...")
				err := utils.GenerateSelfSignedCert(certFile, keyFile)
				if err != nil {
					log.Fatalf("Failed to generate self-signed certificate: %v", err)
				}
			}

			log.Printf("Server is starting with SSL on port %d...\n", portInt)
			if err := app.ListenTLS("0.0.0.0"+PORT, certFile, keyFile); err != nil {
				log.Fatalf("Server error: %v", err)
			}
		} else {
			log.Fatalf("Unknown SSL type in config.yml: %s", config.SSL.Type)
		}
	} else {
		if err := app.Listen("0.0.0.0" + PORT); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}
}
