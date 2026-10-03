package recovery

import (
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
)

func DeleteRecoveryRecord(id int, scope string) error {
	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return fmt.Errorf("Begin transaction error: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		DELETE FROM recovery WHERE id = ? AND oldLocation LIKE ?;
	`)

	if err != nil {
		return fmt.Errorf("error creating db stmt")
	}

	defer stmt.Close()

	_, err = stmt.Exec(
		id,
		scope+"%",
	)

	if err != nil {
		return fmt.Errorf("error executing db stmt")
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("error commiting db changes")
	}

	return nil
}

func DeleteRecoveryRecordByID(id int) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction error: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`DELETE FROM recovery WHERE id = ?;`)
	if err != nil {
		return fmt.Errorf("error creating db stmt: %w", err)
	}
	defer stmt.Close()

	if _, err := stmt.Exec(id); err != nil {
		return fmt.Errorf("error executing db stmt: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error committing db changes: %w", err)
	}

	return nil
}
