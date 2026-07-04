package routes

import (
	"fmt"
	"time"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func VerifyPassword(c *fiber.Ctx) error {
	token, err := utils.CreateToken(c.Locals("account").(types.Account).Username, config.Config.SecretJwtKey)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "unknown error while getting token"})
	}

	userIp := c.IP()
	userUserAgent := c.Get("User-Agent")

	cache.TokenFingerprint.Set(token, types.AuthorizationTokenCacheBody{
		Ip:        userIp,
		UserAgent: userUserAgent,
	}, 24*time.Hour)

	logs.CreateLog(types.AuditLog{
		Username:    c.Locals("account").(types.Account).Username,
		Action:      "Login",
		Description: fmt.Sprintf("IP: %s\nUser Agent: %s", userIp, userUserAgent),
	})

	return c.JSON(
		fiber.Map{
			"res":         "Verified!",
			"token":       token,
			"permissions": c.Locals("account").(types.Account).Permissions,
		},
	)
}
