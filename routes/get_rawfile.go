package routes

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func RawFile(c *fiber.Ctx) error {
	if !c.Locals("account").(types.Account).Permissions.ReadFiles {
		return c.Status(403).JSON(fiber.Map{"err": "No permission!"})
	}

	filepathParam := c.Params("filepath")
	if filepathParam == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Filepath is required"})
	}

	filepathParam, err := url.PathUnescape(filepathParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"err": "Invalid filepath encoding"})
	}

	config := &config.Config
	scope := c.Locals("account").(types.Account).Scope
	fullPath := fmt.Sprintf("%s%s", config.GetScopedFolder(scope), filepathParam)

	if ok := utils.IsSafePathForScope(fullPath, scope); !ok {
		return c.Status(403).JSON(
			fiber.Map{"err": "forbidden"},
		)
	}

	if utils.IsNotExistingPath(fullPath) {
		return c.Status(404).JSON(fiber.Map{"err": "File not found"})
	}

	fileInfo, err := os.Stat(fullPath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Could not read file info"})
	}

	if fileInfo.IsDir() {
		return c.Status(400).JSON(fiber.Map{"err": "Path is a directory, not a file"})
	}

	file, err := os.Open(fullPath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Could not open file"})
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(filepathParam))
	contentType := "application/octet-stream"

	switch ext {
	case ".pdf":
		contentType = "application/pdf"
	case ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg":
		contentType = "image/" + strings.TrimPrefix(ext, ".")
		if ext == ".jpg" {
			contentType = "image/jpeg"
		}
	case ".mp4", ".webm", ".ogg", ".mov", ".avi":
		contentType = "video/" + strings.TrimPrefix(ext, ".")
	case ".mp3", ".wav", ".flac", ".m4a", ".opus":
		contentType = "audio/" + strings.TrimPrefix(ext, ".")
	default:
		return c.Status(400).JSON(fiber.Map{"err": "File content type is not supported"})
	}

	c.Set("Content-Type", contentType)
	c.Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s\"", fileInfo.Name()))
	c.Set("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))
	c.Set("Accept-Ranges", "bytes")

	return c.SendFile(fullPath)
}
