<p align="center">
  <img width="570" height="120" alt="image" src="https://github.com/user-attachments/assets/d6e8262a-9262-4521-b826-817c483ce2d9" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/language-Go-blue?style=flat-square" alt="Go Language">
  <a href="https://github.com/MertJSX/folderhost/releases">
    <img src="https://img.shields.io/github/v/release/MertJSX/folderhost?style=flat-square" alt="Latest Release">
  </a>
  <a href="LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/MertJSX/folderhost">
  </a>
  <a href="https://github.com/MertJSX/folderhost/releases">
    <img alt="Downloads" src="https://img.shields.io/github/downloads/MertJSX/folderhost/total?style=flat-square">
  </a>
  <a href="https://hub.docker.com/r/mertjsx/folderhost">
    <img alt="Docker pulls"
src="https://img.shields.io/docker/pulls/mertjsx/folderhost">
  </a>
</p>

<p align="center">
  <strong>Self-hosted cloud platform in a single binary</strong> - Share files, collaborate in real-time, and manage users with zero dependencies.
</p>


> **No Dependencies Required!**

> **Lightweight:** Windows / Linux **~19MB**

---

## Overview

FolderHost is a self-hosted cloud platform that allows you to store, manage, share and collaborate on files with other users. It is built with Go backend and React frontend, and is designed to be lightweight and easy to use. FolderHost is a great alternative to Nextcloud for users who want a simple and efficient file sharing solution. It has many features such as file management, user management, real-time collaboration, recovery bin, logs and more. Currently it's not made to be used for mobile devices, but I will try to make it mobile friendly in the future. You can check all the features from below.

---

## Screenshots

Here you can view some screenshots of the web client. These are screenshots from my cloud that I'm using to manage my Minecraft server:

<img width="700px" alt="image" src="https://github.com/user-attachments/assets/34ac3c23-5d77-4f15-a771-7983caf53ee1" />

<details>
  <summary>More Screenshots</summary>
    <img width="700px" alt="image" src="https://github.com/user-attachments/assets/38d3779c-dc0e-4b7e-9b24-1a952ee4f109" />
    <img width="700px" alt="image" src="https://github.com/user-attachments/assets/f67cb24e-16b8-438e-a702-abc366d3ceaa" />
    <img width="700px" alt="image" src="https://github.com/user-attachments/assets/60582167-866a-4011-b277-42bd8fcc6f10" />
    <img width="700px" alt="image" src="https://github.com/user-attachments/assets/340b89a4-3bd2-44ca-b55d-8be66f9dc0a4" />

</details>


---

## Installation

There are 2 possible ways to run FolderHost. The first one is using Docker, and the second one is by downloading the binary for your operating system. If you want a more secure and more popular way to run FolderHost, I'd suggest you to use Docker. But if you don't want to use Docker, just download the binary for your OS and run it. There are no dependencies to run the binary. Lots of people use docker, but for me the better way is using the binary. Because there are no dependencies and it's lightweight. But, it's up to you. You can check the instructions below.

<br>

[![Download Latest Release](https://img.shields.io/github/v/release/MertJSX/folderhost?style=for-the-badge&logo=github&label=Download&color=2ea44f)](https://github.com/MertJSX/folderhost/releases/latest)

### Docker
```bash
# Run container, you can access the files using docker volumes
  docker run -d \
    --name folderhost-server \
    -p 5000:5000 \
    -v folderhost_data:/app \
    --restart unless-stopped \
    mertjsx/folderhost:latest
```

### Easypanel

[Easypanel](https://easypanel.io) is a self-hosted Docker deployment platform with a one-click FolderHost template:

[![Deploy on Easypanel](https://easypanel.io/img/deploy-on-easypanel-40.svg)](https://easypanel.io/templates/folderhost)

### Binary Installation

First of all you need to create a folder to store your files and the binary. Then you can run the binary. Otherwise it's going to create a lot of files in your current directory. This is just for the ones that don't want to use docker.

#### Windows

Go to the releases install the latest windows version then run the binary inside that folder.

```powershell
# Download the .exe, then:
folderhost.exe # or just double click it.
```

#### Linux

> Don't forget to create a folder for the binary, and run the binary in that folder.

Just copy and paste this and folderhost will start working. It's around 19 mb for linux.


```bash
wget https://github.com/MertJSX/folderhost/releases/latest/download/folderhost-linux-amd64.tar.gz
tar -xzf folderhost-linux-amd64.tar.gz
chmod +x folderhost-linux-amd64
rm -rf folderhost-linux-amd64.tar.gz

# Run
./folderhost-linux-amd64
```

---

## Documentation

There is a simple documentation page that explains how to use FolderHost. You can access it from the website of the [FolderHost](https://folderhost.org). The program itself is so simple. There is basically nothing to explain. The configuration file has it's own comments describing what each field does. If you have any additional questions, you can open an issue or discussion on GitHub. I usually reply in a few hours but it might take a day or two depending on my schedule.

---

## Why FolderHost?
**Lightweight alternative to Nextcloud** - Get the same file sharing features without the complexity.

| Feature | FolderHost | Nextcloud |
|---------|-----------|-----------|
| **Binary Size** | ~19MB | 200MB+ |
| **Dependencies** | None | PHP+Database |
| **Setup Time** | 30 seconds | 15+ minutes |
| Single Binary | Yes | No |
| Real-time Editing | Yes | No |
| Easy Setup | Yes | No |

---

## Features

### Core
- **Single Binary Deployment** - No dependencies, just run
- **High Performance** - Built with Go backend + React frontend
- **Real-time Collaboration** - Live code editing with Monaco Editor
- **Multi-user Support** - Permissions system

### File Management
- Full file operations (upload, download, move, copy, rename)
- Chunked file uploads for large files
- Recovery bin with configurable limits

### Security & Monitoring
- JWT-based authentication
- Granular user permissions
- Audit logs for all activities
- Configurable storage limits

---

## Configuration
> If you encounter any issues or have questions, please feel free to open an [issue](https://github.com/MertJSX/folderhost/issues) or provide feedback. Your input is highly appreciated!

On first run, a `config.yml` file will be created. Edit it to customize, don't forget to change admin password:

<details>
  <summary>Show config</summary>

  ```yml
#      _______   __   __
#     / _____/  / /  / /
#    / /__     / /__/ /
#   / ___/    / ___  /
#  / /       / /  / /
# /_/       /_/  /_/  By MertJSX
#
# Thanks for using my application!!! Please report if you catch any bugs!
# Here is the GitHub page of FolderHost: https://github.com/MertJSX/folderhost
# Contact for security vulnerabilities: contact@mertsami.com
version: "v26.6.2"

# Port is required. Don't delete it!
port: 5000

# This is folder path. You can change it, but don't delete.
folder: "./host"

# Limit of the folder. Examples: 10 GB, 300 MB, 5.5 GB, 1 TB...
# You can remove it if you trust users.
storage_limit: "10 GB"

# This is secret json web token key to create tokens. If you don't have one, it will be autogenerated.
secret_jwt_key: "auto"

# Admin account properties
admin:
  username: "admin"
  password: "123"
  email: "example@email.com"
  scope: "" # for example "/yourfolder", this attribute will set a specific location for user and he cannot escape it
  permissions:
    read_directories: true
    read_files: true
    create: true
    change: true
    delete: true
    move: true
    download: true
    upload: true
    rename: true
    extract: true
    archive: true
    copy: true
    read_recovery: true
    use_recovery: true
    read_users: true
    edit_users: true
    read_logs: true

# Holds deleted files. Accidentally, you might delete files that you don't want to delete.
recovery_bin: true

# Optionally you can limit recovery_bin storage. You can remove it if you want.
bin_storage_limit: "5 GB"

# Enable/Disable logging activities
log_activities: true

# Clears logs automatically after some days. If you want to disable it set the value to 0.
clear_logs_after: 7 # Days

# -------------------------------------------------------------
# SSL / HTTPS Configuration
# -------------------------------------------------------------
ssl:
  enabled: false

  # Mode determines how the SSL certificate is generated:
  # "self_signed" -> (Recommended for local networks) Automatically generates a certificate. No domain required.
  # "letsencrypt" -> (For public websites) Gets a free, valid certificate. Requires a real domain and open port 80/443.
  type: "self_signed"

  # Let's Encrypt Settings (Only required if type is "letsencrypt")
  domains:
    - example.com
  email: "admin@example.com"
```
</details>

**Default Access**

Once running, open your browser to:
```
http://localhost:5000
```

Default credentials: `admin` / `123` (**Change them from config.yml file**)

[View All Releases](https://github.com/MertJSX/folderhost/releases) • [Report Issues](https://github.com/MertJSX/folderhost/issues) • [Changelog](https://github.com/MertJSX/folderhost/blob/main/CHANGELOG.md)

---

## Security suggestions

The security setup for a cloud storage like FolderHost is very important. I've added some important security features to defend against attacks. But always add your own security measures too, like Cloudflare, SSL, and etc. You can try to change the default port to make it harder to find the server. For the admin account, change the username and password!

JWT tokens here are very secure. They have only 24 hours validity. But it saves your last login IP, last login user-agent, browser etc. To prevent attackers from stealing your token and logging in as you. That means even if they steal your token, they can't login as you because it will detect that it's not your IP, User-Agent etc. The con of this feature is that if you login from another device, you will be logged out of the previous device. So you can't use one account for different users. I would suggest you to create different accounts for each user, even if they don't have a special folder.

For a 100% security you can make your FolderHost server local and only connect to it using SSH tunnels or VPNs.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. You can look for Contributing information [HERE](https://github.com/MertJSX/folderhost?tab=contributing-ov-file)!

---

## License

The current license is [GPL-3.0 License](LICENSE). I like open-source things, so I decided to release this project under GPL-3.0 License. It's not gonna be changed. I'm open to new ideas and contributions. 

---

## Credits

Built with ❤️ by [MertJSX](https://github.com/MertJSX)

### Contributors
- Simeon / @simeonnv *(Github: https://github.com/simeonnv)*
- Ömer Açıkgöz / @Omeracix *(Github: https://github.com/Omeracix)*

### Tech Stack:
- Backend: Go
- Frontend: React + TypeScript + Vite
- Editor: Monaco Editor
- Database: SQLite
