package utils

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/MertJSX/folderhost/database/shared"
)

func InjectShareMetaTags(htmlStr string, shareID string, baseURL string) string {
	record, err := shared.GetSharedByID(shareID)
	if err != nil || record == nil {
		return htmlStr
	}

	fullPath := record.Path

	sizeStr := "Unknown size"
	if fileInfo, err := os.Stat(fullPath); err == nil {
		sizeStr = ConvertBytesToString(fileInfo.Size())
	}

	var dateStr string
	if t, err := time.Parse("2006-01-02 15:04:05", record.CreatedAt); err == nil {
		dateStr = t.Format("January 02, 2006 at 15:04")
	} else if t, err := time.Parse(time.RFC3339, record.CreatedAt); err == nil {
		dateStr = t.Format("January 02, 2006 at 15:04")
	} else {
		dateStr = strings.Split(record.CreatedAt, " ")[0]
		if dateStr == "" {
			dateStr = record.CreatedAt
		}
	}

	description := fmt.Sprintf("Download using FolderHost, a self-hosted open-source cloud storage platform.\n\nSize: %s\nShared by: %s\nDate: %s\nTotal downloads: %d",
		sizeStr,
		record.Username,
		dateStr,
		record.DownloadCount)

	metaTags := fmt.Sprintf(`
		<meta property="og:title" content="Download %s" />
		<meta property="og:description" content="%s" />
		<meta property="og:type" content="website" />
		<meta property="og:image" content="%s/favicon.webp" />
		<meta name="theme-color" content="#0284c7" />
	`, record.DisplayName, description, baseURL)

	htmlStr = strings.Replace(htmlStr, "</head>", metaTags+"</head>", 1)
	htmlStr = strings.Replace(htmlStr, "<title>FolderHost</title>", fmt.Sprintf("<title>%s - FolderHost</title>", record.DisplayName), 1)

	return htmlStr
}
