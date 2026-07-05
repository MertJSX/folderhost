package shared

import (
	"database/sql"
	"fmt"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func GetSharedPagination(page int, limit int, userID int) ([]types.Shared, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10 // default limit
	}
	
	offset := (page - 1) * limit
	var rows *sql.Rows
	var err error

	if userID > 0 {
		rows, err = database.DB.Query(
			"SELECT id, username, userID, path, password, downloadLimit, downloadCount, public, created_at FROM shared WHERE userID=? ORDER BY created_at DESC LIMIT ? OFFSET ?",
			userID, limit, offset,
		)
	} else {
		rows, err = database.DB.Query(
			"SELECT id, username, userID, path, password, downloadLimit, downloadCount, public, created_at FROM shared ORDER BY created_at DESC LIMIT ? OFFSET ?",
			limit, offset,
		)
	}

	if err != nil {
		return nil, fmt.Errorf("error fetching shared records: %w", err)
	}
	defer rows.Close()

	var records []types.Shared

	for rows.Next() {
		var record types.Shared
		var password sql.NullString
		var createdAt sql.NullString

		err := rows.Scan(
			&record.ID,
			&record.Username,
			&record.UserID,
			&record.Path,
			&password,
			&record.DownloadLimit,
			&record.DownloadCount,
			&record.Public,
			&createdAt,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning shared record: %w", err)
		}

		if password.Valid {
			record.Password = password.String
		}
		if createdAt.Valid {
			record.CreatedAt = createdAt.String
		}

		records = append(records, record)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return records, nil
}
