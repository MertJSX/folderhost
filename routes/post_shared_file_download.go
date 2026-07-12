package routes

import (
	"fmt"
	"os"
	"time"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/gofiber/fiber/v2"
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

	fileinfo, err := os.Stat(filepath)
	if os.IsNotExist(err) || fileinfo.IsDir() {
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
