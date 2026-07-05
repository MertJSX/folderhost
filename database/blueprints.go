package database

import (
	"fmt"
	"log"
)

func CreateUsersTable() {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password TEXT NULL,
			email TEXT NULL,
			scope TEXT NULL,
			read_directories BOOLEAN DEFAULT FALSE,
        	read_files BOOLEAN DEFAULT FALSE,
        	create_permission BOOLEAN DEFAULT FALSE,
        	change_permission BOOLEAN DEFAULT FALSE,
        	delete_permission BOOLEAN DEFAULT FALSE,
        	move_permission BOOLEAN DEFAULT FALSE,
        	download_permission BOOLEAN DEFAULT FALSE,
        	upload_permission BOOLEAN DEFAULT FALSE,
        	rename_permission BOOLEAN DEFAULT FALSE,
        	extract_permission BOOLEAN DEFAULT FALSE,
			archive_permission BOOLEAN DEFAULT FALSE,
        	copy_permission BOOLEAN DEFAULT FALSE,
			logs_permission BOOLEAN DEFAULT FALSE,
			read_recovery_permission BOOLEAN DEFAULT FALSE,
			use_recovery_permission BOOLEAN DEFAULT FALSE,
			read_users_permission BOOLEAN DEFAULT FALSE,
			edit_users_permission BOOLEAN DEFAULT FALSE,
			read_logs_permission BOOLEAN DEFAULT FALSE,
        	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Users table has been created!")
}

func CreateLogsTable() {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS logs (
			id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL,
			action TEXT NULL,
			description TEXT NULL,
        	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (username) REFERENCES users(username) 
                ON DELETE CASCADE 
                ON UPDATE CASCADE
		);

		CREATE INDEX IF NOT EXISTS idx_logs_username ON logs(username);
		CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
	`)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Logs table has been created!")

}

func CreateRecoveryTable() {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS recovery (
			id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
			username TEXT NULL,
			oldLocation TEXT NULL,
			binLocation TEXT NULL,
			isDirectory INTEGER NOT NULL DEFAULT 0,
			sizeDisplay TEXT NULL,
			sizeBytes INTEGER NOT NULL DEFAULT 0,
        	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (username) REFERENCES users(username) 
                ON DELETE CASCADE 
                ON UPDATE CASCADE
		);
	`)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Recovery table has been created!")

}

func CreateSharedTable() {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS shared (
			id TEXT NOT NULL PRIMARY KEY,
			username TEXT NOT NULL,
			userID INTEGER NOT NULL,
			displayName TEXT NOT NULL,
			path TEXT NOT NULL,
			password TEXT NULL,
			downloadLimit INTEGER NOT NULL DEFAULT 0,
			downloadCount INTEGER NOT NULL DEFAULT 0,
			public BOOLEAN DEFAULT TRUE,
        	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (username) REFERENCES users(username) 
                ON DELETE CASCADE 
                ON UPDATE CASCADE,
			FOREIGN KEY (userID) REFERENCES users(id)
				ON DELETE CASCADE
				ON UPDATE CASCADE
		);
	`)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Shared table has been created!")

}
