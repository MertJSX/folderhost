package shared

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func generateID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func CreateShared(record *types.Shared) error {
	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return fmt.Errorf("begin transaction error: %w", err)
	}

	var id string
	for {
		newId, err := generateID()
		if err != nil {
			return fmt.Errorf("error generating id: %w", err)
		}

		var exists bool
		err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM shared WHERE id=?)", newId).Scan(&exists)
		if err != nil {
			return fmt.Errorf("error checking id existence: %w", err)
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
			downloadLimit,
			public
		) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("error creating db stmt")
	}
	defer stmt.Close()

	_, err = stmt.Exec(
		record.ID,
		record.Username,
		record.UserID,
		record.DisplayName,
		record.Path,
		record.Password,
		record.DownloadLimit,
		record.Public,
	)
	if err != nil {
		return fmt.Errorf("error executing db stmt: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("error commiting db changes: %w", err)
	}

	return nil
}
