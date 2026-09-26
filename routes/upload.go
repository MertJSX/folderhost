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
	"sync/atomic"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

const (
	chunkBufferSize   = 16 * 1024 * 1024 // 16 MB
	expectedChunkSize = 16 * 1024 * 1024
)

type uploadState struct {
	once     *sync.Once
	failed   atomic.Bool
	received atomic.Int32
	total    int32
}

var uploadStates sync.Map // fileID -> *uploadState

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

func checkOnce(fileID, finalPath string, total int32) bool {
	actual, _ := uploadStates.LoadOrStore(fileID, &uploadState{
		once:  &sync.Once{},
		total: total,
	})
	state := actual.(*uploadState)

	state.once.Do(func() {
		f, err := os.OpenFile(finalPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
		if err != nil {
			state.failed.Store(true)
			return
		}
		f.Close()
		state.failed.Store(false)
	})

	return state.failed.Load()
}

func markReceived(fileID string) {
	val, ok := uploadStates.Load(fileID)
	if !ok {
		return
	}
	state := val.(*uploadState)
	n := state.received.Add(1)
	if n == state.total {
		uploadStates.Delete(fileID)
	}
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
	fileID := c.FormValue("fileID")

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
		outFile, err := os.OpenFile(finalPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
		if err != nil {
			if os.IsExist(err) {
				return c.Status(409).JSON(fiber.Map{"err": "File already exists"})
			}
			return c.Status(500).JSON(fiber.Map{"err": "Couldn't create file"})
		}
		defer outFile.Close()

		chunkFile, err := form.File["file"][0].Open()
		if err != nil {
			os.Remove(finalPath)
			return c.Status(500).JSON(fiber.Map{"err": "Couldn't open file"})
		}
		defer chunkFile.Close()

		buf := make([]byte, chunkBufferSize)
		if _, err := io.CopyBuffer(outFile, chunkFile, buf); err != nil {
			os.Remove(finalPath)
			return c.Status(500).JSON(fiber.Map{"err": "Couldn't save file"})
		}

		logs.CreateLog(types.AuditLog{
			Username:    c.Locals("account").(types.Account).Username,
			Action:      "Upload",
			Description: fmt.Sprintf("%s uploaded a %s file.", c.Locals("account").(types.Account).Username, fileName),
		})

		return c.JSON(fiber.Map{"response": "Successfully uploaded!", "uploaded": true})
	}

	// ---- ÇOK CHUNK'LI ----
	if fileID == "" {
		return c.Status(400).JSON(fiber.Map{"err": "Missing fileID"})
	}

	// İlk gelen chunk kontrolü yapar, diğerleri bekler.
	failed := checkOnce(fileID, finalPath, int32(total))

	// Her chunk geldiğinde sayacı artır (başarılı veya değil).
	defer markReceived(fileID)

	if failed {
		return c.Status(409).JSON(fiber.Map{"err": "File already exists"})
	}

	outFile, err := os.OpenFile(finalPath, os.O_WRONLY, 0644)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't open file"})
	}
	defer outFile.Close()

	chunkFile, err := form.File["file"][0].Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't open chunk"})
	}
	defer chunkFile.Close()

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

		return c.JSON(fiber.Map{"response": "Successfully uploaded!", "uploaded": true})
	}

	return c.JSON(fiber.Map{"response": fmt.Sprintf("Uploaded chunk %d", currentChunk)})
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

			outFile, err := os.OpenFile(finalPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
			if err != nil {
				mu.Lock()
				if os.IsExist(err) {
					results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: "File already exists"}
				} else {
					results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: "Couldn't create file"}
				}
				mu.Unlock()
				return
			}
			defer outFile.Close()

			file, err := fh.Open()
			if err != nil {
				os.Remove(finalPath)
				mu.Lock()
				results[idx] = uploadResult{FileName: fh.Filename, Status: "failed", Error: "Couldn't open file"}
				mu.Unlock()
				return
			}
			defer file.Close()

			buf := make([]byte, chunkBufferSize)
			if _, err := io.CopyBuffer(outFile, file, buf); err != nil {
				os.Remove(finalPath)
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

	scopedFolder := config.GetScopedFolder(scope)
	finalPath := filepath.Join(scopedFolder, targetPath, fileHeader.Filename)

	if err := os.MkdirAll(filepath.Dir(finalPath), 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't create directory"})
	}

	outFile, err := os.OpenFile(finalPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0644)
	if err != nil {
		if os.IsExist(err) {
			return c.Status(409).JSON(fiber.Map{"err": "File already exists"})
		}
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't create file"})
	}
	defer outFile.Close()

	file, err := fileHeader.Open()
	if err != nil {
		os.Remove(finalPath)
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't open file"})
	}
	defer file.Close()

	buf := make([]byte, chunkBufferSize)
	if _, err := io.CopyBuffer(outFile, file, buf); err != nil {
		os.Remove(finalPath)
		return c.Status(500).JSON(fiber.Map{"err": "Couldn't save file"})
	}

	logs.CreateLog(types.AuditLog{
		Username:    c.Locals("account").(types.Account).Username,
		Action:      "Upload",
		Description: fmt.Sprintf("%s uploaded a %s file.", c.Locals("account").(types.Account).Username, fileHeader.Filename),
	})

	return c.JSON(fiber.Map{"response": "Successfully uploaded!", "uploaded": true})
}
