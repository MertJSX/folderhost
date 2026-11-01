package test

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-item?path=%2F&itemName=test.txt&isFolder=false",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.True(t, resp.StatusCode == 200, "The request should get 200 status code")
}

func TestReadDirectory(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/explorer/read-dir?folder=%2F&caching=false&mode=",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.True(t, resp.StatusCode == 200, "The request should get 200 status code")
}

func TestReadFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/read-file?filepath=%2Ffile_to_read.txt",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.True(t, resp.StatusCode == 200, "The request should get 200 status code")
}

func TestMoveFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"PUT",
		baseURL+"/api/explorer/rename?oldFilepath=%2Ffile_to_move.txt&newFilepath=%2Ftestdir&type=move",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.True(t, resp.StatusCode == 200, "The request should get 200 status code")
}

func TestRenameFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"PUT",
		baseURL+"/api/explorer/rename?oldFilepath=%2Ffile_to_rename.txt&newFilepath=%2Frenamed_file.txt&type=rename",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.True(t, resp.StatusCode == 200, "The request should get 200 status code")
}

func TestCopyFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-copy?path=%2Ffile_to_copy.txt",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.True(t, resp.StatusCode == 200, "The request should get 200 status code")
}

func TestDeleteFile(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"DELETE",
		baseURL+"/api/explorer/delete?path=%2Ffile_to_delete.txt",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	assert.True(t, resp.StatusCode == 200, "The request should get 200 status code")
}
