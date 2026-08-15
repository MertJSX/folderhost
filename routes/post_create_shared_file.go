package routes

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/database/shared"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func PostCreateSharedFile(c *fiber.Ctx) error {
	account := c.Locals("account").(types.Account)
	if !account.Permissions.DownloadFiles {
		return c.Status(403).JSON(
			fiber.Map{"err": "You don't have permission to share files (Download permission required)."},
		)
	}

	var requestBody struct {
		Shared types.Shared `json:"shared"`
	}

	if err := c.BodyParser(&requestBody); err != nil {
		return c.Status(400).JSON(
			fiber.Map{"err": "Bad request! " + err.Error()},
		)
	}

	requestBody.Shared.Username = account.Username
	requestBody.Shared.UserID = *account.ID

	if requestBody.Shared.Path == "" ||
		requestBody.Shared.DisplayName == "" {
		return c.Status(400).JSON(
			fiber.Map{"err": "Bad request!"},
		)
	}

	ext := filepath.Ext(requestBody.Shared.Path)
	requestBody.Shared.FileExtension = strings.ToUpper(strings.TrimPrefix(ext, "."))

	recordPath := requestBody.Shared.Path
	if len(recordPath) > 0 && recordPath[0] != '/' {
		recordPath = "/" + recordPath
	}
	requestBody.Shared.Path = fmt.Sprintf("%s%s", config.Config.GetScopedFolder(account.Scope), recordPath)

	existingOrNew, err := shared.CreateShared(&requestBody.Shared)

	if err != nil {
		if errors.Is(err, shared.ErrSharedAlreadyExists) {
			return c.Status(400).JSON(
				fiber.Map{
					"err":    "Shared already exists.",
					"shared": existingOrNew,
				},
			)
		}
		return c.Status(500).JSON(
			fiber.Map{"err": "Unknown server error."},
		)
	}

	logs.CreateLog(types.AuditLog{
		Username:    c.Locals("account").(types.Account).Username,
		Action:      "Create shared",
		Description: fmt.Sprintf("%s created a new shared %s", c.Locals("account").(types.Account).Username, requestBody.Shared.DisplayName),
	})

	return c.Status(200).JSON(
		fiber.Map{
			"response": "Shared successfully created!",
			"shared":   existingOrNew,
		},
	)
}
