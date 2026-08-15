package routes

import (
	"fmt"
	"net/url"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func DeleteSharedFile(c *fiber.Ctx) error {
	path := c.Params("*")
	if path == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Bad request!"})
	}

	decodedPath, err := url.QueryUnescape(path)
	if err == nil {
		path = decodedPath
	}

	account := c.Locals("account").(types.Account)
	if !account.Permissions.DownloadFiles {
		return c.Status(403).JSON(
			fiber.Map{"err": "You don't have permission to delete shared files (Download permission required)."},
		)
	}

	recordPath := path
	if len(recordPath) > 0 && recordPath[0] != '/' {
		recordPath = "/" + recordPath
	}
	absolutePath := fmt.Sprintf("%s%s", config.Config.GetScopedFolder(account.Scope), recordPath)

	err = shared.DeleteSharedByPath(*account.ID, absolutePath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Failed to delete shared file."})
	}

	logs.CreateLog(types.AuditLog{
		Username:    account.Username,
		Action:      "Delete shared",
		Description: fmt.Sprintf("%s deleted shared file %s", account.Username, path),
	})

	return c.Status(200).JSON(fiber.Map{"response": "Shared successfully deleted!"})
}
