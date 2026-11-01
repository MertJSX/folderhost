package test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
)

var (
	baseURL string
	token   string
)

func TestMain(m *testing.M) {
	ctx := context.Background()

	req := testcontainers.ContainerRequest{
		FromDockerfile: testcontainers.FromDockerfile{
			Context:    "../",
			Dockerfile: "Dockerfile.test",
			KeepImage:  false,
		},
		ExposedPorts: []string{"5000/tcp"},
		WaitingFor:   wait.ForHTTP("/").WithPort("5000/tcp").WithStartupTimeout(60 * time.Second),
	}

	folderhostC, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		fmt.Println("Failed to start container:", err)
		os.Exit(1)
	}
	defer func() {
		_ = folderhostC.Terminate(ctx)
	}()

	mappedPort, err := folderhostC.MappedPort(ctx, "5000")
	if err != nil {
		fmt.Println("Failed to get mapped port:", err)
		os.Exit(1)
	}
	baseURL = fmt.Sprintf("http://localhost:%s", mappedPort.Port())

	if err := fetchToken(); err != nil {
		fmt.Println("Failed to get token:", err)
		os.Exit(1)
	}

	os.Exit(m.Run())
}

func isServerUp() bool {
	resp, err := http.Get(baseURL + "/")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return true
}

func fetchToken() error {
	body := map[string]string{
		"username": "admin",
		"password": "123",
	}
	jsonBody, _ := json.Marshal(body)

	resp, err := http.Post(
		baseURL+"/api/verify-password",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("login failed: status %d", resp.StatusCode)
	}

	var result struct {
		Res         string `json:"res"`
		Token       string `json:"token"`
		Permissions any    `json:"permissions"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}
	if result.Token == "" {
		return fmt.Errorf("no token in response")
	}

	token = result.Token
	return nil
}

func TestGetToken(t *testing.T) {
	if token == "" {
		t.Fatal("token is empty — TestMain failed to acquire it")
	}
	if len(token) < 20 {
		t.Fatalf("token looks invalid: %q", token)
	}
	t.Logf("Token OK: %s...", token[:20])
}

func uniqueName(t *testing.T, prefix string) string {
	t.Helper()
	return fmt.Sprintf("%s_%d.txt", prefix, time.Now().UnixNano())
}

func createFile(t *testing.T, name string) {
	t.Helper()
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
	require.Equal(t, 200, resp.StatusCode, "failed to create %s: body=%q", name, string(body))
}

func deleteFile(t *testing.T, name string) {
	t.Helper()
	req, _ := http.NewRequest(
		"DELETE",
		baseURL+"/api/explorer/delete?path=%2F"+url.QueryEscape(name),
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Logf("cleanup: failed to delete %s: %v", name, err)
		return
	}
	defer resp.Body.Close()
	t.Logf("cleanup: deleted %s (status=%d)", name, resp.StatusCode)
}

func createDir(t *testing.T, name string) {
	t.Helper()
	req, _ := http.NewRequest(
		"POST",
		baseURL+"/api/explorer/create-item?path=%2F&itemName="+url.QueryEscape(name)+"&isFolder=true",
		strings.NewReader(`{}`),
	)
	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	require.Equal(t, 200, resp.StatusCode, "failed to create dir %s: body=%q", name, string(body))
}
