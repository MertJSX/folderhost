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

	// Automatically ensure all tables exist (Safe due to IF NOT EXISTS)
	// For future releases we can make something better...
	database.CreateUsersTable()
	database.CreateLogsTable()
	database.CreateRecoveryTable()
	database.CreateSharedTable()

	if firstTime {
		err = users.CreateUser(&config.Config.AdminAccount)
		if err != nil {
			fmt.Println("Error creating Admin account:", err)
		}
	}

	users.UpdateAdmin(&config.Config.AdminAccount)

	fmt.Println("Database connection established successfully!")
}
