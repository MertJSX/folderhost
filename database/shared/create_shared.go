package shared

import (
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func CreateShared(record types.Shared) error {
	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return fmt.Errorf("begin transaction error: %w", err)
	}

	stmt, err := tx.Prepare(`
		INSERT INTO shared(
			username,
			userID,
			path,
			password,
			downloadLimit,
			public
		) VALUES(?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("error creating db stmt")
	}
	defer stmt.Close()

	_, err = stmt.Exec(
		record.Username,
		record.UserID,
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
