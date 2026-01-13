# Golang Backend Migrations - Go-Framework Compliant

**Last Updated**: 2026-01-12  
**Database**: PostgreSQL / YugabyteDB  
**Standard**: vhvplatform/react-framework

---

## 📁 FILE STRUCTURE

```
/golang-backend/migrations/
├── README.md (this file)
│
├── OLD (Legacy - MySQL Syntax) ❌ DO NOT USE
│   ├── 003_create_tenant_tables.sql
│   ├── 004_create_tenants_table.sql
│   ├── 005_create_categories_table.sql
│   ├── 006_create_system_categories_table.sql
│   ├── 007_create_app_components_table.sql
│   └── 008_create_regions_table.sql
│
└── NEW (Go-Framework Compliant) ✅ USE THESE
    ├── NEW_001_create_tenants_compliant.sql
    └── (more to come...)
```

---

## 🚀 QUICK START

### For New Projects (Starting Fresh)

```bash
# Run migrations in order
psql -h your-host -U postgres -d your-db \
  -f NEW_001_create_tenants_compliant.sql
```

### For Existing Projects (Migrating from Old)

See `/docs/MIGRATION_TO_GO_FRAMEWORK_STANDARD.md` for complete migration guide.

---

## ✅ GO-FRAMEWORK STANDARD

All NEW migrations follow these rules:

### 1. Primary Key
```sql
_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### 2. Tenancy (for tenant-specific tables)
```sql
tenant_id UUID NOT NULL
```

### 3. Complete Audit Trail
```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by  UUID NULL
updated_by  UUID NULL
```

### 4. Complete Soft Delete
```sql
deleted_at  TIMESTAMPTZ NULL
deleted_by  UUID NULL
```

### 5. Optimistic Locking
```sql
version     BIGINT NOT NULL DEFAULT 1
```

### 6. Mandatory Indexes
```sql
CREATE INDEX idx_{table}_tenant_id ON {table}(tenant_id);
CREATE INDEX idx_{table}_deleted_at ON {table}(deleted_at);
CREATE INDEX idx_{table}_tenant_deleted ON {table}(tenant_id, deleted_at);
CREATE INDEX idx_{table}_created_by ON {table}(created_by);
CREATE INDEX idx_{table}_updated_by ON {table}(updated_by);
CREATE INDEX idx_{table}_deleted_by ON {table}(deleted_by);
```

### 7. Auto-Update Trigger
```sql
CREATE OR REPLACE FUNCTION update_{table}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_{table}_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION update_{table}_updated_at();
```

---

## 📋 MIGRATION FILES

### NEW_001_create_tenants_compliant.sql

**Purpose**: Create main tenants table with FULL go-framework compliance

**Includes**:
- ✅ Complete audit trail (created_by, updated_by, deleted_by)
- ✅ Soft delete support
- ✅ Optimistic locking
- ✅ Multi-tenancy hierarchy (parent_tenant_id, path)
- ✅ Flexible metadata (profile, settings, metadata JSONB)
- ✅ Subscription & billing fields
- ✅ Compliance & security (data_region, compliance_level)
- ✅ All required indexes
- ✅ Triggers for auto-update
- ✅ Sample data (system tenant, demo tenant)

**Schema Highlights**:
```sql
CREATE TABLE tenants (
  -- Identity
  _id UUID PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- Subscription
  subscription_tier VARCHAR(20) DEFAULT 'free',
  billing_type VARCHAR(20) DEFAULT 'POSTPAID',
  
  -- Limits
  max_users INT DEFAULT 10,
  max_storage INT DEFAULT 10,
  max_projects INT DEFAULT 5,
  
  -- Status
  status VARCHAR(20) DEFAULT 'trial',
  
  -- Metadata
  profile JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  
  -- Audit (COMPLETE)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL,
  updated_by UUID NULL,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID NULL,
  version BIGINT DEFAULT 1
);
```

---

## 🗂️ LEGACY FILES (OLD)

### ❌ DO NOT USE - For Reference Only

These files use MySQL syntax and do NOT follow go-framework standards:

- **003_create_tenant_tables.sql** - Old MySQL version
- **004_create_tenants_table.sql** - Old MySQL version  
- **005_create_categories_table.sql** - Partial compliance
- **006_create_system_categories_table.sql** - Replaced by Supabase migration 003
- **007_create_app_components_table.sql** - Replaced by Supabase migration 005
- **008_create_regions_table.sql** - Replaced by Supabase migration 004

**Issues with OLD files**:
- ❌ Use `id VARCHAR(50)` or `id BIGINT AUTO_INCREMENT` instead of `_id UUID`
- ❌ Missing `created_by`, `updated_by`, `deleted_by`
- ❌ MySQL-specific syntax (ENGINE=InnoDB, CHARSET=utf8mb4)
- ❌ No optimistic locking
- ❌ Incomplete audit trail

---

## 🔧 RUNNING MIGRATIONS

### Option 1: Manual Execution

```bash
# Connect to database
psql -h your-host -U your-user -d your-database

# Run migration file
\i /path/to/NEW_001_create_tenants_compliant.sql

# Verify
SELECT COUNT(*) FROM tenants;
```

### Option 2: Using Migration Tool

```bash
# If using golang-migrate
migrate -path ./golang-backend/migrations \
        -database "postgres://user:pass@host:5432/db" \
        up
```

### Option 3: Using Supabase CLI

```bash
# If integrated with Supabase
supabase db push
```

---

## ✅ VERIFICATION

After running migrations, verify with:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'tenants';

-- Check all required columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenants'
ORDER BY ordinal_position;

-- Check sample data
SELECT _id, code, name, status, version
FROM tenants;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'tenants';
```

---

## 📚 RELATED DOCUMENTATION

- **`/docs/MIGRATION_TO_GO_FRAMEWORK_STANDARD.md`** - Complete migration guide
- **`/docs/MIGRATION_VERIFICATION_GUIDE.md`** - Verification checklist
- **`/docs/DATABASE_COMPARISON_ANALYSIS.md`** - Standard comparison
- **`/DATABASE_SCHEMA_STANDARD.md`** - Project standard
- **`/MIGRATION_COMPLETE_SUMMARY.md`** - Executive summary

---

## 🎯 ROADMAP

### Upcoming Migrations

- [ ] **NEW_002_create_users_compliant.sql** - Global users table
- [ ] **NEW_003_create_tenant_members_compliant.sql** - User-tenant relationship
- [ ] **NEW_004_create_departments_compliant.sql** - Organizational structure
- [ ] **NEW_005_create_subscription_tables.sql** - Subscription & billing
- [ ] **NEW_006_create_auth_tables.sql** - Authentication & security
- [ ] **NEW_007_create_rbac_tables.sql** - Roles & permissions

---

## 🚨 IMPORTANT NOTES

### 1. Database Type
These migrations are for **PostgreSQL / YugabyteDB**.  
They will NOT work with MySQL without significant modifications.

### 2. UUID Extension
Ensure PostgreSQL has UUID extension enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Or for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3. Backup Before Migration
**ALWAYS** backup before running migrations:
```bash
pg_dump -h your-host -U postgres -d your-db > backup.sql
```

### 4. Foreign Key Dependencies
Some migrations depend on others:
- `NEW_002_create_users` must run BEFORE adding FK constraints on audit fields
- `NEW_001_create_tenants` must run BEFORE tenant-specific tables

---

## 🆘 TROUBLESHOOTING

### Error: "extension uuid-ossp does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "function gen_random_uuid() does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Error: "relation 'users' does not exist" (FK constraint)
Foreign keys referencing `users` table are created with `ON DELETE SET NULL`.  
If users table doesn't exist yet, migration will skip FK creation but still add the fields.

---

**Status**: ✅ Ready for Production  
**Version**: 2.0.0 (Go-Framework Compliant)  
**Last Review**: 2026-01-12
