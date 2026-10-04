package users

import (
	"encoding/hex"
	"fmt"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
)

func UpdateAdmin(user *types.Account) error {

	if config.Config.AdminAccount.Username == "system" {
		return fmt.Errorf("username 'system' is reserved, please change the admin username in the config file")
	}

	const query = `
		UPDATE users SET
			username = ?,
			password = ?,
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
		WHERE id = 1
	`

	hash, err := utils.Hash([]byte(user.Password))
	if err != nil {
		return err
	}

	hashString := hex.EncodeToString(hash[:])

	_, err = database.DB.Exec(
		query,
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
		user.Permissions.ReadRecovery,
		user.Permissions.UseRecovery,
		user.Permissions.ReadUsers,
		user.Permissions.EditUsers,
		user.Permissions.ReadLogs,
	)

	return err
}
