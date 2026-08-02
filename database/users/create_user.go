package users

import (
	"encoding/hex"
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
)

func CreateUser(user *types.Account) error {
	if exists, _ := CheckIfUsernameExists(user.Username); exists {
		return fmt.Errorf("username already exists")
	}

	tx, err := database.DB.Begin()
	if err != nil {
		log.Fatal(err)
		return fmt.Errorf("Begin transaction error: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO users(
			username,
			password,
			email,
			scope,
			read_directories,
			read_files,
			create_permission,
			change_permission,
			delete_permission,
			move_permission,
			download_permission,
			upload_permission,
			rename_permission,
			extract_permission,
			archive_permission,
			copy_permission,
			logs_permission,
			read_recovery_permission,
			use_recovery_permission,
			read_users_permission,
			edit_users_permission
		) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)

	if err != nil {
		return fmt.Errorf("error creating db stmt")
	}

	defer stmt.Close()

	hash, err := utils.Hash([]byte(user.Password))
	if err != nil {
		return err
	}

	hashString := hex.EncodeToString(hash[:])

	_, err = stmt.Exec(
		user.Username,
		hashString,
		user.Email,
		user.Scope,
		user.Permissions.ReadDirectories,
		user.Permissions.ReadFiles,
		user.Permissions.Create,
		user.Permissions.Change,
		user.Permissions.Delete,
		user.Permissions.Move,
		user.Permissions.DownloadFiles,
		user.Permissions.UploadFiles,
		user.Permissions.Rename,
		user.Permissions.Extract,
		user.Permissions.Archive,
		user.Permissions.Copy,
		user.Permissions.ReadLogs,
		user.Permissions.ReadRecovery,
		user.Permissions.UseRecovery,
		user.Permissions.ReadUsers,
		user.Permissions.EditUsers,
	)

	if err != nil {
		return fmt.Errorf("error executing db stmt")
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit error: %w", err)
	}

	return nil
}
