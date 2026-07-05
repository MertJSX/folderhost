package shared

import (
	"database/sql"
	"fmt"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func GetSharedByID(id string) (*types.Shared, error) {
	row := database.DB.QueryRow("SELECT id, username, userID, displayName, path, password, downloadLimit, downloadCount, public, created_at FROM shared WHERE id=?", id)

	var record types.Shared
	var password sql.NullString
	var createdAt sql.NullString

	err := row.Scan(
		&record.ID,
		&record.Username,
		&record.UserID,
		&record.DisplayName,
		&record.Path,
		&password,
		&record.DownloadLimit,
		&record.DownloadCount,
		&record.Public,
		&createdAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("shared not found")
		}
		return nil, fmt.Errorf("error getting shared from db: %w", err)
	}

	if password.Valid {
		record.Password = password.String
	}
	if createdAt.Valid {
		record.CreatedAt = createdAt.String
	}

	return &record, nil
}
