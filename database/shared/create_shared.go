package shared

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

var ErrSharedAlreadyExists = errors.New("shared already exists")

func generateID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func CreateShared(record *types.Shared) (*types.Shared, error) {
	row := database.DB.QueryRow("SELECT id, username, userID, displayName, path, password, expires_at, downloadCount, file_extension, created_at FROM shared WHERE userID=? AND path=?", record.UserID, record.Path)

	var existing types.Shared
	var password sql.NullString
	var expiresAt sql.NullString
	var createdAt sql.NullString

	err := row.Scan(
		&existing.ID,
		&existing.Username,
		&existing.UserID,
		&existing.DisplayName,
		&existing.Path,
		&password,
		&expiresAt,
		&existing.DownloadCount,
		&existing.FileExtension,
		&createdAt,
	)

	if err == nil {
		if password.Valid {
			existing.Password = password.String
		}
		if expiresAt.Valid {
			existing.ExpiresAt = expiresAt.String
		}
		if createdAt.Valid {
			existing.CreatedAt = createdAt.String
		}
		return &existing, ErrSharedAlreadyExists
	} else if err != sql.ErrNoRows {
		return nil, fmt.Errorf("error checking existing shared: %w", err)
	}

	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return nil, fmt.Errorf("begin transaction error: %w", err)
	}
	defer tx.Rollback()

	var id string
	for {
		newId, err := generateID()
		if err != nil {
			return nil, fmt.Errorf("error generating id: %w", err)
		}

		var exists bool
		err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM shared WHERE id=?)", newId).Scan(&exists)
		if err != nil {
			return nil, fmt.Errorf("error checking id existence: %w", err)
		}
		if !exists {
			id = newId
			break
		}
	}
	record.ID = id

	stmt, err := tx.Prepare(`
		INSERT INTO shared(
			id,
			username,
			userID,
			displayName,
			path,
			password,
			expires_at,
			file_extension
		) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return nil, fmt.Errorf("error creating db stmt")
	}
	defer stmt.Close()

	var insertExpiresAt interface{}
	if record.ExpiresAt != "" {
		insertExpiresAt = record.ExpiresAt
	} else {
		insertExpiresAt = nil
	}

	_, err = stmt.Exec(
		record.ID,
		record.Username,
		record.UserID,
		record.DisplayName,
		record.Path,
		record.Password,
		insertExpiresAt,
		record.FileExtension,
	)
	if err != nil {
		return nil, fmt.Errorf("error executing db stmt: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("error commiting db changes: %w", err)
	}

	return record, nil
}
