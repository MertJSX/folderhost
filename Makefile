start:
	go run main.go

web:
	cd web && npm run dev

docker: # Example: make docker VERSION=v26.5.0
	VERSION=$(VERSION) docker compose build
	VERSION=$(VERSION) docker compose up

test-server:
	go run gotest.tools/gotestsum@latest --format testname ./test/

build: # Example: make build VERSION=v26.5.0
	cd web && npm run build
# Linux x86_64
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w -X main.Version=$(VERSION)" -trimpath -o ./debug/folderhost main.go
# Linux ARM32
	CGO_ENABLED=0 GOOS=linux GOARCH=arm GOARM=7 go build -ldflags="-s -w -X main.Version=$(VERSION)" -trimpath -o ./debug/folderhost-linux-arm main.go
# Linux ARM64
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w -X main.Version=$(VERSION)" -trimpath -o ./debug/folderhost-linux-arm64 main.go
# Windows
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="-s -w -X main.Version=$(VERSION)" -trimpath -o ./debug/folderhost.exe main.go
# macOS Intel
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w -X main.Version=$(VERSION)" -trimpath -o ./debug/folderhost-mac-amd64 main.go
# macOS ARM
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w -X main.Version=$(VERSION)" -trimpath -o ./debug/folderhost-mac-arm64 main.go
# FreeBSD
	CGO_ENABLED=0 GOOS=freebsd GOARCH=amd64 go build -ldflags="-s -w -X main.Version=$(VERSION)" -trimpath -o ./debug/folderhost-freebsd main.go
	@echo "All builds completed!"

setup:
	@echo "Downloading Go dependencies..."
	go mod tidy
	go mod download
	@echo "Downloading frontend dependencies..."
	cd web && npm install
	@echo "Building frontend..."
	cd web && npm run build
	@echo "Setup completed successfully!"