package test

import (
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCreateFileAlreadyExists(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	name := uniqueName(t, "create_exists")
	defer deleteFile(t, name)

	createFile(t, name)

	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-item?path=%2F&itemName="+url.QueryEscape(name)+"&isFolder=false",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Creating an existing file should NOT return 200")
}

func TestCreateFileInvalidFolder(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-item?path=%2Fnonexistent_folder_xyz&itemName=test.txt&isFolder=false",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Creating a file in a nonexistent folder should NOT return 200")
}

func TestCreateFileEmptyName(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-item?path=%2F&itemName=&isFolder=false",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Creating a file with empty name should NOT return 200")
}

func TestReadDirectoryNonexistent(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/explorer/read-dir?folder=%2Fnonexistent_folder_xyz&caching=false&mode=",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Reading a nonexistent folder should NOT return 200")
}

func TestReadDirectoryOnFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	name := uniqueName(t, "read_as_dir")
	defer deleteFile(t, name)
	createFile(t, name)

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/explorer/read-dir?folder=%2F"+url.QueryEscape(name)+"&caching=false&mode=",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Reading a file as directory should NOT return 200")
}

func TestReadFileNonexistent(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/read-file?filepath=%2Fnonexistent_file_xyz.txt",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Reading a nonexistent file should NOT return 200")
}

func TestReadFileOnDirectory(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	dirName := uniqueName(t, "read_file_dir")
	createDir(t, dirName)
	defer deleteFile(t, dirName)

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/read-file?filepath=%2F"+url.QueryEscape(dirName),
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Reading a directory as file should NOT return 200")
}

func TestMoveNonexistentFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	targetDir := uniqueName(t, "move_target")
	createDir(t, targetDir)
	defer deleteFile(t, targetDir)

	req, _ := http.NewRequest(
		"PUT",
		baseURL+"/api/explorer/rename?oldFilepath=%2Fnonexistent_move_xyz.txt&newFilepath=%2F"+url.QueryEscape(targetDir)+"&type=move",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Moving a nonexistent file should NOT return 200")
}

func TestMoveFileToNonexistentDir(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	name := uniqueName(t, "move_src")
	defer deleteFile(t, name)
	createFile(t, name)

	req, _ := http.NewRequest(
		"PUT",
		baseURL+"/api/explorer/rename?oldFilepath=%2F"+url.QueryEscape(name)+"&newFilepath=%2Fnonexistent_target_xyz&type=move",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Moving to a nonexistent directory should NOT return 200")
}

func TestRenameNonexistentFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	newName := uniqueName(t, "rename_new")
	defer deleteFile(t, newName)

	req, _ := http.NewRequest(
		"PUT",
		baseURL+"/api/explorer/rename?oldFilepath=%2Fnonexistent_rename_xyz.txt&newFilepath=%2F"+url.QueryEscape(newName)+"&type=rename",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Renaming a nonexistent file should NOT return 200")
}

func TestRenameToSameName(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	name := uniqueName(t, "rename_same")
	defer deleteFile(t, name)
	createFile(t, name)

	req, _ := http.NewRequest(
		"PUT",
		baseURL+"/api/explorer/rename?oldFilepath=%2F"+url.QueryEscape(name)+"&newFilepath=%2F"+url.QueryEscape(name)+"&type=rename",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 500, resp.StatusCode, "Renaming to same name should NOT cause a server error")
}

func TestCopyNonexistentFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-copy?path=%2Fnonexistent_copy_xyz.txt",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Copying a nonexistent file should NOT return 200")
}

func TestCopyFileTwice(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	name := uniqueName(t, "copy_twice")
	defer deleteFile(t, name)
	createFile(t, name)

	req1, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-copy?path=%2F"+url.QueryEscape(name),
		strings.NewReader(`{}`),
	)
	req1.Header.Set("Authorization", token)
	req1.Header.Set("Content-Type", "application/json")

	resp1, err := http.DefaultClient.Do(req1)
	require.NoError(t, err)
	resp1.Body.Close()

	req2, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-copy?path=%2F"+url.QueryEscape(name),
		strings.NewReader(`{}`),
	)
	req2.Header.Set("Authorization", token)
	req2.Header.Set("Content-Type", "application/json")

	resp2, err := http.DefaultClient.Do(req2)
	require.NoError(t, err)
	defer resp2.Body.Close()

	body, _ := io.ReadAll(resp2.Body)
	t.Logf("Status: %d", resp2.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 500, resp2.StatusCode, "Copying the same file twice should NOT cause a server error")
}

func TestDeleteNonexistentFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"DELETE",
		baseURL+"/api/explorer/delete?path=%2Fnonexistent_delete_xyz.txt",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp.StatusCode, "Deleting a nonexistent file should NOT return 200")
}

func TestDeleteFileTwice(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	name := uniqueName(t, "delete_twice")
	createFile(t, name)

	req1, _ := http.NewRequest(
		"DELETE",
		baseURL+"/api/explorer/delete?path=%2F"+url.QueryEscape(name),
		strings.NewReader(`{}`),
	)
	req1.Header.Set("Authorization", token)
	req1.Header.Set("Content-Type", "application/json")

	resp1, err := http.DefaultClient.Do(req1)
	require.NoError(t, err)
	defer resp1.Body.Close()

	require.Equal(t, 200, resp1.StatusCode, "First delete should succeed")

	req2, _ := http.NewRequest(
		"DELETE",
		baseURL+"/api/explorer/delete?path=%2F"+url.QueryEscape(name),
		strings.NewReader(`{}`),
	)
	req2.Header.Set("Authorization", token)
	req2.Header.Set("Content-Type", "application/json")

	resp2, err := http.DefaultClient.Do(req2)
	require.NoError(t, err)
	defer resp2.Body.Close()

	body, _ := io.ReadAll(resp2.Body)
	t.Logf("Status: %d", resp2.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.NotEqual(t, 200, resp2.StatusCode, "Deleting the same file twice should NOT return 200")
}
