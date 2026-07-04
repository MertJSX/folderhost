# Build stage
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /folderhost-server

COPY go.mod go.sum ./
RUN go mod tidy

COPY . .
ARG VERSION=unknown
RUN CGO_ENABLED=1 go build -ldflags="-s -w -X main.Version=${VERSION}" -o app main.go

# Runtime stage
FROM alpine:latest

WORKDIR /folderhost-server/
COPY --from=builder /folderhost-server/app .

EXPOSE 5000
CMD ["./app"]