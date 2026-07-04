package middleware

import (
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
	"github.com/matthewhartstonge/argon2"
)

func CheckAuth(c *fiber.Ctx) error {
	var body map[string]interface{}
	var controlPassword bool = false
	var username string = ""
	var password string = ""
	var err error
	var token string

	_ = c.BodyParser(&body)
	if body == nil {
		body = make(map[string]interface{})
	}

	pathsToCheck := []string{"path", "folder", "itemName", "filepath", "oldFilepath", "newFilepath"}
	for _, p := range pathsToCheck {
		val := c.Query(p)
		if val != "" && !utils.IsSafePath(val) {
			return c.Status(403).JSON(fiber.Map{"err": "forbidden"})
		}
	}

	authHeader := c.Get("Authorization")
	if after, ok := strings.CutPrefix(authHeader, "Bearer "); ok {
		token = after
	} else {
		token = authHeader
	}

	reqUsername, hasUsername := body["username"].(string)
	reqPassword, hasPassword := body["password"].(string)

	if token == "" && (!hasUsername || !hasPassword || reqUsername == "" || reqPassword == "") {
		token = c.Cookies("token")
		if token == "" {
			return c.Status(400).JSON(fiber.Map{"err": "authorization required"})
		}
	}

	if token != "" {
		userIp := c.IP()
		userUserAgent := c.Get("User-Agent")
		tokenData, ok := cache.TokenFingerprint.Get(token)

		if !ok {
			return c.Status(401).JSON(fiber.Map{"err": "invalid token"})
		}

		if subtle.ConstantTimeCompare([]byte(tokenData.Ip), []byte(userIp)) != 1 || tokenData.UserAgent != userUserAgent {
			cache.TokenFingerprint.Delete(token)
			return c.Status(401).JSON(fiber.Map{"err": "invalid token"})
		}

		username, err = utils.VerifyToken(token, config.Config.SecretJwtKey)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"err": "invalid token"})
		}
		c.Locals("username", username)
	} else {
		username = reqUsername
		password = reqPassword
		controlPassword = true
	}

	unsuccessfullLoginCount, ok := cache.LoginFailedCache.Get(username)
	if !ok {
		unsuccessfullLoginCount = 0
	}

	if unsuccessfullLoginCount > 5 {
		logs.CreateLog(types.AuditLog{
			Username:    reqUsername,
			Action:      "Login failed",
			Description: fmt.Sprintf("Someone failed to login 5 times!\n IP: %s\n User Agent: %s", c.IP(), c.Get("User-Agent")),
		})

		return c.Status(403).JSON(fiber.Map{"err": "Too many failed login attempts. Please try again after 5 minutes."})
	}

	if cacheAccount, ok := cache.SessionCache.Get(username); ok {
		if controlPassword {
			hashed_password, err := hex.DecodeString(cacheAccount.Password)
			defer clear(hashed_password)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"err": "internal server error"})
			}
			ok, err := argon2.VerifyEncoded([]byte(password), hashed_password)
			if err != nil || !ok {
				cache.LoginFailedCache.Set(username, unsuccessfullLoginCount+1, 5*time.Minute)
				return c.Status(401).JSON(fiber.Map{"err": "wrong password"})
			}
		}
		if controlPassword {
			cache.LoginFailedCache.Delete(username)
		}
		c.Locals("account", cacheAccount)
		return c.Next()
	}

	foundAccount, err := users.GetUserByUsername(username)
	if err != nil {
		cache.LoginFailedCache.Set(username, unsuccessfullLoginCount+1, 5*time.Minute)
		return c.Status(404).JSON(fiber.Map{"err": "account not found"})
	}

	if controlPassword {
		hashed_password, err := hex.DecodeString(foundAccount.Password)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"err": "internal server error"})
		}
		defer clear(hashed_password)

		ok, err := argon2.VerifyEncoded([]byte(password), hashed_password)
		if err != nil || !ok {
			cache.LoginFailedCache.Set(username, unsuccessfullLoginCount+1, 5*time.Minute)
			return c.Status(401).JSON(fiber.Map{"err": "wrong password"})
		}
		// Reset failed login count on successful login
		cache.LoginFailedCache.Delete(username)
	}

	cache.SessionCache.Set(username, foundAccount, 30*time.Minute)
	c.Locals("account", foundAccount)
	return c.Next()
}
