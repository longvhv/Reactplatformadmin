#!/bin/bash

# ============================================
# Database Migration Execution Script
# ============================================
# This script runs all go-framework compliance migrations
# with proper error handling and verification
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="./backups"
MIGRATION_DIR="./supabase/migrations"

# ============================================
# Helper Functions
# ============================================

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================
# Pre-flight Checks
# ============================================

preflight_checks() {
  print_header "Pre-flight Checks"
  
  # Check if psql is installed
  if ! command -v psql &> /dev/null; then
    print_error "psql is not installed. Please install PostgreSQL client."
    exit 1
  fi
  print_success "psql found"
  
  # Check if database is accessible
  if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    print_error "Cannot connect to database"
    print_info "Host: $DB_HOST, Port: $DB_PORT, User: $DB_USER, Database: $DB_NAME"
    exit 1
  fi
  print_success "Database connection successful"
  
  # Check if migration files exist
  if [ ! -f "$MIGRATION_DIR/007_add_complete_audit_trail.sql" ]; then
    print_error "Migration file not found: 007_add_complete_audit_trail.sql"
    exit 1
  fi
  print_success "Migration files found"
  
  echo ""
}

# ============================================
# Backup Database
# ============================================

backup_database() {
  print_header "Creating Backup"
  
  # Create backup directory
  mkdir -p "$BACKUP_DIR"
  
  # Generate backup filename with timestamp
  BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
  
  print_info "Backing up to: $BACKUP_FILE"
  
  # Create backup
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "Backup created successfully ($BACKUP_SIZE)"
  else
    print_error "Backup failed"
    exit 1
  fi
  
  echo ""
}

# ============================================
# Run Migration
# ============================================

run_migration() {
  print_header "Running Migration 007"
  
  print_info "Executing: 007_add_complete_audit_trail.sql"
  
  # Run migration with verbose output
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
       -f "$MIGRATION_DIR/007_add_complete_audit_trail.sql" \
       -v ON_ERROR_STOP=1; then
    print_success "Migration 007 completed successfully"
  else
    print_error "Migration 007 failed"
    print_warning "Database may be in inconsistent state"
    print_info "Restore from backup: psql -f $BACKUP_FILE"
    exit 1
  fi
  
  echo ""
}

# ============================================
# Verification
# ============================================

verify_migration() {
  print_header "Verifying Migration"
  
  # Check if audit fields were added
  print_info "Checking for audit fields..."
  
  QUERY="
  SELECT 
    table_name,
    COUNT(*) FILTER (WHERE column_name = 'created_by') as has_created_by,
    COUNT(*) FILTER (WHERE column_name = 'updated_by') as has_updated_by,
    COUNT(*) FILTER (WHERE column_name = 'deleted_by') as has_deleted_by
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('system_categories', 'app_components', 'tenants', 'regions')
  GROUP BY table_name
  HAVING 
    COUNT(*) FILTER (WHERE column_name = 'created_by') > 0 AND
    COUNT(*) FILTER (WHERE column_name = 'updated_by') > 0 AND
    COUNT(*) FILTER (WHERE column_name = 'deleted_by') > 0
  "
  
  RESULT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -t -c "$QUERY" | wc -l)
  
  if [ "$RESULT" -ge 4 ]; then
    print_success "All tables have complete audit trail"
  else
    print_error "Some tables are missing audit fields"
    print_info "Expected 4 tables, found $RESULT with complete audit trail"
  fi
  
  # Check indexes
  print_info "Checking indexes..."
  
  INDEX_QUERY="
  SELECT COUNT(*)
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (
      indexname LIKE '%created_by%' OR
      indexname LIKE '%updated_by%' OR
      indexname LIKE '%deleted_by%'
    )
  "
  
  INDEX_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                     -t -c "$INDEX_QUERY" | tr -d ' ')
  
  if [ "$INDEX_COUNT" -ge 12 ]; then  # 3 indexes * 4 tables = 12
    print_success "All audit indexes created ($INDEX_COUNT indexes)"
  else
    print_warning "Expected at least 12 indexes, found $INDEX_COUNT"
  fi
  
  # Check foreign keys (may not exist if users table not created yet)
  print_info "Checking foreign key constraints..."
  
  FK_QUERY="
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%created_by%'
       OR constraint_name LIKE '%updated_by%'
       OR constraint_name LIKE '%deleted_by%'
  "
  
  FK_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                  -t -c "$FK_QUERY" | tr -d ' ')
  
  if [ "$FK_COUNT" -gt 0 ]; then
    print_success "Foreign key constraints created ($FK_COUNT constraints)"
  else
    print_warning "No foreign key constraints found (users table may not exist yet)"
  fi
  
  echo ""
}

# ============================================
# Generate Report
# ============================================

generate_report() {
  print_header "Migration Report"
  
  REPORT_FILE="./migration_report_$(date +%Y%m%d_%H%M%S).txt"
  
  {
    echo "========================================="
    echo "DATABASE MIGRATION REPORT"
    echo "========================================="
    echo "Date: $(date)"
    echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    echo "User: $DB_USER"
    echo ""
    echo "TABLES WITH AUDIT TRAIL:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
      SELECT 
        table_name,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'created_by') THEN '✓' ELSE '✗' END as created_by,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'updated_by') THEN '✓' ELSE '✗' END as updated_by,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'deleted_by') THEN '✓' ELSE '✗' END as deleted_by
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY table_name
    "
    echo ""
    echo "INDEXES:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (indexname LIKE '%created_by%' OR indexname LIKE '%updated_by%' OR indexname LIKE '%deleted_by%')
      ORDER BY tablename, indexname
    "
  } > "$REPORT_FILE"
  
  print_success "Report saved to: $REPORT_FILE"
  
  echo ""
}

# ============================================
# Main Execution
# ============================================

main() {
  print_header "Database Migration to Go-Framework Standard"
  echo ""
  
  print_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
  print_info "User: $DB_USER"
  echo ""
  
  # Confirm before proceeding
  read -p "Do you want to proceed with migration? (yes/no): " -r
  echo
  if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    print_warning "Migration cancelled by user"
    exit 0
  fi
  
  # Run migration steps
  preflight_checks
  backup_database
  run_migration
  verify_migration
  generate_report
  
  # Success message
  print_header "Migration Complete ✓"
  print_success "All steps completed successfully"
  print_info "Backup: $BACKUP_FILE"
  print_info "Report: $REPORT_FILE"
  echo ""
  print_info "Next steps:"
  echo "  1. Review the migration report"
  echo "  2. Update application code to populate audit fields"
  echo "  3. Test CRUD operations"
  echo "  4. Deploy to production"
  echo ""
}

# ============================================
# Execute
# ============================================

main "$@"
