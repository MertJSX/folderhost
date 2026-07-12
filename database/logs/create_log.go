package logs

import (
	"fmt"
	"log"
	"regexp"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils/config"
)

func CreateLog(logItem types.AuditLog) error {
	if !config.Config.LogActivities {
		return nil
	}
	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return fmt.Errorf("Begin transaction error: %w", err)
	}
	defer tx.Rollback()

	logItem.Description = normalizeSlashes(logItem.Description)

	stmt, err := tx.Prepare(`
		INSERT INTO logs(
			username,
			action,
			description
		) VALUES(?, ?, ?)
	`)

	if err != nil {
		return fmt.Errorf("error creating db stmt")
	}

	defer stmt.Close()

	_, err = stmt.Exec(
		logItem.Username,
		logItem.Action,
		logItem.Description,
	)

	if err != nil {
		return fmt.Errorf("error executing db stmt")
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("error commiting db changes")
	}

	return nil
}

func normalizeSlashes(input string) string {
	re := regexp.MustCompile(`/+`)
	return re.ReplaceAllString(input, "/")
}
