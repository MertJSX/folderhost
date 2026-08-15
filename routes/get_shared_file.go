package routes

import (
	"fmt"
	"net/url"

	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func GetSharedFile(c *fiber.Ctx) error {
	path := c.Params("*")
	if path == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Bad request!"})
	}

	decodedPath, err := url.QueryUnescape(path)
	if err == nil {
		path = decodedPath
	}

	account := c.Locals("account").(types.Account)

	recordPath := path
	if len(recordPath) > 0 && recordPath[0] != '/' {
		recordPath = "/" + recordPath
	}

	absolutePath := fmt.Sprintf("%s%s", config.Config.GetScopedFolder(account.Scope), recordPath)

	record, err := shared.GetSharedByPath(*account.ID, absolutePath)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"err": "Shared not found or access denied."})
	}

	if record.Password != "" {
		record.Password = "protected"
	}

	return c.Status(200).JSON(record)
}
