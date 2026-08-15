package routes

import (
	"strconv"
	"strings"

	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func GetUserShareds(c *fiber.Ctx) error {
	account := c.Locals("account").(types.Account)
	if !account.Permissions.ReadUsers {
		return c.Status(403).JSON(
			fiber.Map{"err": "No permission!"},
		)
	}

	var username string = c.Params("username")
	if username == "" {
		return c.Status(400).JSON(
			fiber.Map{"err": "Username is missing!"},
		)
	}

	user, err := users.GetUserByUsername(username)
	if err != nil {
		return c.Status(404).JSON(
			fiber.Map{"err": "User not found!"},
		)
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "100"))

	records, err := shared.GetSharedPagination(page, limit, *user.ID)
	if err != nil {
		return c.Status(500).JSON(
			fiber.Map{"err": "Failed to fetch shared records!"},
		)
	}

	if records == nil {
		records = []types.Shared{}
	} else {
		basePath := config.Config.Folder
		for i := range records {
			cleanPath := strings.TrimPrefix(records[i].Path, basePath)
			if !strings.HasPrefix(cleanPath, "/") {
				cleanPath = "/" + cleanPath
			}
			records[i].Path = "." + cleanPath

			if records[i].Password != "" {
				records[i].Password = "protected"
			}
		}
	}

	isLast := len(records) < limit

	return c.Status(200).JSON(
		fiber.Map{
			"records": records,
			"isLast":  isLast,
		},
	)
}
