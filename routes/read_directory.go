package routes

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"time"

	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/cache"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/gofiber/fiber/v2"
)

func ReadDirectory(c *fiber.Ctx) error {
	if !c.Locals("account").(types.Account).Permissions.ReadDirectories {
		return c.Status(403).JSON(
			fiber.Map{"err": "No permission!"},
		)
	}

	scope := c.Locals("account").(types.Account).Scope
	path := c.Query("folder")
	mode := c.Query("mode")
	caching := c.Query("caching")

	if mode != "Quality mode" && mode != "Optimized mode" {
		mode = "Optimized mode"
	}

	config := &config.Config

	if path == "/" {
		path = ""
	}

	var dirPath string = fmt.Sprintf("%s%s", config.GetScopedFolder(scope), path)
	directoryData, err := os.Stat(dirPath)
	var pathCacheName string = dirPath

	if os.IsNotExist(err) {
		return c.Status(400).JSON(
			fiber.Map{"err": "Wrong dirpath!"},
		)
	}

	if err != nil {
		if errors.Is(err, syscall.ENOTDIR) {
			return c.Status(400).JSON(
				fiber.Map{"err": "Dirpath is not a directory!"},
			)
		}
		return c.Status(400).JSON(
			fiber.Map{"err": "Unknown error!"},
		)
	}

	if !directoryData.IsDir() {
		return c.Status(400).JSON(fiber.Map{"err": "Dirpath is not a directory!"})
	}

	dirCache, ok := cache.DirectoryCache.Get(cache.DirectoryCacheKey{
		Path:  pathCacheName,
		Scope: scope,
	})

	if ok && dirCache.DirectoryInfo.DateModified != directoryData.ModTime() {
		if ok {
			cache.DirectoryCache.DeleteDirCacheItemsByPath(pathCacheName)
		}
		ok = false
	}

	if caching != "false" {
		if mode == "Quality mode" && dirCache.StorageInfo && ok {
			return c.Status(200).JSON(fiber.Map{
				"items":         dirCache.Items,
				"directoryInfo": dirCache.DirectoryInfo,
			})
		} else if ok && mode != "Quality mode" {
			return c.Status(200).JSON(fiber.Map{
				"items":         dirCache.Items,
				"directoryInfo": dirCache.DirectoryInfo,
			})
		}
	}

	trimmedPath := func() string {
		if utils.LastChar(dirPath) == "/" {
			return dirPath[0 : len(dirPath)-1]
		} else {
			return dirPath
		}
	}

	cleanedPath := filepath.Clean(trimmedPath())
	folderName := filepath.Base(cleanedPath)
	dirPath = utils.ReplacePathPrefix(dirPath, config.GetScopedFolder(scope))

	directoryInfo := types.DirectoryItem{
		Name:         folderName,
		ParentPath:   utils.GetParentPath(dirPath),
		Path:         dirPath,
		IsDirectory:  directoryData.IsDir(),
		DateModified: directoryData.ModTime(),
		Size:         "N/A",
		SizeBytes:    directoryData.Size(),
	}

	if config.StorageLimit != "" {
		directoryInfo.StorageLimit = config.StorageLimit
	} else {
		directoryInfo.StorageLimit = "UNLIMITED"
	}

	data, mainDirectorySize := utils.GetDirectoryItems(fmt.Sprintf("%s%s", config.GetScopedFolder(scope), path), mode, scope)

	if mainDirectorySize != 0 {
		directoryInfo.SizeBytes = mainDirectorySize
		directoryInfo.Size = utils.ConvertBytesToString(mainDirectorySize)
	}

	directoryInfo.Id = -1

	if caching == "false" {
		cache.DirectoryCache.SetWithoutEventTriggering(cache.DirectoryCacheKey{
			Path:  pathCacheName,
			Scope: scope,
		}, types.ReadDirCache{
			Items:         data,
			DirectoryInfo: directoryInfo,
			StorageInfo:   mode == "Quality mode",
		}, 600*time.Second)
	} else {
		cache.DirectoryCache.Set(cache.DirectoryCacheKey{
			Path:  pathCacheName,
			Scope: scope,
		}, types.ReadDirCache{
			Items:         data,
			DirectoryInfo: directoryInfo,
			StorageInfo:   mode == "Quality mode",
		}, 600*time.Second)
	}

	return c.JSON(
		fiber.Map{
			"items":         data,
			"directoryInfo": directoryInfo,
		},
	)
}
