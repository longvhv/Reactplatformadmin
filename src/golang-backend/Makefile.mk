.PHONY: help dev build test clean migrate seed docker-up docker-down

# Variables
BINARY_NAME=main
CMD_PATH=./cmd/api
MIGRATIONS_PATH=./migrations

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Run development server with hot reload
	@echo "Starting development server..."
	@air

run: ## Run without hot reload
	@echo "Running application..."
	@go run $(CMD_PATH)

build: ## Build the application
	@echo "Building application..."
	@go build -o bin/$(BINARY_NAME) $(CMD_PATH)

build-linux: ## Build for Linux
	@echo "Building for Linux..."
	@GOOS=linux GOARCH=amd64 go build -o bin/$(BINARY_NAME)-linux $(CMD_PATH)

install: ## Install dependencies
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

test: ## Run tests
	@echo "Running tests..."
	@go test -v ./...

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html

test-api: ## Test API endpoints
	@echo "Testing API endpoints..."
	@chmod +x scripts/test-api.sh
	@./scripts/test-api.sh

lint: ## Run linter
	@echo "Running linter..."
	@golangci-lint run

fmt: ## Format code
	@echo "Formatting code..."
	@go fmt ./...

vet: ## Run go vet
	@echo "Running go vet..."
	@go vet ./...

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -rf tmp/
	@rm -f coverage.out coverage.html

migrate-up: ## Run migrations up
	@echo "Running migrations up..."
	@goose -dir $(MIGRATIONS_PATH) postgres "$(DB_URL)" up

migrate-down: ## Run migrations down
	@echo "Running migrations down..."
	@goose -dir $(MIGRATIONS_PATH) postgres "$(DB_URL)" down

migrate-status: ## Show migration status
	@echo "Migration status..."
	@goose -dir $(MIGRATIONS_PATH) postgres "$(DB_URL)" status

migrate-create: ## Create new migration (usage: make migrate-create name=migration_name)
	@echo "Creating migration: $(name)"
	@chmod +x scripts/migration-helper.sh
	@./scripts/migration-helper.sh create $(name)

seed: ## Seed database
	@echo "Seeding database..."
	@go run scripts/seed/main.go

docker-up: ## Start Docker containers
	@echo "Starting Docker containers..."
	@docker-compose up -d

docker-down: ## Stop Docker containers
	@echo "Stopping Docker containers..."
	@docker-compose down

docker-logs: ## Show Docker logs
	@docker-compose logs -f

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	@docker build -t vhv-backend:latest .

docker-clean: ## Clean Docker resources
	@echo "Cleaning Docker resources..."
	@docker-compose down -v
	@docker system prune -f

setup: ## Setup development environment
	@echo "Setting up development environment..."
	@chmod +x scripts/quick-start.sh
	@./scripts/quick-start.sh

generate: ## Generate code
	@echo "Generating code..."
	@go generate ./...

mod-update: ## Update dependencies
	@echo "Updating dependencies..."
	@go get -u ./...
	@go mod tidy

security: ## Run security checks
	@echo "Running security checks..."
	@gosec ./...

bench: ## Run benchmarks
	@echo "Running benchmarks..."
	@go test -bench=. -benchmem ./...

tools: ## Install development tools
	@echo "Installing development tools..."
	@go install github.com/cosmtrek/air@latest
	@go install github.com/pressly/goose/v3/cmd/goose@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/securego/gosec/v2/cmd/gosec@latest

check: fmt vet lint test ## Run all checks

all: clean build test ## Clean, build and test

.DEFAULT_GOAL := help
