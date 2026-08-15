package users

import (
	"github.com/MertJSX/folderhost/database"
)

func RemoveUser(id int) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Cascade delete shared links
	if _, err := tx.Exec("DELETE FROM shared WHERE userID = ?", id); err != nil {
		return err
	}

	if _, err := tx.Exec("DELETE FROM users WHERE id = ?", id); err != nil {
		return err
	}

	return tx.Commit()
}
