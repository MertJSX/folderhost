package websocket

import (
	"encoding/json"
	"fmt"
	"path"

	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func HandleUnzip(c *websocket.Conn, mt int, message types.EditorChange) {
	var account types.Account = c.Locals("account").(types.Account)

	src := config.Config.GetScopedFolder(account.Scope) + message.Path
	afterExtractDestination := fmt.Sprintf("%s%s/%s", config.Config.GetScopedFolder(account.Scope), utils.GetParentPath(message.Path), utils.GetPureFileName(message.Path))
	extractDest := fmt.Sprintf("%s%s", config.Config.GetScopedFolder(account.Scope), utils.GetParentPath(message.Path))

	if utils.IsExistingPath(afterExtractDestination) {
		errorMsg, _ := json.Marshal(fiber.Map{
			"type":        "unzip-progress",
			"totalSize":   "0 Bytes",
			"isCompleted": false,
			"abortMsg":    fmt.Sprintf(`Cannot unzip file. Folder "%s" already exists`, utils.GetPureFileName(message.Path)),
		})
		c.WriteMessage(mt, errorMsg)
		return
	}

	if !utils.IsSafePathForScope(src, account.Scope) || !utils.IsSafePathForScope(extractDest, account.Scope) {
		errorMsg, _ := json.Marshal(fiber.Map{
			"type":        "unzip-progress",
			"totalSize":   "0 Bytes",
			"isCompleted": false,
			"abortMsg":    fmt.Sprintf(`Cannot unzip file. Path "%s" is out of your scope.`, src),
		})
		c.WriteMessage(mt, errorMsg)
		return
	}

	err := utils.Unzip(src, extractDest, func(totalSize int64, isCompleted bool, abortMsg string) {
		unzipProgress, _ := json.Marshal(fiber.Map{
			"type":        "unzip-progress",
			"totalSize":   utils.ConvertBytesToString(totalSize),
			"isCompleted": isCompleted,
			"abortMsg":    abortMsg,
		})

		c.WriteMessage(mt, unzipProgress)
	}, account.Scope)

	if err != nil {
		errorMsg, _ := json.Marshal(fiber.Map{
			"type":        "unzip-progress",
			"totalSize":   "0 Bytes",
			"isCompleted": false,
			"abortMsg":    fmt.Sprintf(`Cannot unzip file. Error: %v`, err),
		})
		c.WriteMessage(mt, errorMsg)
		return
	}
}

func HandleZip(c *websocket.Conn, mt int, message types.EditorChange) {
	var account types.Account = c.Locals("account").(types.Account)

	src := config.Config.GetScopedFolder(account.Scope) + message.Path
	baseDest := fmt.Sprintf("%s%s/%s", config.Config.GetScopedFolder(account.Scope), utils.GetParentPath(message.Path), utils.GetPureFileName(message.Path))
	dest := baseDest + ".zip"

	if !utils.IsExistingPath(src) {
		errorMsg, _ := json.Marshal(fiber.Map{
			"type":        "zip-progress",
			"totalSize":   "0 Bytes",
			"isCompleted": false,
			"abortMsg":    fmt.Sprintf(`Cannot zip file. File "%s" does not exist`, utils.GetPureFileName(message.Path)),
		})
		c.WriteMessage(mt, errorMsg)
		return
	}

	if !utils.IsSafePathForScope(src, account.Scope) || (path.Clean(src) == path.Clean(config.Config.GetScopedFolder(account.Scope))) {
		errorMsg, _ := json.Marshal(fiber.Map{
			"type":        "zip-progress",
			"totalSize":   "0 Bytes",
			"isCompleted": false,
			"abortMsg":    fmt.Sprintf(`Cannot zip file. Path "%s" is out of your scope.`, src),
		})
		c.WriteMessage(mt, errorMsg)
		return
	}

	for index := 1; utils.IsExistingPath(dest); index++ {
		dest = fmt.Sprintf("%s (%d).zip", baseDest, index)
	}

	utils.Zip(src, dest, func(totalSize int64, isCompleted bool, abortMsg string) {
		zipProgress, _ := json.Marshal(fiber.Map{
			"type":        "zip-progress",
			"totalSize":   utils.ConvertBytesToString(totalSize),
			"isCompleted": isCompleted,
			"abortMsg":    abortMsg,
		})

		c.WriteMessage(mt, zipProgress)
	})
}
