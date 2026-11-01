package routes

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func Image(c *fiber.Ctx) error {
	if !c.Locals("account").(types.Account).Permissions.DownloadFiles {
		return c.Status(403).JSON(
			fiber.Map{"err": "No permission!"},
		)
	}

	var path string = c.Params("path")
	scope := c.Locals("account").(types.Account).Scope
	path, err := url.QueryUnescape(path)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"err": "Invalid path encoding"})
	}
	path = fmt.Sprintf("%s%s", config.Config.GetScopedFolder(scope), path)
	fileinfo, err := os.Stat(path)

	if os.IsNotExist(err) {
		return c.Status(404).JSON(
			fiber.Map{"err": "Path does not exist!"},
		)
	} else if err != nil {
		return c.Status(500).JSON(
			fiber.Map{"err": "Unknown error!"},
		)
	}
	if fileinfo.IsDir() {
		return c.Status(400).JSON(
			fiber.Map{"err": "Item is folder!"},
		)
	}
	if ok := utils.IsSafePathForScope(path, scope); !ok {
		return c.Status(403).JSON(
			fiber.Map{"err": "forbidden"},
		)
	}

	ext := strings.ToLower(filepath.Ext(path))

	allowedExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".bmp":  true,
		".webp": true,
		".svg":  true,
		".ico":  true,
		".tiff": true,
	}

	if !allowedExtensions[ext] {
		return c.Status(400).JSON(
			fiber.Map{"err": "Item is not an image!"},
		)
	}

	if fileinfo.Size() > 8*1024*1024 {
		return c.Status(400).JSON(
			fiber.Map{"err": "Too large size!"},
		)
	}

	return c.Status(200).SendFile(path)
}
