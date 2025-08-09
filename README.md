# 📁 Folderhost

## What is Folderhost?
It helps you to host your folder to your other friends or colleagues.

[NodeJS](https://nodejs.org/en) is required!

<a href="https://github.com/MertJSX/folder-host/releases/tag/1.0.0" target="_blank">
  <img src="https://img.shields.io/badge/Download-Pre--Release-blue?style=for-the-badge&logo=github" alt="Download Pre-Release">
</a>

Tested on:
<br>
<a href="https://www.microsoft.com/en-us/software-download/windows10" target="_blank">
<img
   src="https://img.icons8.com/?size=48&id=108792&format=png"
   alt="html5"
   width="48"
   height="48"
/>
</a>
<a href="https://www.microsoft.com/en-us/software-download/windows11" target="_blank">
<img
   src="https://img.icons8.com/?size=48&id=TuXN3JNUBGOT&format=png"
   alt="html5"
   width="48"
   height="48"
/>
</a>
<a href="https://fedoraproject.org/" target="_blank">
<img
   src="https://img.icons8.com/?size=48&id=ZbBhBW0N2q3D&format=png"
   alt="html5"
   width="48"
   height="48"
/>
</a>

## Features
- Accounts and account permissions
- Code highlight
- Recovery bin
- Max folder size
- Config file
- Logs

## Actions
- Read Directories
- Read Files
- Write file
- Upload Files
- Download Files
- Delete Files
- Unzip Files
- Create files and folders
- Rename files and folders
- Move files and folders
- Copy files and folders


## Client Screenshot ([Client](https://github.com/MertJSX/folderhost-client))

<img src="https://github.com/user-attachments/assets/b123ce9f-c8cb-49b0-9c75-0d1d16dba001" width="700px">


## Default config.yml

<details>
  <summary>Show config</summary>

  ```yml
# Port is required. Don't delete it!
port: 5000

# This is folder path. You can change it, but don't delete.
folder: "./test"

# Limit of the folder. Examples: 10 GB, 300 MB, 5.5 GB, 1 TB...
# You can remove it if you trust users.
storage_limit: "20 GB"

# This is secret encryption key to create encrypted tokens.
secret_encryption_key: "you must change it" # Example: 5asdasd1asd

# This is secret json web token key to create tokens.
secret_jwt_key: "you must change it" # Example: 5asdasd1asd

# You can create your own accounts for access
accounts:
    # All users should have unique name
    - name: "admin"
      # user password
      password: "12345"
      # You can manage user permissions.
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
        unzip: true
        copy: true
    - name: "moderator"
      password: "123"
      permissions:
        read_directories: true
        read_files: true
        create: false
        change: false
        delete: false
        move: false
        download: false
        upload: false
        rename: false
        unzip: false
        copy: false

# Holds deleted files. Accidentally, you might delete files that you don't want to delete.
recovery_bin: false

# Optionally you can limit recovery_bin storage. You can remove it if you want.
bin_storage_limit: "100 GB"

# Enable/Disable logging activities
log_activities: true

# Enable/Disable getting foldersize on start
get_foldersize_on_start: true

```

</details>


