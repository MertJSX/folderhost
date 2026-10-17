package websocket

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"unicode/utf8"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func processWebSocketMessage(msg []byte, filePath string, c *websocket.Conn, mt int) error {
	var message types.EditorChange
	var account types.Account = c.Locals("account").(types.Account)

	if err := json.Unmarshal(msg, &message); err != nil {
		return err
	}

	switch message.Type {
	case "editor-change":
		if !account.Permissions.Change {
			permissionError, _ := json.Marshal(fiber.Map{
				"type":  "error",
				"error": "You don't have permission to change!",
			})

			c.WriteMessage(mt, permissionError)
			return nil // Server doesn't care about permission errors
		}

		utils.ScheduleDebouncedLog(account.Username, filePath)

		utils.SendToAllExclude(filePath, mt, msg, c)
		return applyEditorChange(filePath, message.Change, &account)
	case "change-path":
		if !account.Permissions.ReadDirectories {
			permissionError, _ := json.Marshal(fiber.Map{
				"type":  "error",
				"error": "You don't have permission to read-directories!",
			})

			c.WriteMessage(mt, permissionError)
			return nil
		}

		path := config.Config.GetScopedFolder(account.Scope) + "/" + message.Path

		if !utils.IsSafePathForScope(path, account.Scope) {
			c.Close()
			return fmt.Errorf("path traversal security issue")
		}

		fileStat, err := os.Stat(path)
		if err != nil {
			c.Close()
			return fmt.Errorf("unknown error")
		}

		return utils.ChangePath(c, path, fileStat.IsDir())
	case "unzip":
		if !account.Permissions.Extract {
			permissionError, _ := json.Marshal(fiber.Map{
				"type":  "error",
				"error": "You don't have permission to unzip!",
			})

			c.WriteMessage(mt, permissionError)
			return nil // Server doesn't care about permission errors
		}

		logs.CreateLog(types.AuditLog{
			Username:    account.Username,
			Action:      "Extract file",
			Description: fmt.Sprintf("%s started unzipping %s file.", account.Username, message.Path),
		})

		HandleUnzip(c, mt, message)
	case "zip":
		if !account.Permissions.Archive {
			permissionError, _ := json.Marshal(fiber.Map{
				"type":  "error",
				"error": "You don't have permission to zip!",
			})

			c.WriteMessage(mt, permissionError)
			return nil // Server doesn't care about permission errors
		}

		logs.CreateLog(types.AuditLog{
			Username:    account.Username,
			Action:      "Archive file",
			Description: fmt.Sprintf("%s started zipping %s file.", account.Username, message.Path),
		})

		HandleZip(c, mt, message)
	}

	return nil
}

func applyEditorChange(filePath string, change types.ChangeData, account *types.Account) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	lines := strings.Split(string(content), "\n")

	startLine := change.Range.StartLineNumber - 1
	startCol := change.Range.StartColumn - 1
	endLine := change.Range.EndLineNumber - 1
	endCol := change.Range.EndColumn - 1

	startCol = adjustUTF8Position(lines, startLine, startCol)
	endCol = adjustUTF8Position(lines, endLine, endCol)

	switch change.Type {
	case "insert":
		return applyInsert(filePath, lines, startLine, startCol, change.Text, account)
	case "delete":
		return applyDelete(filePath, lines, startLine, startCol, endLine, endCol, account)
	case "replace":
		return applyReplace(filePath, lines, startLine, startCol, endLine, endCol, change.Text, account)
	default:
		return nil
	}
}

func adjustUTF8Position(lines []string, lineNum, col int) int {
	if lineNum < 0 || lineNum >= len(lines) {
		return col
	}

	line := lines[lineNum]

	if col > utf8.RuneCountInString(line) {
		return utf8.RuneCountInString(line)
	}

	return col
}

func applyInsert(filePath string, lines []string, lineNum, col int, text string, account *types.Account) error {
	if lineNum < 0 || lineNum >= len(lines) {
		return fmt.Errorf("line number out of range: %d", lineNum)
	}

	line := lines[lineNum]
	runes := []rune(line)

	if col < 0 {
		col = 0
	}
	if col > len(runes) {
		col = len(runes)
	}

	newRunes := make([]rune, 0, len(runes)+len([]rune(text)))
	newRunes = append(newRunes, runes[:col]...)
	newRunes = append(newRunes, []rune(text)...)
	newRunes = append(newRunes, runes[col:]...)

	lines[lineNum] = string(newRunes)
	return writeFile(filePath, lines, account)
}

func applyDelete(filePath string, lines []string, startLine, startCol, endLine, endCol int, account *types.Account) error {
	if startLine < 0 || startLine >= len(lines) || endLine < 0 || endLine >= len(lines) {
		return fmt.Errorf("line numbers out of range: %d-%d", startLine, endLine)
	}

	if startLine == endLine {
		line := lines[startLine]
		runes := []rune(line)

		startCol = utils.Clamp(startCol, 0, len(runes))
		endCol = utils.Clamp(endCol, 0, len(runes))

		if startCol >= endCol {
			return nil
		}

		newRunes := make([]rune, 0, len(runes)-(endCol-startCol))
		newRunes = append(newRunes, runes[:startCol]...)
		newRunes = append(newRunes, runes[endCol:]...)
		lines[startLine] = string(newRunes)

	} else {
		firstLineRunes := []rune(lines[startLine])
		lastLineRunes := []rune(lines[endLine])

		startCol = utils.Clamp(startCol, 0, len(firstLineRunes))
		endCol = utils.Clamp(endCol, 0, len(lastLineRunes))

		newFirstLine := string(firstLineRunes[:startCol])

		newLastLine := string(lastLineRunes[endCol:])

		lines[startLine] = newFirstLine + newLastLine

		if startLine < endLine {
			lines = append(lines[:startLine+1], lines[endLine+1:]...)
		}
	}

	return writeFile(filePath, lines, account)
}

func applyReplace(filePath string, lines []string, startLine, startCol, endLine, endCol int, text string, account *types.Account) error {
	if startLine == endLine {
		line := lines[startLine]
		runes := []rune(line)

		startCol = utils.Clamp(startCol, 0, len(runes))
		endCol = utils.Clamp(endCol, 0, len(runes))

		if startCol > endCol {
			return fmt.Errorf("invalid range: startCol > endCol")
		}

		textRunes := []rune(text)
		newRunes := make([]rune, 0, len(runes)-(endCol-startCol)+len(textRunes))
		newRunes = append(newRunes, runes[:startCol]...)
		newRunes = append(newRunes, textRunes...)
		newRunes = append(newRunes, runes[endCol:]...)
		lines[startLine] = string(newRunes)

	} else {
		firstLineRunes := []rune(lines[startLine])
		startCol = utils.Clamp(startCol, 0, len(firstLineRunes))

		firstPart := string(firstLineRunes[:startCol])
		newFirstLine := firstPart + text

		lastLineRunes := []rune(lines[endLine])
		endCol = utils.Clamp(endCol, 0, len(lastLineRunes))
		lastPart := string(lastLineRunes[endCol:])

		lines[startLine] = newFirstLine + lastPart

		if startLine < endLine {
			lines = append(lines[:startLine+1], lines[endLine+1:]...)
		}
	}

	return writeFile(filePath, lines, account)
}

func writeFile(filepath string, lines []string, account *types.Account) error {
	content := strings.Join(lines, "\n")

	if len(content) > 200*1024 {
		return fmt.Errorf("file size exceeds 200 KB: %d Bytes", len(content))
	}

	watcherCache, ok := cache.EditorWatcherCache.Get(filepath)
	if !ok {
		return nil
	}

	watcherCache.IsWriting = true

	cache.EditorWatcherCache.SetWithoutTTL(filepath, watcherCache)

	err := os.WriteFile(filepath, []byte(content), 0644)

	if err != nil {
		watcherCache.IsWriting = false
		cache.EditorWatcherCache.SetWithoutTTL(filepath, watcherCache)

		return err
	}

	fileStat, err := os.Stat(filepath)

	if err != nil {
		watcherCache.IsWriting = false
		cache.EditorWatcherCache.SetWithoutTTL(filepath, watcherCache)

		return err
	}

	watcherCache.LastModTime = fileStat.ModTime()
	watcherCache.IsWriting = false

	cache.EditorWatcherCache.SetWithoutTTL(filepath, watcherCache)

	// That's not the best way to update caches. Because not all scopes will be updated.
	// The problem is that if we update all directory caches on every writeFile call it will not be good for performance I think...
	if directoryCache, ok := cache.DirectoryCache.Get(cache.DirectoryCacheKey{
		Path:  utils.GetParentPath(filepath) + "/",
		Scope: account.Scope,
	}); ok {
		for index, v := range directoryCache.Items {
			v.SizeBytes = fileStat.Size()
			directoryCache.Items[index] = v
		}
		cache.DirectoryCache.Set(cache.DirectoryCacheKey{
			Path:  utils.GetParentPath(filepath) + "/",
			Scope: account.Scope,
		}, directoryCache, 600)
	}
	return nil
}
