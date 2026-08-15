package routes

import (
	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/types"
	"github.com/gofiber/fiber/v2"
	"github.com/MertJSX/folderhost/database/logs"
	"fmt"
)

func DeleteSharedByID(c *fiber.Ctx) error {
	account := c.Locals("account").(types.Account)
	if !account.Permissions.EditUsers {
		return c.Status(403).JSON(
			fiber.Map{"err": "You don't have permission to manage shared files."},
		)
	}

	id := c.Params("id")
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Bad request!"})
	}

	err := shared.DeleteShared(id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Failed to delete shared file."})
	}

	logs.CreateLog(types.AuditLog{
		Username:    account.Username,
		Action:      "Delete shared (Admin)",
		Description: fmt.Sprintf("%s deleted shared file record %s", account.Username, id),
	})

	return c.Status(200).JSON(fiber.Map{"response": "Shared successfully deleted!"})
}
