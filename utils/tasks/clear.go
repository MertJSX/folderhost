package tasks

import (
	"fmt"
	"time"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/utils/config"
)

func AutoClearOldLogs() {
	time.Sleep(10 * time.Second)

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	config := &config.Config

	if config.ClearLogsAfter > 0 {
		err := logs.ClearOldLogs(config.ClearLogsAfter)
		if err != nil {
			fmt.Printf("Error while clearing old logs: %s\n", err)
		}
	} else {
		return
	}

	for range ticker.C {
		if config.ClearLogsAfter > 0 {
			err := logs.ClearOldLogs(config.ClearLogsAfter)
			if err != nil {
				fmt.Printf("Error while clearing old logs: %s\n", err)
			}
		}
	}
}
