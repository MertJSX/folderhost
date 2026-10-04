package recovery

import (
	"fmt"
	"time"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func GetExpiredRecoveryRecords(timeout time.Duration) ([]types.RecoveryRecord, error) {
	cutoff := time.Now().UTC().Add(-timeout)
	cutoffStr := cutoff.Format("2006-01-02 15:04:05")

	rows, err := database.DB.Query(`
		SELECT * FROM recovery WHERE created_at < ? ORDER BY created_at ASC;
	`, cutoffStr)

	if err != nil {
		return nil, fmt.Errorf("error while getting expired recovery records: %v", err)
	}
	defer rows.Close()

	var foundList []types.RecoveryRecord

	for rows.Next() {
		var record types.RecoveryRecord
		if err := rows.Scan(
			&record.Id,
			&record.Username,
			&record.OldLocation,
			&record.BinLocation,
			&record.IsDirectory,
			&record.SizeDisplay,
			&record.SizeBytes,
			&record.CreatedAt); err != nil {
			return nil, fmt.Errorf("error while scanning expired recovery record: %v", err)
		}
		foundList = append(foundList, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error while iterating expired recovery records: %v", err)
	}

	return foundList, nil
}
