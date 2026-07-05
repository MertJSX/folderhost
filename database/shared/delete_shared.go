package shared

import (
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
)

func DeleteShared(id string) error {
	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return fmt.Errorf("begin transaction error: %w", err)
	}

	stmt, err := tx.Prepare("DELETE FROM shared WHERE id=?")
	if err != nil {
		return fmt.Errorf("error creating db stmt")
	}
	defer stmt.Close()

	_, err = stmt.Exec(id)
	if err != nil {
		return fmt.Errorf("error executing db stmt: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("error commiting db changes: %w", err)
	}

	return nil
}
