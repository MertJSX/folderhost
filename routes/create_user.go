package routes

import (
	"fmt"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/types"
	"github.com/gofiber/fiber/v2"
)

func CreateUser(c *fiber.Ctx) error {
	if !c.Locals("account").(types.Account).Permissions.EditUsers {
		return c.Status(403).JSON(
			fiber.Map{"err": "No permission!"},
		)
	}

	var requestBody struct {
		User types.Account `json:"user"`
	}

	if err := c.BodyParser(&requestBody); err != nil {
		return c.Status(400).JSON(
			fiber.Map{"err": "Bad request! " + err.Error()},
		)
	}

	if requestBody.User.Username == "" {
		return c.Status(400).JSON(
			fiber.Map{"err": "Username is missing."},
		)
	}

	if requestBody.User.Password == "" {
		return c.Status(400).JSON(
			fiber.Map{"err": "Password is missing."},
		)
	}

	err := users.CreateUser(&requestBody.User, true)

	if err != nil {
		if err.Error() == "username already exists" {
			return c.Status(400).JSON(
				fiber.Map{"err": "Username already exists."},
			)
		}
		return c.Status(500).JSON(
			fiber.Map{"err": "Unknown server error."},
		)
	}

	logs.CreateLog(types.AuditLog{
		Username:    c.Locals("account").(types.Account).Username,
		Action:      "Create user",
		Description: fmt.Sprintf("%s created a new user %s", c.Locals("account").(types.Account).Username, requestBody.User.Username),
	})

	return c.Status(200).JSON(
		fiber.Map{"response": "User successfully created!"},
	)
}
