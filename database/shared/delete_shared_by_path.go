package shared

import (
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
)

func DeleteSharedByPath(userID int, path string) error {
	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return fmt.Errorf("begin transaction error: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("DELETE FROM shared WHERE userID=? AND path=?")
	if err != nil {
		return fmt.Errorf("error creating db stmt")
	}
	defer stmt.Close()

	_, err = stmt.Exec(userID, path)
	if err != nil {
		return fmt.Errorf("error executing db stmt: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("error commiting db changes: %w", err)
	}

	return nil
}
