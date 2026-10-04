package logs

import (
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func ClearOldLogs(days int) error {
	if days <= 0 {
		return nil
	}

	tx, err := database.DB.Begin()
	if err != nil {
		log.Printf("Begin transaction error: %v", err)
		return fmt.Errorf("begin transaction error: %w", err)
	}
	defer tx.Rollback()

	query := fmt.Sprintf(`
		DELETE FROM logs 
		WHERE created_at < datetime('now', '-%d days');
	`, days)

	stmt, err := tx.Prepare(query)
	if err != nil {
		log.Printf("Error preparing statement: %v", err)
		return fmt.Errorf("error creating db stmt: %w", err)
	}
	defer stmt.Close()

	result, err := stmt.Exec()
	if err != nil {
		log.Printf("Error executing statement: %v", err)
		return fmt.Errorf("error executing db stmt: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		return fmt.Errorf("error getting rows affected: %w", err)
	}

	if err = tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		return fmt.Errorf("error committing db changes: %w", err)
	}

	if rowsAffected < 1 {
		return nil
	}

	if err := CreateLog(types.AuditLog{
		Username:    "system",
		Action:      "Logs cleanup",
		Description: fmt.Sprintf("Successfully cleared %d old log records (older than %d days)", rowsAffected, days),
	}); err != nil {
		fmt.Printf("Failed to create audit log: %s\n", err)
	}
	return nil
}
