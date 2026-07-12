package initialize

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/MertJSX/folderhost/database"
	"github.com/MertJSX/folderhost/database/users"
	"github.com/MertJSX/folderhost/utils"
	"github.com/MertJSX/folderhost/utils/config"
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

	if firstTime {
		database.CreateUsersTable()
		database.CreateLogsTable()
		database.CreateRecoveryTable()
		database.CreateSharedTable()
		err = users.CreateUser(&config.Config.AdminAccount)

		if err != nil {
			fmt.Println("Error creating Admin account.")
		}
	} else {
		var tableName string
		err := database.DB.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='shared';").Scan(&tableName)
		if err == sql.ErrNoRows {
			database.CreateSharedTable()
		} else if err != nil {
			fmt.Println("Error checking for shared table:", err)
		}
	}

	users.UpdateAdmin(&config.Config.AdminAccount)

	fmt.Println("Database connection established successfully!")
}
