package initialize

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/types"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
	"github.com/google/uuid"
)

func InitializeDatabase() {
	var err error
	var firstTime bool = false
	if utils.IsNotExistingPath("./database.db") {
		firstTime = true
	}
	database.DB, err = sql.Open("sqlite", "./database.db?_pragma=busy_timeout(5000)")

	if err != nil {
		log.Fatal(err)
	}

	err = database.DB.Ping()
	if err != nil {
		log.Fatal(err)
	}

	database.DB.SetMaxOpenConns(1)

	_, err = database.DB.Exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;")
	if err != nil {
		log.Fatal(err)
	}

	database.CreateUsersTable()
	database.CreateLogsTable()
	database.CreateRecoveryTable()
	database.CreateSharedTable()

	if firstTime {
		err = users.CreateUser(&config.Config.AdminAccount, true)
		if err != nil {
			log.Fatal("Error creating Admin account: ", err)
		}
	}

	err = users.UpdateAdmin(&config.Config.AdminAccount)
	if err != nil {
		log.Fatal("Error updating Admin account: ", err)
	}

	// Ensure system account exists (used for system-generated logs like auto-cleanup)
	ensureSystemAccount()

	// fmt.Println("Database connection established successfully!")
}

func ensureSystemAccount() {
	systemUser := types.Account{
		Username: "system",
		Password: uuid.New().String(), // a random strong password
		Email:    "",
		Scope:    "",
		Permissions: types.AccountPermissions{
			ReadDirectories: false,
			ReadFiles:       false,
			Create:          false,
			Change:          false,
			Delete:          false,
			Move:            false,
			DownloadFiles:   false,
			UploadFiles:     false,
			Rename:          false,
			Extract:         false,
			Archive:         false,
			Copy:            false,
			ReadRecovery:    false,
			UseRecovery:     false,
			ReadUsers:       false,
			EditUsers:       false,
			ReadLogs:        false,
		},
	}

	err := users.CreateUser(&systemUser, true)
	if err != nil {
		if err.Error() != "username already exists" {
			fmt.Println("Error creating system account:", err)
		}
	}
}
