package routes

import (
	"fmt"
	"os"
	"time"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/gofiber/fiber/v2"
	"strings"
)

func PostSharedFileDownload(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Bad request!"})
	}

	var requestBody struct {
		Password string `json:"password"`
	}

	c.BodyParser(&requestBody) // ignore error, it's ok if empty

	record, err := shared.GetSharedByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"err": "Shared link not found."})
	}

	if record.Password != "" && record.Password != requestBody.Password {
		return c.Status(401).JSON(fiber.Map{"err": "Invalid password!"})
	}

	if record.ExpiresAt != "" {
		expiresTime, err := time.Parse(time.RFC3339, record.ExpiresAt)
		if err == nil && time.Now().After(expiresTime) {
			return c.Status(410).JSON(fiber.Map{"err": "This shared link has expired."})
		}
	}

	filepath := record.Path

	user, err := users.GetUserByUsername(record.Username)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"err": "The owner of this shared file no longer exists."})
	}

	if !user.Permissions.DownloadFiles {
		return c.Status(403).JSON(fiber.Map{"err": "User does not have permission to share this file!"})
	}

	userScopeFolder := config.Config.GetScopedFolder(user.Scope)
	if !strings.HasPrefix(filepath, userScopeFolder) {
		return c.Status(403).JSON(fiber.Map{"err": "This file is no longer within the user's scope!"})
	}

	fileinfo, err := os.Stat(filepath)
	if os.IsNotExist(err) || fileinfo.IsDir() {
		shared.DeleteShared(record.ID)
		return c.Status(404).JSON(fiber.Map{"err": "File no longer exists or is a directory!"})
	}

	_, err = database.DB.Exec("UPDATE shared SET downloadCount = downloadCount + 1 WHERE id=?", record.ID)
	if err != nil {
		fmt.Println("Error updating downloadCount:", err)
	}

	randomID := utils.GenerateUniqueString()
	cache.DownloadLinkCache.Set(randomID, types.DownloadLinkCache{Path: filepath, Username: "Public (" + record.ID + ")"}, 1*time.Minute)

	return c.Status(200).JSON(
		fiber.Map{"id": randomID},
	)
}
