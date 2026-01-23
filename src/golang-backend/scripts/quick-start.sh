#!/bin/bash

# VHV Platform Backend Quick Start Script
# This script sets up everything needed to run the backend

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_info() {
    echo -e "${YELLOW}INFO:${NC} $1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_step "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    # Check Go
    if ! command -v go &> /dev/null; then
        print_error "Go is not installed. Please install Go 1.22+ first."
        exit 1
    fi
    print_success "Go is installed: $(go version)"
    
    # Check migrate tool
    if ! command -v migrate &> /dev/null; then
        print_info "golang-migrate is not installed. Installing..."
        go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
        print_success "golang-migrate installed"
    else
        print_success "golang-migrate is installed"
    fi
    
    echo ""
}

# Create .env file if not exists
setup_env() {
    print_step "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
SERVER_ENVIRONMENT=development
SERVER_API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USER=yugabyte
DB_PASSWORD=yugabyte
DB_NAME=vhv_platform
DB_SSLMODE=disable
DB_MAX_CONNECTIONS=25
DB_MAX_IDLE_CONNECTIONS=5
DB_MAX_LIFETIME=5m

# ClickHouse Configuration
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9001
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=vhv_analytics

# Cache Configuration (Dragonfly/Redis)
CACHE_HOST=localhost
CACHE_PORT=6379
CACHE_PASSWORD=
CACHE_DB=0
CACHE_DEFAULT_EXPIRATION=5m
CACHE_CLEANUP_INTERVAL=10m

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=168h
JWT_ISSUER=vhv-platform
JWT_AUDIENCE=vhv-platform-users

# Auth Configuration
AUTH_PASSWORD_MIN_LENGTH=8
AUTH_PASSWORD_REQUIRE_UPPERCASE=true
AUTH_PASSWORD_REQUIRE_LOWERCASE=true
AUTH_PASSWORD_REQUIRE_NUMBER=true
AUTH_PASSWORD_REQUIRE_SPECIAL=true

# Logger Configuration
LOGGER_LEVEL=debug
LOGGER_FORMAT=json
LOGGER_OUTPUT=stdout
LOGGER_FILE_PATH=logs/app.log
LOGGER_MAX_SIZE=100
LOGGER_MAX_BACKUPS=3
LOGGER_MAX_AGE=28
LOGGER_COMPRESS=true
EOF
        print_success ".env file created"
    else
        print_success ".env file already exists"
    fi
    
    echo ""
}

# Start infrastructure services
start_services() {
    print_step "Starting infrastructure services..."
    
    docker-compose up -d yugabyte clickhouse dragonfly
    
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check YugabyteDB
    if docker exec vhv-yugabyte bin/ysqlsh -h localhost -U yugabyte -c "SELECT 1" &> /dev/null; then
        print_success "YugabyteDB is ready"
    else
        print_error "YugabyteDB is not ready"
        exit 1
    fi
    
    # Check ClickHouse
    if docker exec vhv-clickhouse clickhouse-client -q "SELECT 1" &> /dev/null; then
        print_success "ClickHouse is ready"
    else
        print_error "ClickHouse is not ready"
        exit 1
    fi
    
    # Check Dragonfly
    if docker exec vhv-dragonfly redis-cli ping &> /dev/null; then
        print_success "Dragonfly is ready"
    else
        print_error "Dragonfly is not ready"
        exit 1
    fi
    
    echo ""
}

# Run database migrations
run_migrations() {
    print_step "Running database migrations..."
    
    migrate -path migrations \
        -database "postgresql://yugabyte:yugabyte@localhost:5433/vhv_platform?sslmode=disable" \
        up
    
    print_success "Migrations completed"
    echo ""
}

# Seed database
seed_database() {
    print_step "Seeding database with test data..."
    
    go run scripts/seed/main.go
    
    print_success "Database seeded"
    echo ""
}

# Download dependencies
download_deps() {
    print_step "Downloading Go dependencies..."
    
    go mod download
    go mod verify
    
    print_success "Dependencies downloaded"
    echo ""
}

# Print final instructions
print_instructions() {
    echo ""
    echo "======================================"
    echo -e "${GREEN}Setup Complete!${NC}"
    echo "======================================"
    echo ""
    echo "Services:"
    echo "  - YugabyteDB:  localhost:5433"
    echo "  - ClickHouse:  localhost:9001"
    echo "  - Dragonfly:   localhost:6379"
    echo ""
    echo "Test Credentials:"
    echo "  Email:    admin@saas.coquan.vn"
    echo "  Password: Admin@2026"
    echo ""
    echo "Next Steps:"
    echo "  1. Start the API server:"
    echo "     make dev"
    echo ""
    echo "  2. Test the API:"
    echo "     curl http://localhost:8080/health"
    echo ""
    echo "  3. Run API tests:"
    echo "     ./scripts/test-api.sh"
    echo ""
    echo "  4. View logs:"
    echo "     make logs-api"
    echo ""
    echo "Useful Commands:"
    echo "  make help          - Show all available commands"
    echo "  make docker-down   - Stop all services"
    echo "  make migrate-reset - Reset database"
    echo "  make seed          - Reseed database"
    echo ""
    echo "======================================"
}

# Main execution
main() {
    echo ""
    echo "======================================"
    echo "VHV Platform Backend Quick Start"
    echo "======================================"
    echo ""
    
    check_requirements
    setup_env
    download_deps
    start_services
    run_migrations
    seed_database
    print_instructions
}

# Run main function
main
