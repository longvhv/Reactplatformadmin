# Migration to Go-Framework Database Standard

**Date**: 2026-01-12  
**Version**: 1.0.0  
**Target**: Migrate all database tables to 100% go-framework compliance

---

## 🎯 MIGRATION OBJECTIVES

Align ALL database schemas with go-framework standards from:
1. **Collections.md** (vhvplatform/react-framework repository)
2. **DATABASE_SCHEMA_STANDARD.md** (current project)

### Target Compliance:
- ✅ Primary Key: `_id UUID`
- ✅ Tenancy: `tenant_id UUID` (for tenant-specific tables)
- ✅ Complete Audit Trail: `created_at`, `updated_at`, `created_by`, `updated_by`
- ✅ Complete Soft Delete: `deleted_at`, `deleted_by`
- ✅ Optimistic Locking: `version BIGINT`
- ✅ Naming: snake_case
- ✅ Boolean prefix: `is_`, `has_`, `can_`

---

## 📊 CURRENT STATE ASSESSMENT

### Supabase Migrations (/supabase/migrations/)

| File | Status | Compliance | Notes |
|------|--------|-----------|-------|
| 003_restructure_system_categories.sql | ✅ COMPLIANT | 100% | Perfect implementation |
| 004_create_regions_table.sql | ✅ COMPLIANT | 100% | GLOBAL table (no tenant_id) |
| 005_create_app_components_table.sql | ✅ COMPLIANT | 100% | All fields present |
| 006_create_tenants_table.sql | ⚠️ PARTIAL | 85% | Missing: updated_by, deleted_by |

### Golang Backend Migrations (/golang-backend/migrations/)

| File | Status | Compliance | Issues |
|------|--------|-----------|--------|
| 003_create_tenant_tables.sql | ❌ NON-COMPLIANT | 30% | MySQL syntax, `id VARCHAR(50)`, missing audit fields |
| 004_create_tenants_table.sql | ❌ NON-COMPLIANT | 30% | Same as above |
| 005_create_categories_table.sql | ⚠️ PARTIAL | 60% | Has `_id UUID` but missing some audit fields |
| 006_create_system_categories_table.sql | ⚠️ PARTIAL | 60% | Old schema, replaced by 003 |
| 007_create_app_components_table.sql | ⚠️ PARTIAL | 60% | Needs alignment |
| 008_create_regions_table.sql | ⚠️ PARTIAL | 60% | Needs alignment |

---

## 🔧 REQUIRED CHANGES

### Phase 1: Add Missing Audit Fields

ALL tables need these fields added if missing:

```sql
-- Add to tables that don't have them
ALTER TABLE {table_name}
  ADD COLUMN IF NOT EXISTS created_by UUID NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;

-- Add foreign key constraints
ALTER TABLE {table_name}
  ADD CONSTRAINT fk_{table}_created_by 
    FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_{table}_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_{table}_deleted_by 
    FOREIGN KEY (deleted_by) REFERENCES users(_id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_{table}_created_by ON {table}(created_by);
CREATE INDEX IF NOT EXISTS idx_{table}_updated_by ON {table}(updated_by);
CREATE INDEX IF NOT EXISTS idx_{table}_deleted_by ON {table}(deleted_by);
```

### Phase 2: Golang Backend - Complete Rewrite

**Action**: Rewrite ALL golang-backend migrations to match Supabase standard.

#### Tables to migrate:
1. **tenants** - Main tenant table
2. **tenant_features** → Merge into tenants.settings JSONB
3. **tenant_metadata** → Merge into tenants.metadata JSONB
4. **subscription_plans** - New schema
5. **plan_features** - New schema
6. **usage_metrics** - New schema
7. **invoices** - New schema
8. **invoice_items** - New schema
9. **tenant_audit_log** - New schema

---

## 📝 MIGRATION SCRIPTS

### Script 1: Add Audit Fields to Existing Tables

```sql
-- ============================================
-- Migration: Add Complete Audit Trail
-- Description: Add created_by, updated_by, deleted_by to all tables
-- Date: 2026-01-12
-- ============================================

-- Function to add audit fields to a table
CREATE OR REPLACE FUNCTION add_audit_fields(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Add created_by if not exists
  EXECUTE format('
    ALTER TABLE %I 
    ADD COLUMN IF NOT EXISTS created_by UUID NULL
  ', table_name);
  
  -- Add updated_by if not exists
  EXECUTE format('
    ALTER TABLE %I 
    ADD COLUMN IF NOT EXISTS updated_by UUID NULL
  ', table_name);
  
  -- Add deleted_by if not exists
  EXECUTE format('
    ALTER TABLE %I 
    ADD COLUMN IF NOT EXISTS deleted_by UUID NULL
  ', table_name);
  
  -- Add foreign key constraints (will fail if users table doesn't exist)
  BEGIN
    EXECUTE format('
      ALTER TABLE %I
      ADD CONSTRAINT fk_%I_created_by 
        FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL
    ', table_name, table_name);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN 
      RAISE NOTICE 'Users table not found, skipping FK for created_by';
  END;
  
  BEGIN
    EXECUTE format('
      ALTER TABLE %I
      ADD CONSTRAINT fk_%I_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL
    ', table_name, table_name);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN 
      RAISE NOTICE 'Users table not found, skipping FK for updated_by';
  END;
  
  BEGIN
    EXECUTE format('
      ALTER TABLE %I
      ADD CONSTRAINT fk_%I_deleted_by 
        FOREIGN KEY (deleted_by) REFERENCES users(_id) ON DELETE SET NULL
    ', table_name, table_name);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN 
      RAISE NOTICE 'Users table not found, skipping FK for deleted_by';
  END;
  
  -- Add indexes
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%I_created_by ON %I(created_by)
  ', table_name, table_name);
  
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%I_updated_by ON %I(updated_by)
  ', table_name, table_name);
  
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS idx_%I_deleted_by ON %I(deleted_by)
  ', table_name, table_name);
  
  RAISE NOTICE 'Added audit fields to table: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Apply to all tables
-- ============================================

-- TENANT-SPECIFIC TABLES
SELECT add_audit_fields('system_categories');
SELECT add_audit_fields('app_components');
SELECT add_audit_fields('tenants');
-- Add more tables as needed

-- Verify
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name IN ('created_by', 'updated_by', 'deleted_by')
  AND table_schema = 'public'
ORDER BY table_name, column_name;
```

### Script 2: Migrate Golang Backend Tables to PostgreSQL

```sql
-- ============================================
-- Migration: Rewrite Tenant Tables for PostgreSQL
-- Description: Convert MySQL syntax to PostgreSQL with full go-framework compliance
-- Date: 2026-01-12
-- ============================================

-- Drop old tables if exist
DROP TABLE IF EXISTS tenant_audit_log CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS usage_metrics CASCADE;
DROP TABLE IF EXISTS plan_features CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS tenant_metadata CASCADE;
DROP TABLE IF EXISTS tenant_features CASCADE;
-- Note: tenants table handled separately to preserve data

-- ============================================
-- Recreate: tenants (if starting fresh)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  -- Identity (NO tenant_id - this is the SOURCE table)
  _id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core business fields
  code                    VARCHAR(100) NOT NULL UNIQUE,
  name                    VARCHAR(255) NOT NULL,
  slug                    VARCHAR(100) NOT NULL UNIQUE,
  domain                  VARCHAR(255),
  
  -- Subscription & billing
  subscription_tier       VARCHAR(20) NOT NULL DEFAULT 'free' 
                          CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date   TIMESTAMPTZ,
  billing_type            VARCHAR(20) DEFAULT 'POSTPAID' 
                          CHECK (billing_type IN ('PREPAID', 'POSTPAID')),
  
  -- Limits & usage
  max_users               INT NOT NULL DEFAULT 10,
  current_users           INT NOT NULL DEFAULT 0,
  max_storage             INT NOT NULL DEFAULT 10,  -- GB
  current_storage         DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- GB
  
  -- Status & compliance
  status                  VARCHAR(20) NOT NULL DEFAULT 'trial' 
                          CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  compliance_level        VARCHAR(20) DEFAULT 'STANDARD' 
                          CHECK (compliance_level IN ('STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS')),
  data_region             VARCHAR(50) DEFAULT 'ap-southeast-1',
  timezone                VARCHAR(50) DEFAULT 'UTC',
  
  -- Multi-tenancy hierarchy
  parent_tenant_id        UUID REFERENCES tenants(_id),
  path                    TEXT,  -- Materialized path
  
  -- Flexible metadata
  profile                 JSONB DEFAULT '{}'::jsonb,  -- Logo, website, tax info
  settings                JSONB DEFAULT '{}'::jsonb,  -- Security policies, features
  metadata                JSONB DEFAULT '{}'::jsonb,  -- Other custom fields
  active_apps             TEXT[],
  
  -- Audit trail (COMPLETE)
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID NULL,
  updated_by              UUID NULL,
  
  -- Soft delete
  deleted_at              TIMESTAMPTZ NULL,
  deleted_by              UUID NULL,
  
  -- Optimistic locking
  version                 BIGINT NOT NULL DEFAULT 1 CHECK (version >= 1),
  
  -- Constraints
  CHECK (updated_at >= created_at),
  CHECK (current_users >= 0 AND current_users <= max_users),
  CHECK (current_storage >= 0 AND current_storage <= max_storage)
);

-- Indexes
CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_tier ON tenants(subscription_tier);
CREATE INDEX idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at);
CREATE INDEX idx_tenants_created_by ON tenants(created_by);
CREATE INDEX idx_tenants_updated_by ON tenants(updated_by);
CREATE INDEX idx_tenants_deleted_by ON tenants(deleted_by);

-- Triggers
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_tenants_updated_at();

-- Comments
COMMENT ON TABLE tenants IS 'Main tenant/organization table for multi-tenant SaaS';
COMMENT ON COLUMN tenants._id IS 'Primary key (UUID v7)';
COMMENT ON COLUMN tenants.profile IS 'JSONB: logo_url, website, tax_code, description, socials';
COMMENT ON COLUMN tenants.settings IS 'JSONB: password_policy, mfa_enforced, ip_whitelist, session_policy, rate_limiting';
COMMENT ON COLUMN tenants.version IS 'Optimistic locking version';
```

---

## 🚀 EXECUTION PLAN

### Step 1: Backup Current Database
```bash
# Supabase
pg_dump -h your-db-host -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Or using Supabase CLI
supabase db dump -f backup.sql
```

### Step 2: Run Migration Scripts in Order

```bash
# 1. Add audit fields to existing Supabase tables
psql -f supabase/migrations/007_add_audit_fields.sql

# 2. Recreate Golang backend tables (PostgreSQL version)
psql -f golang-backend/migrations/NEW_001_create_tenants_compliant.sql
psql -f golang-backend/migrations/NEW_002_create_subscription_tables.sql
psql -f golang-backend/migrations/NEW_003_create_billing_tables.sql
```

### Step 3: Data Migration (if needed)

```sql
-- Migrate data from old MySQL-style tables to new PostgreSQL tables
-- Example: tenants
INSERT INTO tenants_new (
  _id, code, name, status, ...
)
SELECT 
  gen_random_uuid(),  -- Convert VARCHAR id to UUID
  code, name, status, ...
FROM tenants_old;
```

### Step 4: Verify Migration

```sql
-- Check all tables have required fields
SELECT 
  table_name,
  COUNT(*) FILTER (WHERE column_name = '_id') as has_id,
  COUNT(*) FILTER (WHERE column_name = 'tenant_id') as has_tenant_id,
  COUNT(*) FILTER (WHERE column_name = 'created_at') as has_created_at,
  COUNT(*) FILTER (WHERE column_name = 'updated_at') as has_updated_at,
  COUNT(*) FILTER (WHERE column_name = 'created_by') as has_created_by,
  COUNT(*) FILTER (WHERE column_name = 'updated_by') as has_updated_by,
  COUNT(*) FILTER (WHERE column_name = 'deleted_at') as has_deleted_at,
  COUNT(*) FILTER (WHERE column_name = 'deleted_by') as has_deleted_by,
  COUNT(*) FILTER (WHERE column_name = 'version') as has_version
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

### Step 5: Update Application Code

Update API handlers to populate audit fields:

```go
// Example: Go backend
func CreateTenant(ctx context.Context, req CreateTenantRequest) error {
  userID := getUserIDFromContext(ctx)
  
  tenant := Tenant{
    ID:        uuid.New(),
    Code:      req.Code,
    Name:      req.Name,
    CreatedAt: time.Now(),
    UpdatedAt: time.Now(),
    CreatedBy: &userID,  // ← Add this
    Version:   1,
  }
  
  return db.Create(&tenant).Error
}

func UpdateTenant(ctx context.Context, id uuid.UUID, req UpdateTenantRequest) error {
  userID := getUserIDFromContext(ctx)
  
  return db.Model(&Tenant{}).
    Where("_id = ? AND version = ?", id, req.CurrentVersion).
    Updates(map[string]interface{}{
      "name":       req.Name,
      "updated_at": time.Now(),
      "updated_by": userID,  // ← Add this
      "version":    gorm.Expr("version + 1"),
    }).Error
}

func DeleteTenant(ctx context.Context, id uuid.UUID) error {
  userID := getUserIDFromContext(ctx)
  
  return db.Model(&Tenant{}).
    Where("_id = ?", id).
    Updates(map[string]interface{}{
      "deleted_at": time.Now(),
      "deleted_by": userID,  // ← Add this
      "version":    gorm.Expr("version + 1"),
    }).Error
}
```

---

## ✅ VALIDATION CHECKLIST

After migration, verify:

- [ ] All tables have `_id UUID PRIMARY KEY`
- [ ] Tenant-specific tables have `tenant_id UUID NOT NULL`
- [ ] All tables have `created_at`, `updated_at`, `created_by`, `updated_by`
- [ ] All tables have `deleted_at`, `deleted_by`
- [ ] All tables have `version BIGINT DEFAULT 1`
- [ ] All indexes created (tenant_id, deleted_at, audit fields)
- [ ] All triggers for `updated_at` working
- [ ] Foreign key constraints on audit fields
- [ ] Application code populates audit fields correctly
- [ ] Soft delete working (deleted records hidden from queries)
- [ ] Optimistic locking prevents concurrent updates
- [ ] Performance acceptable (check slow queries)

---

## 📚 REFERENCE TABLES

### Complete Field Set for TENANT Tables

```sql
-- Identity & Tenancy
_id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id         UUID NOT NULL  -- REFERENCES tenants(_id)

-- Business fields (varies by table)
code              VARCHAR(100) NOT NULL
name              VARCHAR(255) NOT NULL
status            SMALLINT DEFAULT 1

-- Audit trail (COMPLETE SET)
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by        UUID NULL  -- REFERENCES users(_id)
updated_by        UUID NULL  -- REFERENCES users(_id)

-- Soft delete (COMPLETE SET)
deleted_at        TIMESTAMPTZ NULL
deleted_by        UUID NULL  -- REFERENCES users(_id)

-- Versioning
version           BIGINT NOT NULL DEFAULT 1
```

### Complete Field Set for GLOBAL Tables

```sql
-- Identity (NO tenant_id)
_id               UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Business fields
code              VARCHAR(100) UNIQUE NOT NULL
name              VARCHAR(255) NOT NULL

-- Audit trail (COMPLETE SET)
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by        UUID NULL
updated_by        UUID NULL

-- Soft delete (COMPLETE SET)
deleted_at        TIMESTAMPTZ NULL
deleted_by        UUID NULL

-- Versioning
version           BIGINT NOT NULL DEFAULT 1
```

---

## 🔗 RELATED DOCUMENTS

- `/docs/Database.md` - Full architecture guide from go-framework
- `/docs/Collections.md` - Complete table definitions
- `/DATABASE_SCHEMA_STANDARD.md` - Current project standard
- `/TABLES_CLASSIFICATION.md` - GLOBAL vs TENANT tables
- `/docs/DATABASE_COMPARISON_ANALYSIS.md` - Detailed comparison

---

**Migration Status**: 🚧 In Progress  
**Estimated Time**: 4-8 hours  
**Risk Level**: Medium (requires backup and testing)
