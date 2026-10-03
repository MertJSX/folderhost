package users

import (
	"fmt"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
)

func UpdateUser(id int, user *types.Account) error {

	if user.Username == "system" {
		return fmt.Errorf("username 'system' is reserved")
	}

	const query = `
		UPDATE users SET
			username = ?,
			email = ?,
			scope = ?,
			read_directories = ?,
			read_files = ?,
			create_permission = ?,
			change_permission = ?,
			delete_permission = ?,
			move_permission = ?,
			download_permission = ?,
			upload_permission = ?,
			rename_permission = ?,
			extract_permission = ?,
			archive_permission = ?,
			copy_permission = ?,
			read_recovery_permission = ?,
			use_recovery_permission = ?,
			read_users_permission = ?,
			edit_users_permission = ?,
			logs_permission = ?
		WHERE id = ?;
	`

	_, err := database.DB.Exec(
		query,
		user.Username,
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
		user.Permissions.ReadRecovery,
		user.Permissions.UseRecovery,
		user.Permissions.ReadUsers,
		user.Permissions.EditUsers,
		user.Permissions.ReadLogs,
		id,
	)

	return err
}
