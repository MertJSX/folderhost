package routes

import (
	"fmt"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/gofiber/fiber/v2"
)

func EditUser(c *fiber.Ctx) error {
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

	if requestBody.User.ID == nil {
		return c.Status(400).JSON(fiber.Map{
			"err": "Bad request. User's ID is missing!",
		})
	}

	if *requestBody.User.ID == 1 {
		return c.Status(400).JSON(fiber.Map{
			"err": "You can't update admin account from the web panel. Use config.yml instead.",
		})
	}

	username, err := users.GetUsername(*requestBody.User.ID)

	if username == "system" {
		return c.Status(403).JSON(fiber.Map{
			"err": "You can't edit the system account!",
		})
	}

	if requestBody.User.Username == "" || err != nil {
		return c.Status(400).JSON(
			fiber.Map{"err": "Username is missing or not existing in db."},
		)
	}

	err = users.UpdateUser(*requestBody.User.ID, &requestBody.User)

	if err != nil {
		return c.Status(500).JSON(
			fiber.Map{"err": "Unknown server error."},
		)
	}

	if _, ok := cache.SessionCache.Get(username); ok {
		cache.SessionCache.Delete(username)
	}

	logs.CreateLog(types.AuditLog{
		Username:    c.Locals("account").(types.Account).Username,
		Action:      "Edit user",
		Description: fmt.Sprintf("%s modified user %s", c.Locals("account").(types.Account).Username, requestBody.User.Username),
	})

	return c.Status(200).JSON(
		fiber.Map{"response": "User successfully edited!"},
	)
}
