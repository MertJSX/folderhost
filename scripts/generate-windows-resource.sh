#!/usr/bin/env bash
set -e

VERSION="${1:-v0.0.0}"

# Strip "v" prefix
VERSION_NUM="${VERSION#v}"

# Split into major.minor.patch
MAJOR=$(echo "$VERSION_NUM" | cut -d. -f1)
MINOR=$(echo "$VERSION_NUM" | cut -d. -f2)
PATCH=$(echo "$VERSION_NUM" | cut -d. -f3)

echo "Generating Windows resource for v${MAJOR}.${MINOR}.${PATCH}..."

cat > /tmp/folderhost_versioninfo.json <<EOF
{
  "FixedFileInfo": {
    "FileVersion": {
      "Major": ${MAJOR},
      "Minor": ${MINOR},
      "Patch": ${PATCH},
      "Build": 0
    },
    "ProductVersion": {
      "Major": ${MAJOR},
      "Minor": ${MINOR},
      "Patch": ${PATCH},
      "Build": 0
    }
  },
  "StringFileInfo": {
    "CompanyName": "",
    "FileDescription": "FolderHost - Self-hosted cloud platform",
    "FileVersion": "${MAJOR}.${MINOR}.${PATCH}.0",
    "InternalName": "folderhost",
    "LegalCopyright": "GPL-3.0 License · © 2026 MertJSX",
    "OriginalFilename": "folderhost.exe",
    "ProductName": "FolderHost",
    "ProductVersion": "${MAJOR}.${MINOR}.${PATCH}.0",
    "Comments": "https://github.com/MertJSX/folderhost"
  },
  "IconPath": "web/src/assets/favicon.ico"
}
EOF

# Use `go tool` to run goversioninfo from go.mod tool directive
go tool github.com/josephspurrier/goversioninfo/cmd/goversioninfo \
  -64 \
  -icon=web/src/assets/favicon.ico \
  -o resource_windows_amd64.syso \
  /tmp/folderhost_versioninfo.json

rm -f /tmp/folderhost_versioninfo.json