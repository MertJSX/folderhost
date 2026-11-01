package test

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRawFileTraversal(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/raw/%2F..%2Fconfig.yml",
		nil,
	)
	req.Header.Set("Authorization", token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	if resp.StatusCode == 200 && strings.Contains(string(body), "secret_jwt_key") {
		t.Fatalf("VULNERABLE: config.yml leaked! body=%q", string(body))
	}

	if resp.StatusCode == 404 && strings.Contains(string(body), "File not found") {
		t.Fatalf("VULNERABLE: attacker can get any image file content with path traversal!")
	}

	assert.Equal(t, 403, resp.StatusCode, "Expected 403 Forbidden for path traversal attempt")
}

func TestHasPrefixScopeBypass(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	shareBody := `{"shared":{"path":"/../../../../etc/passwd","displayName":"x"}}`
	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/shared",
		strings.NewReader(shareBody),
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

	if resp.StatusCode == 200 {
		t.Fatalf("VULNERABLE: share created with traversal path! status=%d body=%q", resp.StatusCode, string(body))
	}

	assert.Equal(t, 403, resp.StatusCode, "Expected 403 Forbidden for path traversal attempt")
}

func TestReadOutOfHostDirectoryImage(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/image/%2F..%2Fconfig.yml",
		nil,
	)
	req.Header.Set("Authorization", token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	t.Logf("Status: %d", resp.StatusCode)
	t.Logf("Response body: %q", string(body))

	if resp.StatusCode == 200 && strings.Contains(string(body), "secret_jwt_key") {
		t.Fatalf("VULNERABLE: config.yml leaked! body=%q", string(body))
	}

	if resp.StatusCode == 404 && strings.Contains(string(body), "File not found") {
		t.Fatalf("VULNERABLE: attacker can get any image file content with path traversal!")
	}

	assert.Equal(t, 403, resp.StatusCode, "Expected 403 Forbidden for path traversal attempt")
}

func TestReadDirectoryPathTraversal(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/explorer/read-dir?folder=%2F..%2Fconfig.yml&caching=false&mode=",
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

	assert.True(t, resp.StatusCode == 403, "The request should get 403 status code")
}

func TestReadFilePathTraversal(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"GET",
		baseURL+"/api/read-file?filepath=%2F..%2F",
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

	assert.True(t, resp.StatusCode == 403, "The request should get 403 status code")
}

func TestCopyFilePathTraversal(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-copy?path=%2F..%2Fconfig.yml",
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

	assert.True(t, resp.StatusCode == 403, "The request should get 403 status code")
}

func TestDeleteFilePathTraversal(t *testing.T) {
	if token == "" {
		t.Fatal("no token — TestMain failed?")
	}

	req, _ := http.NewRequest(
		"DELETE",
		baseURL+"/api/explorer/delete?path=%2F..%2Fconfig.yml",
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

	assert.True(t, resp.StatusCode == 403, "The request should get 403 status code")
}
