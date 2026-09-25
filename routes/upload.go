package routes

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

const (
	chunkBufferSize   = 16 * 1024 * 1024 // 16 MB
	expectedChunkSize = 16 * 1024 * 1024
)

func validateFileName(name string) error {
	if name == "" {
		return fmt.Errorf("empty file name")
	}
	if len(name) > 255 {
		return fmt.Errorf("file name too long")
	}
	if name == "." || name == ".." {
		return fmt.Errorf("invalid file name")
	}
	if strings.ContainsAny(name, "/\\") {
		return fmt.Errorf("file name contains path separator")
	}
	if strings.Contains(name, "..") {
		return fmt.Errorf("file name contains '..'")
	}
	return nil
}

func ensureNotExists(path string) error {
	if _, err := os.Stat(path); err == nil {
		return fmt.Errorf("file already exists")
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("couldn't check file existence")
	}
	return nil
}

func ChunkedUpload(c *fiber.Ctx) error {
	if !c.Locals("account").(types.Account).Permissions.UploadFiles {
		return c.Status(403).JSON(fiber.Map{"err": "No permission!"})
	}

	config := &config.Config
	targetPath := c.Query("path")
	scope := c.Locals("account").(types.Account).Scope

	if targetPath == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Missing path query"})
	}

	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(500).SendString("Couldn't read form: " + err.Error())
	}
	defer form.RemoveAll()

	files := form.File["files"]
	if len(files) > 1 {
		return handleMultipleUpload(c, files, targetPath, scope)
	}
	if len(files) == 1 {
		return handleSingleFileFromMultiple(c, files[0], targetPath, scope)
	}

	chunkIndex := c.FormValue("chunkIndex")
	totalChunks := c.FormValue("totalChunks")
	fileName := c.FormValue("fileName")

	if err := validateFileName(fileName); err != nil {
		return c.Status(400).JSON(fiber.Map{"err": "Invalid file name: " + err.Error()})
	}

	total, err := strconv.ParseInt(totalChunks, 10, 64)
	if err != nil || total <= 0 {
		return c.Status(400).JSON(fiber.Map{"err": "Invalid totalChunks"})
	}

	currentChunk, err := strconv.Atoi(chunkIndex)
	if err != nil || currentChunk < 0 || currentChunk >= int(total) {
		return c.Status(400).JSON(fiber.Map{"err": "Invalid chunkIndex"})
	}

	scopedFolder := config.GetScopedFolder(scope)
	finalPath := filepath.Join(scopedFolder, targetPath, fileName)

	if err := os.MkdirAll(filepath.Dir(finalPath), 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't create directory"})
	}

	if total == 1 {
		if err := ensureNotExists(finalPath); err != nil {
			return c.Status(409).JSON(fiber.Map{"err": err.Error()})
		}

		chunkFile, err := form.File["file"][0].Open()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"err": "Couldn't open file"})
		}
		defer chunkFile.Close()

		outFile, err := os.Create(finalPath)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"err": "Couldn't create file"})
		}
		defer outFile.Close()

		buf := make([]byte, chunkBufferSize)
		if _, err := io.CopyBuffer(outFile, chunkFile, buf); err != nil {
			return c.Status(500).JSON(fiber.Map{"err": "Couldn't save file"})
		}

		logs.CreateLog(types.AuditLog{
			Username:    c.Locals("account").(types.Account).Username,
			Action:      "Upload",
			Description: fmt.Sprintf("%s uploaded a %s file.", c.Locals("account").(types.Account).Username, fileName),
		})

		return c.JSON(fiber.Map{
			"response": "Successfully uploaded!",
			"uploaded": true,
		})
	}

	if currentChunk == 0 {
		if err := ensureNotExists(finalPath); err != nil {
			return c.Status(409).JSON(fiber.Map{"err": err.Error()})
		}
	}

	chunkFile, err := form.File["file"][0].Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't open chunk"})
	}
	defer chunkFile.Close()

	outFile, err := os.OpenFile(finalPath, os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't open target file"})
	}
	defer outFile.Close()

	chunkSizeStr := c.FormValue("chunkSize")
	chunkSize, err := strconv.ParseInt(chunkSizeStr, 10, 64)
	if err != nil || chunkSize <= 0 {
		chunkSize = expectedChunkSize
	}
	if chunkSize != expectedChunkSize {
		return c.Status(400).JSON(fiber.Map{"err": "Invalid chunk size"})
	}

	offset := int64(currentChunk) * chunkSize
	buf := make([]byte, chunkBufferSize)

	if _, err := outFile.Seek(offset, io.SeekStart); err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't seek to chunk offset"})
	}

	if _, err := io.CopyBuffer(outFile, chunkFile, buf); err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't save chunk"})
	}

	if currentChunk == int(total)-1 {
		logs.CreateLog(types.AuditLog{
			Username:    c.Locals("account").(types.Account).Username,
			Action:      "Upload",
			Description: fmt.Sprintf("%s uploaded a %s file.", c.Locals("account").(types.Account).Username, fileName),
		})

		return c.JSON(fiber.Map{
			"response": "Successfully uploaded!",
			"uploaded": true,
		})
	}

	return c.JSON(fiber.Map{
		"response": fmt.Sprintf("Uploaded chunk %s", chunkIndex),
	})
}

func handleMultipleUpload(c *fiber.Ctx, files []*multipart.FileHeader, targetPath, scope string) error {
	config := &config.Config

	type uploadResult struct {
		FileName string `json:"fileName"`
		Status   string `json:"status"`
		Error    string `json:"error,omitempty"`
	}

	results := make([]uploadResult, len(files))
	var wg sync.WaitGroup
	var mu sync.Mutex
	successCount := 0

	scopedFolder := config.GetScopedFolder(scope)
	targetDir := filepath.Join(scopedFolder, targetPath)

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't create directory"})
	}

	for i, fileHeader := range files {
		wg.Add(1)
		go func(idx int, fh *multipart.FileHeader) {
			defer wg.Done()

			if err := validateFileName(fh.Filename); err != nil {
				mu.Lock()
				results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: "Invalid file name: " + err.Error()}
				mu.Unlock()
				return
			}

			finalPath := filepath.Join(targetDir, fh.Filename)

			if err := ensureNotExists(finalPath); err != nil {
				mu.Lock()
				results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: err.Error()}
				mu.Unlock()
				return
			}

			file, err := fh.Open()
			if err != nil {
				mu.Lock()
				results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: "Couldn't open file"}
				mu.Unlock()
				return
			}
			defer file.Close()

			outFile, err := os.Create(finalPath)
			if err != nil {
				mu.Lock()
				results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: "Couldn't create file"}
				mu.Unlock()
				return
			}
			defer outFile.Close()

			buf := make([]byte, chunkBufferSize)
			if _, err := io.CopyBuffer(outFile, file, buf); err != nil {
				mu.Lock()
				results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: "Couldn't save file"}
				mu.Unlock()
				return
			}

			mu.Lock()
			results[idx] = uploadResult{FileName: fh.Filename, Status: "success"}
			successCount++
			mu.Unlock()
		}(i, fileHeader)
	}

	wg.Wait()

	if successCount > 0 {
		logs.CreateLog(types.AuditLog{
			Username:    c.Locals("account").(types.Account).Username,
			Action:      "Upload",
			Description: fmt.Sprintf("%s uploaded %d file(s)", c.Locals("account").(types.Account).Username, successCount),
		})
	}

	return c.JSON(fiber.Map{
		"response": fmt.Sprintf("Successfully uploaded %d file(s)", successCount),
		"uploaded": true,
		"multiple": true,
		"results":  results,
		"success":  successCount,
		"failed":   len(files) - successCount,
	})
}

func handleSingleFileFromMultiple(c *fiber.Ctx, fileHeader *multipart.FileHeader, targetPath, scope string) error {
	config := &config.Config

	if err := validateFileName(fileHeader.Filename); err != nil {
		return c.Status(400).JSON(fiber.Map{"err": "Invalid file name: " + err.Error()})
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't open file"})
	}
	defer file.Close()

	scopedFolder := config.GetScopedFolder(scope)
	finalPath := filepath.Join(scopedFolder, targetPath, fileHeader.Filename)

	if err := os.MkdirAll(filepath.Dir(finalPath), 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't create directory"})
	}

	if err := ensureNotExists(finalPath); err != nil {
		return c.Status(409).JSON(fiber.Map{"err": err.Error()})
	}

	outFile, err := os.Create(finalPath)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't create file"})
	}
	defer outFile.Close()

	buf := make([]byte, chunkBufferSize)
	if _, err := io.CopyBuffer(outFile, file, buf); err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't save file"})
	}

	logs.CreateLog(types.AuditLog{
		Username:    c.Locals("account").(types.Account).Username,
		Action:      "Upload",
		Description: fmt.Sprintf("%s uploaded a %s file.", c.Locals("account").(types.Account).Username, fileHeader.Filename),
	})

	return c.JSON(fiber.Map{
		"response": "Successfully uploaded!",
		"uploaded": true,
	})
}
