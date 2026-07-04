package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/fatih/color"
)

type VersionResponse struct {
	Version string `json:"version"`
}

func parseVersion(version string) (int, int, int, error) {
	version = strings.TrimPrefix(version, "v")

	parts := strings.Split(version, ".")
	if len(parts) != 3 {
		return 0, 0, 0, fmt.Errorf("invalid version format: %s", version)
	}

	year, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, 0, 0, err
	}

	month, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, 0, 0, err
	}

	release, err := strconv.Atoi(parts[2])
	if err != nil {
		return 0, 0, 0, err
	}

	return year, month, release, nil
}

func isNewerVersion(current, latest string) bool {

	currentYear, currentMonth, currentRelease, err := parseVersion(current)
	if err != nil {
		return false
	}

	latestYear, latestMonth, latestRelease, err := parseVersion(latest)
	if err != nil {
		return false
	}

	if latestYear > currentYear {

		return true
	}
	if latestYear < currentYear {

		return false
	}

	if latestMonth > currentMonth {
		return true
	}
	if latestMonth < currentMonth {

		return false
	}

	return latestRelease > currentRelease
}

func checkForUpdates(currentVersion string) (bool, string) {
	client := http.Client{
		Timeout: 5 * time.Second,
	}

	req, err := http.NewRequest("GET", "https://api.folderhost.org/v1/folderhost/version-check", nil)
	if err != nil {
		return false, currentVersion
	}
	req.Header.Set("User-Agent", "FolderHost-Server/"+currentVersion)

	resp, err := client.Do(req)
	if err != nil {
		if IsDevelopment() {
			fmt.Printf("\n[Debug] Version check failed (network error): %v\n", err)
		}
		return false, currentVersion
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, currentVersion
	}

	var versionResp VersionResponse
	if err := json.Unmarshal(body, &versionResp); err != nil {
		return false, currentVersion
	}

	if isNewerVersion(currentVersion, versionResp.Version) {
		return true, versionResp.Version
	}

	return false, currentVersion
}

func checkAndNotifyVersion(currentVersion string) {
	hasUpdate, newVersion := checkForUpdates(currentVersion)
	if hasUpdate {
		updateText := color.New(color.FgYellow).Add(color.Bold)
		normalText := color.RGB(169, 169, 169)
		greenText := color.New(color.FgGreen).Add(color.Bold)

		updateText.Printf("\n New version available: ")
		greenText.Printf("%s", newVersion)
		normalText.Print(" (Current: ")
		fmt.Printf("%s", currentVersion)
		normalText.Print(")\n")
		normalText.Print("   Download: ")
		cyanText := color.New(color.FgCyan)
		cyanText.Print("https://github.com/MertJSX/folderhost/releases\n\n")
	}
}

func StartVersionChecker(currentVersion string) {

	checkAndNotifyVersion(currentVersion)

	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for range ticker.C {
			checkAndNotifyVersion(currentVersion)
		}
	}()
}
