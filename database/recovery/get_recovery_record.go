package recovery

import (
	"fmt"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func GetRecoveryRecord(id int) (types.RecoveryRecord, error) {
	var record types.RecoveryRecord
	rows, err := database.DB.Query(`
		SELECT * FROM recovery WHERE id = ?;
	`, id)

	if err != nil {
		return record, fmt.Errorf("error while getting recovery records: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		if err := rows.Scan(
			&record.Id,
			&record.Username,
			&record.OldLocation,
			&record.BinLocation,
			&record.IsDirectory,
			&record.SizeDisplay,
			&record.SizeBytes,
			&record.CreatedAt); err != nil {
			fmt.Println(err)
			return record, fmt.Errorf("error while getting recovery records: %v", err)
		}
	}

	if err := rows.Err(); err != nil {
		return record, fmt.Errorf("error while getting recovery records: %v", err)
	}

	return record, nil
}

func GetRecoveryRecordsByLocationPrefix(id int, locationPrefix string) ([]types.RecoveryRecord, error) {
	var records []types.RecoveryRecord
	rows, err := database.DB.Query(`
		SELECT * FROM recovery WHERE id = ? AND oldLocation LIKE ?;
	`, id, locationPrefix+"%")

	if err != nil {
		return records, fmt.Errorf("error while getting recovery records: %v", err)
	}
	defer rows.Close()

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
			fmt.Println(err)
			return records, fmt.Errorf("error while getting recovery records: %v", err)
		}
		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return records, fmt.Errorf("error while getting recovery records: %v", err)
	}

	return records, nil
}
