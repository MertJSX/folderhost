package websocket

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"

	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/MertJSX/folderhost/utils/config"
	serviceutils "github.com/MertJSX/folderhost/utils/service_utils"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func HandleWebsocket(c *websocket.Conn) {
	var path string = c.Params("path")
	var serviceName string = c.Query("serviceName")
	var account types.Account = c.Locals("account").(types.Account)

	path, err := url.PathUnescape(path)
	if err != nil {
		c.Close()
		return
	}

	serviceName, err = url.PathUnescape(serviceName)
	if err != nil {
		c.Close()
		return
	}

	config := &config.Config
	var fileStat os.FileInfo

	if serviceName == "" {
		if path == "/" {
			path = ""
		}

		path = config.GetScopedFolder(account.Scope) + path

		if !utils.IsSafePathForScope(path, account.Scope) {
			c.Close()
			return
		}

		fileStat, err = os.Stat(path)
		if err != nil {
			return
		}

		if utils.IsExistingWSConnectionPath(path) || fileStat.IsDir() {
			utils.AddClient(c, path, fileStat.IsDir())
		} else {
			freeSpace, _ := utils.GetRemainingFolderSpace()
			if freeSpace >= (200 * 1024) {
				utils.AddClient(c, path, fileStat.IsDir())
			} else {
				return
			}
		}
	} else {
		path = fmt.Sprintf("!service-%s", serviceName)

		permissions, err := serviceutils.GlobalServiceManager.GetUserServicePermissions(serviceName, c.Locals("account").(types.Account).Username)

		if err != nil {
			c.Close()
			return
		}

		if !permissions.ReadLogs {
			c.Close()
			return
		}

		utils.AddClient(c, path, true)
	}

	updateClientsCount(path)

	defer updateClientsCount(path)
	defer utils.RemoveClient(c)
	defer c.Close()

	var username string = account.Username
	defer utils.TriggerPendingLog(username, path)

	if serviceName == "" {
		_, ok := cache.EditorWatcherCache.Get(path)

		if !ok {
			cache.EditorWatcherCache.SetWithoutTTL(path, types.EditorWatcherCache{
				LastModTime: fileStat.ModTime(),
				IsWriting:   false,
			})
			if !fileStat.IsDir() {
				channel := make(chan bool, 1)
				go SetupWatcher(path, channel)
				defer func() {
					go WatcherDestroyer(path, channel)
				}()
			}
		}
	}

	for {
		mt, msg, err := c.ReadMessage()
		if err != nil {
			return
		}

		if err := processWebSocketMessage(msg, path, c, mt); err != nil {
			log.Println("Message processing error:", err)
		}
	}
}

func updateClientsCount(path string) {
	clientsCount, err := json.Marshal(fiber.Map{
		"type":  "editor-update-usercount",
		"count": utils.GetClientsCount(path),
	})

	if err == nil {
		utils.SendToAll(path, 1, clientsCount)
	}
}
