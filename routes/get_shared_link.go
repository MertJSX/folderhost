package routes

import (
	"github.com/MertJSX/folderhost/database/shared"
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
