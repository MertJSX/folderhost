package utils

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/MertJSX/folderhost/utils/config"
)

func IsSafePath(requestedPath string) bool {
	baseDir := filepath.Clean(fmt.Sprintf("./%s", config.Config.Folder))

	fullPath := filepath.Join(baseDir, requestedPath)

	cleanPath := filepath.Clean(fullPath)

	rel, err := filepath.Rel(baseDir, cleanPath)
	if err != nil {
		return false
	}

	return !strings.HasPrefix(rel, "..")
}

func IsSafePathForScope(requestedPath string, userScope string) bool {
	globalBase := filepath.Clean(fmt.Sprintf("./%s", config.Config.Folder))
	scopedBase := filepath.Join(globalBase, userScope)
	cleanPath := filepath.Clean(requestedPath)
	rel, err := filepath.Rel(scopedBase, cleanPath)
	if err != nil {
		return false
	}
	return !strings.HasPrefix(rel, "..")
}
