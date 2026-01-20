.PHONY: help init build run test migrate-up migrate-down docker-build docker-run clean

# Variables
APP_NAME=vhv-platform-api
DOCKER_IMAGE=$(APP_NAME):latest
GO_FILES=$(shell find . -name '*.go' -type f)

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

init: ## Initialize project dependencies
	@echo "Initializing Go module..."
	go mod init github.com/vhv-platform/backend || true
	go mod tidy
	@echo "Installing tools..."
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	@echo "Done!"

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	go mod download
	go mod verify
	@echo "Done!"

build: ## Build the application
	@echo "Building $(APP_NAME)..."
	go build -o bin/$(APP_NAME) cmd/api/main.go
	@echo "Binary created at bin/$(APP_NAME)"

run: ## Run the application
	@echo "Running $(APP_NAME)..."
	go run cmd/api/main.go

dev: ## Run with hot reload (requires air)
	@echo "Running in development mode..."
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Installing air..."; \
		go install github.com/cosmtrek/air@latest; \
		air; \
	fi

test: ## Run tests
	@echo "Running tests..."
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

test-unit: ## Run unit tests only
	@echo "Running unit tests..."
	go test -v -short ./...

test-integration: ## Run integration tests only
	@echo "Running integration tests..."
	go test -v -run Integration ./...

lint: ## Run linter
	@echo "Running linter..."
	golangci-lint run --timeout 5m

fmt: ## Format code
	@echo "Formatting code..."
	go fmt ./...
	goimports -w .

vet: ## Run go vet
	@echo "Running go vet..."
	go vet ./...

migrate-create: ## Create a new migration (usage: make migrate-create name=create_users_table)
	@if [ -z "$(name)" ]; then \
		echo "Error: name is required. Usage: make migrate-create name=migration_name"; \
		exit 1; \
	fi
	@echo "Creating migration: $(name)"
	migrate create -ext sql -dir migrations -seq $(name)

migrate-up: ## Run all migrations
	@echo "Running migrations..."
	migrate -path migrations -database "postgresql://localhost:5432/vhv_platform?sslmode=disable" up

migrate-down: ## Rollback last migration
	@echo "Rolling back last migration..."
	migrate -path migrations -database "postgresql://localhost:5432/vhv_platform?sslmode=disable" down 1

migrate-reset: ## Reset all migrations
	@echo "Resetting all migrations..."
	migrate -path migrations -database "postgresql://localhost:5432/vhv_platform?sslmode=disable" drop -f

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE) .
	@echo "Image built: $(DOCKER_IMAGE)"

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 8080:8080 --env-file .env $(DOCKER_IMAGE)

docker-compose-up: ## Start all services with docker-compose
	@echo "Starting services..."
	docker-compose up -d

docker-compose-down: ## Stop all services
	@echo "Stopping services..."
	docker-compose down

docker-compose-logs: ## View logs
	docker-compose logs -f

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf bin/
	rm -f coverage.out coverage.html
	go clean
	@echo "Done!"

generate: ## Generate code (mocks, etc.)
	@echo "Generating code..."
	go generate ./...

benchmark: ## Run benchmarks
	@echo "Running benchmarks..."
	go test -bench=. -benchmem ./...

coverage: ## Generate coverage report
	@echo "Generating coverage report..."
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

setup-dev: ## Setup development environment
	@echo "Setting up development environment..."
	cp .env.example .env
	@echo "Please edit .env file with your configuration"
	make init
	make deps
	@echo "Development environment ready!"

api-docs: ## Generate API documentation
	@echo "Generating API documentation..."
	@if command -v swag > /dev/null; then \
		swag init -g cmd/api/main.go -o docs/swagger; \
	else \
		echo "Installing swag..."; \
		go install github.com/swaggo/swag/cmd/swag@latest; \
		swag init -g cmd/api/main.go -o docs/swagger; \
	fi

merge-golang-api: ## Merge golang-api into golang-backend
	@echo "Merging golang-api into golang-backend..."
	@mkdir -p internal/handler/legacy
	@cp -r ../golang-api/handlers/* internal/handler/legacy/ 2>/dev/null || true
	@mkdir -p docs/migration
	@cp ../golang-api/*.md docs/migration/ 2>/dev/null || true
	@echo "Merge complete! Files copied to:"
	@echo "  - Handlers: internal/handler/legacy/"
	@echo "  - Docs: docs/migration/"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Review merged handlers"
	@echo "  2. Refactor to new structure"
	@echo "  3. Update imports and dependencies"

check: lint vet test ## Run all checks (lint, vet, test)

all: clean deps build test ## Clean, build and test

.DEFAULT_GOAL := help
