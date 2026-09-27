package utils

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

func removeUnsuccessfulExtraction(extractedPaths []string) {
	for i := len(extractedPaths) - 1; i >= 0; i-- {
		os.RemoveAll(extractedPaths[i])
	}
}

func Unzip(src, dest string, cb func(int64, bool, string)) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return fmt.Errorf("cannot open zip file: %v", err)
	}
	defer r.Close()

	var (
		totalSize  int64 = 0
		currentUID int   = os.Getuid()
		currentGID int   = os.Getgid()
	)

	var extractedPaths []string
	remainingFolderSpace, err := GetRemainingFolderSpace()

	if err != nil {
		return fmt.Errorf("cannot get remaining folder space: %v", err)
	}

	for _, file := range r.File {
		cb(totalSize, false, "") // Parameters: totalSize, isCompleted, abortMsg

		filePath := filepath.Join(dest, file.Name)

		if !IsSafePath(filePath) {
			return fmt.Errorf("security risk: wrong filepath")
		}

		itemInfo, statErr := os.Stat(filePath)
		wasExisting := statErr == nil

		if wasExisting && !itemInfo.IsDir() && !file.FileInfo().IsDir() {
			removeUnsuccessfulExtraction(extractedPaths)
			return fmt.Errorf("unable to extract file (%s): file already exists in current directory that you're extracting to", file.Name)
		}

		// Only track newly created paths (not pre-existing ones)
		// This way, if extraction fails, we don't delete the user's original files
		if !wasExisting {
			extractedPaths = append(extractedPaths, filePath)
		}

		err := extractFile(file, dest, &totalSize, currentUID, currentGID)
		if err != nil {
			removeUnsuccessfulExtraction(extractedPaths)
			log.Printf("Unzip error: %v\n", err)
			return fmt.Errorf("unable to extract file (%s): %v", file.Name, err)
		}
		if totalSize > remainingFolderSpace {
			removeUnsuccessfulExtraction(extractedPaths)
			cb(totalSize, false, "Unzip process exceeds storage limit!")
			return fmt.Errorf("unzip process exceeds storage limit")
		}
	}

	cb(totalSize, true, "")

	return nil
}

func extractFile(file *zip.File, dest string, totalSize *int64, uid int, gid int) error {
	filePath := filepath.Join(dest, file.Name)

	if !IsSafePath(filePath) {
		return fmt.Errorf("security risk: wrong filepath")
	}

	if file.FileInfo().IsDir() {
		err := os.MkdirAll(filePath, 0755)
		if err != nil {
			return err
		}
		// Windows specific error handling :D
		if runtime.GOOS != "windows" {
			return os.Chown(filePath, uid, gid)
		}
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		return err
	}

	outFile, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
	if err != nil {
		return err
	}
	defer outFile.Close()

	rc, err := file.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	size, err := io.Copy(outFile, rc)
	*totalSize += size
	return err
}

func Zip(src, dest string, cb func(int64, bool, string)) error {
	_, err := os.Stat(src)
	if err != nil {
		return fmt.Errorf("cannot access source: %v", err)
	}

	zipFile, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("cannot create zip file: %v", err)
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	var (
		totalSize  int64 = 0
		currentUID int   = os.Getuid()
		currentGID int   = os.Getgid()
	)

	remainingSpace, err := GetRemainingFolderSpace()
	if err != nil {
		return fmt.Errorf("cannot get remaining folder space: %v", err)
	}

	err = filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return fmt.Errorf("cannot get relative path: %v", err)
		}

		if relPath == "." {
			return nil
		}

		relPath = filepath.ToSlash(relPath)

		cb(totalSize, false, "")

		err = archiveItem(zipWriter, path, relPath, info, &totalSize, currentUID, currentGID)
		if err != nil {
			log.Printf("Zip error: %v\n", err)
			return fmt.Errorf("unable to archive file (%s): %v", relPath, err)
		}

		if totalSize > remainingSpace {
			zipWriter.Close()
			zipFile.Close()
			os.Remove(dest)

			cb(totalSize, false, "Zip process exceeds storage limit!")
			return fmt.Errorf("zip process exceeds storage limit")
		}

		return nil
	})

	if err != nil {
		return err
	}

	cb(totalSize, true, "")
	return nil
}

func archiveItem(zipWriter *zip.Writer, sourcePath, archivePath string, info os.FileInfo, totalSize *int64, uid int, gid int) error {
	if !IsSafePath(sourcePath) {
		return fmt.Errorf("security risk: wrong filepath")
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return fmt.Errorf("cannot create zip header: %v", err)
	}

	header.Name = archivePath

	if info.IsDir() {
		header.Name += "/"
	} else {
		header.Method = zip.Deflate
	}

	writer, err := zipWriter.CreateHeader(header)
	if err != nil {
		return fmt.Errorf("cannot create zip entry: %v", err)
	}

	if info.IsDir() {
		return nil
	}

	sourceFile, err := os.Open(sourcePath)
	if err != nil {
		return fmt.Errorf("cannot open source file: %v", err)
	}
	defer sourceFile.Close()

	size, err := io.Copy(writer, sourceFile)
	if err != nil {
		return fmt.Errorf("cannot copy file content: %v", err)
	}

	*totalSize += size
	return nil
}
