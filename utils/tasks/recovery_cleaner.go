package tasks

import (
	"fmt"
	"os"
	"time"

	"github.com/MertJSX/folderhost/database/logs"
	"github.com/MertJSX/folderhost/database/recovery"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
)

func AutoCleanupRecovery() {
	time.Sleep(10 * time.Second)

	config := &config.Config

	if config.AutoCleanupRecovery == "" || config.AutoCleanupRecovery == "0" {
		return
	}

	timeout, err := utils.ParseExtendedDuration(config.AutoCleanupRecovery)
	if err != nil {
		fmt.Printf("Invalid auto_cleanup_recovery value: %s\n", err)
		return
	}

	if timeout <= 0 {
		return
	}

	interval := timeout / 20
	if interval < 5*time.Second {
		interval = 5 * time.Second
	}

	runRecoveryCleanup(timeout)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		runRecoveryCleanup(timeout)
	}
}

func runRecoveryCleanup(timeout time.Duration) {
	expired, err := recovery.GetExpiredRecoveryRecords(timeout)
	if err != nil {
		fmt.Printf("Error while fetching expired recovery records: %s\n", err)
		return
	}

	if len(expired) == 0 {
		return
	}

	removed := 0
	failed := 0

	for _, record := range expired {
		if removeRecoveryRecord(record) {
			removed++
		} else {
			failed++
		}
	}

	if removed > 0 || failed > 0 {
		description := fmt.Sprintf("Removed %d expired recovery record(s)", removed)
		if failed > 0 {
			description += fmt.Sprintf(" (%d failed)", failed)
		}

		if err := logs.CreateLog(types.AuditLog{
			Username:    "system",
			Action:      "Recovery cleanup",
			Description: description,
		}); err != nil {
			fmt.Printf("Failed to create audit log: %s\n", err)
		}
	}
}

func removeRecoveryRecord(record types.RecoveryRecord) bool {
	if _, err := os.Stat(record.BinLocation); err != nil {
		if os.IsNotExist(err) {
			if dbErr := recovery.DeleteRecoveryRecordByID(record.Id); dbErr != nil {
				fmt.Printf("Failed to delete DB record %d: %s\n", record.Id, dbErr)
				return false
			}
			return true
		}
		fmt.Printf("Failed to stat %s: %s\n", record.BinLocation, err)
		return false
	}

	if !utils.IsSafePath(record.BinLocation) {
		fmt.Printf("Skipping unsafe path (possible traversal): %s\n", record.BinLocation)
		return false
	}

	if err := os.RemoveAll(record.BinLocation); err != nil {
		fmt.Printf("Failed to remove %s: %s\n", record.BinLocation, err)
		return false
	}

	if err := recovery.DeleteRecoveryRecordByID(record.Id); err != nil {
		fmt.Printf("Failed to delete DB record %d (file already removed): %s\n", record.Id, err)
		return false
	}

	return true
}
