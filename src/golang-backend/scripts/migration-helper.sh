#!/bin/bash

# Migration Helper Script
# Helps create and manage database migrations

set -e

MIGRATIONS_DIR="migrations"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create new migration
create_migration() {
    if [ -z "$1" ]; then
        echo "Usage: $0 create <migration_name>"
        exit 1
    fi
    
    name=$1
    timestamp=$(date +%Y%m%d%H%M%S)
    filename="${timestamp}_${name}.sql"
    filepath="$MIGRATIONS_DIR/$filename"
    
    cat > "$filepath" << EOF
-- Migration: $name
-- Created: $(date)

-- +goose Up
-- +goose StatementBegin


-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin


-- +goose StatementEnd
EOF
    
    print_success "Created migration: $filepath"
}

# List migrations
list_migrations() {
    print_info "Available migrations:"
    ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null || echo "No migrations found"
}

# Show migration count
count_migrations() {
    count=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
    print_info "Total migrations: $count"
}

# Validate migrations
validate_migrations() {
    print_info "Validating migrations..."
    
    for file in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$file" ]; then
            if grep -q "-- +goose Up" "$file" && grep -q "-- +goose Down" "$file"; then
                echo "✓ $(basename "$file")"
            else
                echo "✗ $(basename "$file") - Missing goose directives"
            fi
        fi
    done
    
    print_success "Validation complete"
}

# Show help
show_help() {
    cat << EOF
Migration Helper Script

Usage:
    $0 create <name>    Create a new migration
    $0 list             List all migrations
    $0 count            Count migrations
    $0 validate         Validate migration format
    $0 help             Show this help

Examples:
    $0 create add_users_table
    $0 create add_email_column_to_users
    $0 list
EOF
}

# Main
case "${1:-help}" in
    create)
        create_migration "$2"
        ;;
    list)
        list_migrations
        ;;
    count)
        count_migrations
        ;;
    validate)
        validate_migrations
        ;;
    help|*)
        show_help
        ;;
esac
