package routes

import (
	"os"
	"strings"

	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func GetSharedLink(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Bad request!"})
	}

	record, err := shared.GetSharedByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"err": "Shared link not found or invalid."})
	}

	user, err := users.GetUserByUsername(record.Username)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"err": "The owner of this shared file no longer exists."})
	}

	if !user.Permissions.DownloadFiles {
		return c.Status(403).JSON(fiber.Map{"err": "User does not have permission to share this file!"})
	}

	userScopeFolder := config.Config.GetScopedFolder(user.Scope)
	if !strings.HasPrefix(record.Path, userScopeFolder) {
		return c.Status(403).JSON(fiber.Map{"err": "This file is no longer within the user's scope!"})
	}

	fileinfo, err := os.Stat(record.Path)
	if os.IsNotExist(err) || fileinfo.IsDir() {
		shared.DeleteShared(record.ID)
		return c.Status(404).JSON(fiber.Map{"err": "File no longer exists or is a directory!"})
	}

	// Clear sensitive fields
	hasPassword := record.Password != ""
	record.Password = ""
	record.Path = ""
	record.UserID = 0

	return c.Status(200).JSON(fiber.Map{
		"shared": record,
		"hasPassword": hasPassword,
	})
}
