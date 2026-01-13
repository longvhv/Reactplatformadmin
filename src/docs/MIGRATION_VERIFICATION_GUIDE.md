# Database Migration Verification Guide

**Date**: 2026-01-12  
**Purpose**: Step-by-step verification checklist for go-framework database migration

---

## 🎯 PRE-MIGRATION CHECKLIST

Before running migrations:

- [ ] **Backup database** - Create full backup
- [ ] **Review migration scripts** - Check all SQL files
- [ ] **Notify team** - Inform stakeholders about migration
- [ ] **Schedule downtime** - If required
- [ ] **Test in staging** - Run migrations in non-production first

### Backup Command

```bash
# Supabase
supabase db dump -f backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Or PostgreSQL direct
pg_dump -h your-host -U your-user -d your-database > backup.sql
```

---

## 📋 MIGRATION EXECUTION STEPS

### Step 1: Run Supabase Audit Trail Migration

```bash
# Run migration 007
psql -h your-host -U postgres -d postgres -f supabase/migrations/007_add_complete_audit_trail.sql

# Or using Supabase CLI
supabase db push
```

**Expected Output:**
```
✓ created_by added
✓ updated_by added
✓ deleted_by added
✓ FK created_by added
✓ FK updated_by added
✓ FK deleted_by added
✓ Index created_by added
✓ Index updated_by added
✓ Index deleted_by added
```

### Step 2: Run Golang Backend Migrations (if starting fresh)

```bash
# Run NEW compliant migrations
psql -f golang-backend/migrations/NEW_001_create_tenants_compliant.sql
```

---

## ✅ POST-MIGRATION VERIFICATION

### Verification 1: Check All Tables Have Required Fields

```sql
-- Run this query to check compliance
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = '_id'
  ) THEN '✓' ELSE '✗' END as has_id,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'tenant_id'
  ) THEN '✓' ELSE '-' END as has_tenant_id,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'created_at'
  ) THEN '✓' ELSE '✗' END as has_created_at,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'updated_at'
  ) THEN '✓' ELSE '✗' END as has_updated_at,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'created_by'
  ) THEN '✓' ELSE '✗' END as has_created_by,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'updated_by'
  ) THEN '✓' ELSE '✗' END as has_updated_by,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'deleted_at'
  ) THEN '✓' ELSE '✗' END as has_deleted_at,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'deleted_by'
  ) THEN '✓' ELSE '✗' END as has_deleted_by,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns c 
    WHERE c.table_name = t.table_name AND c.column_name = 'version'
  ) THEN '✓' ELSE '✗' END as has_version
  
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
ORDER BY t.table_name;
```

**Expected Result:** All tables should have ✓ for all fields (except tenant_id which may be - for GLOBAL tables)

---

### Verification 2: Check Foreign Key Constraints

```sql
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('created_by', 'updated_by', 'deleted_by', 'tenant_id')
ORDER BY tc.table_name, kcu.column_name;
```

**Expected Result:** Should see FK constraints for audit fields pointing to `users(_id)`

---

### Verification 3: Check Indexes

```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%created_by%' OR
    indexname LIKE '%updated_by%' OR
    indexname LIKE '%deleted_by%' OR
    indexname LIKE '%tenant_id%' OR
    indexname LIKE '%deleted_at%'
  )
ORDER BY tablename, indexname;
```

**Expected Result:** Each table should have indexes on audit fields

---

### Verification 4: Check Triggers

```sql
SELECT 
  trigger_name,
  event_object_table as table_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;
```

**Expected Result:** Each table should have `trigger_{table}_updated_at` trigger

---

### Verification 5: Test Soft Delete

```sql
-- Create test record
INSERT INTO system_categories (
  tenant_id, code, name, type, status,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'TEST_DELETE',
  'Test Delete Record',
  'SYSTEM_CATEGORY_TYPE',
  1,
  '00000000-0000-0000-0000-000000000001'  -- Test user
) RETURNING _id;

-- Soft delete it
UPDATE system_categories
SET 
  deleted_at = NOW(),
  deleted_by = '00000000-0000-0000-0000-000000000001',
  version = version + 1
WHERE code = 'TEST_DELETE';

-- Verify it's marked as deleted
SELECT 
  _id, code, name, 
  deleted_at IS NOT NULL as is_deleted,
  deleted_by,
  version
FROM system_categories
WHERE code = 'TEST_DELETE';

-- Verify it's excluded from normal queries
SELECT COUNT(*) as should_be_zero
FROM system_categories
WHERE code = 'TEST_DELETE'
  AND deleted_at IS NULL;

-- Cleanup
DELETE FROM system_categories WHERE code = 'TEST_DELETE';
```

**Expected Result:**
- `is_deleted` should be `true`
- `deleted_by` should have UUID value
- `should_be_zero` should be `0`

---

### Verification 6: Test Optimistic Locking

```sql
-- Create test record
INSERT INTO system_categories (
  tenant_id, code, name, type, status, version
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'TEST_VERSION',
  'Test Version Control',
  'SYSTEM_CATEGORY_TYPE',
  1,
  1
) RETURNING _id, version;

-- Simulate concurrent update (with correct version)
UPDATE system_categories
SET 
  name = 'Updated Name',
  version = version + 1
WHERE code = 'TEST_VERSION'
  AND version = 1;

-- Check affected rows
GET DIAGNOSTICS affected_rows = ROW_COUNT;
-- Should be 1

-- Simulate conflicting update (with outdated version)
UPDATE system_categories
SET 
  name = 'Conflicting Update',
  version = version + 1
WHERE code = 'TEST_VERSION'
  AND version = 1;  -- Wrong version! Should be 2 now

-- Check affected rows
GET DIAGNOSTICS affected_rows = ROW_COUNT;
-- Should be 0 (conflict detected)

-- Verify final state
SELECT code, name, version
FROM system_categories
WHERE code = 'TEST_VERSION';

-- Cleanup
DELETE FROM system_categories WHERE code = 'TEST_VERSION';
```

**Expected Result:**
- First update should succeed (1 row affected)
- Second update should fail (0 rows affected - version mismatch)
- Final `name` should be `'Updated Name'`, `version` should be `2`

---

### Verification 7: Test Audit Trail Population

```sql
-- Create test record with audit fields
INSERT INTO system_categories (
  tenant_id, code, name, type, status,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'TEST_AUDIT',
  'Test Audit Trail',
  'SYSTEM_CATEGORY_TYPE',
  1,
  '00000000-0000-0000-0000-000000000001'  -- Creator user
) RETURNING _id, created_at, created_by;

-- Update with audit
UPDATE system_categories
SET 
  name = 'Updated by User',
  updated_by = '00000000-0000-0000-0000-000000000002'  -- Updater user
WHERE code = 'TEST_AUDIT';

-- Verify audit trail
SELECT 
  code,
  created_at,
  updated_at,
  created_by,
  updated_by,
  updated_at > created_at as was_updated
FROM system_categories
WHERE code = 'TEST_AUDIT';

-- Cleanup
DELETE FROM system_categories WHERE code = 'TEST_AUDIT';
```

**Expected Result:**
- `created_by` should have creator UUID
- `updated_by` should have updater UUID
- `was_updated` should be `true`

---

## 🔍 DETAILED FIELD VALIDATION

### Check Exact Data Types

```sql
SELECT 
  table_name,
  column_name,
  data_type,
  udt_name,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'system_categories', 'app_components', 'regions')
  AND column_name IN (
    '_id', 'tenant_id', 
    'created_at', 'updated_at', 'created_by', 'updated_by',
    'deleted_at', 'deleted_by',
    'version'
  )
ORDER BY table_name, 
  CASE column_name
    WHEN '_id' THEN 1
    WHEN 'tenant_id' THEN 2
    WHEN 'created_at' THEN 3
    WHEN 'updated_at' THEN 4
    WHEN 'created_by' THEN 5
    WHEN 'updated_by' THEN 6
    WHEN 'deleted_at' THEN 7
    WHEN 'deleted_by' THEN 8
    WHEN 'version' THEN 9
  END;
```

**Expected Types:**
- `_id`: `uuid`, NOT NULL
- `tenant_id`: `uuid`, NOT NULL (except GLOBAL tables)
- `created_at`: `timestamp with time zone`, NOT NULL, DEFAULT NOW()
- `updated_at`: `timestamp with time zone`, NOT NULL, DEFAULT NOW()
- `created_by`: `uuid`, NULL
- `updated_by`: `uuid`, NULL
- `deleted_at`: `timestamp with time zone`, NULL
- `deleted_by`: `uuid`, NULL
- `version`: `bigint` or `integer`, NOT NULL, DEFAULT 1

---

## 📊 PERFORMANCE VALIDATION

### Check Index Usage

```sql
-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%created_by%' OR
    indexname LIKE '%updated_by%' OR
    indexname LIKE '%deleted_by%' OR
    indexname LIKE '%tenant_id%' OR
    indexname LIKE '%deleted_at%'
  )
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Explain Query Plan (with tenant_id filter)

```sql
EXPLAIN ANALYZE
SELECT *
FROM system_categories
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
  AND deleted_at IS NULL;
```

**Expected:** Should use `idx_system_categories_tenant_deleted` composite index

---

## 🎨 APPLICATION CODE VERIFICATION

### Example: Check if API populates audit fields

```typescript
// Frontend example (TypeScript/React)
const createCategory = async (data: CategoryFormData) => {
  const currentUser = getCurrentUser(); // Get from auth context
  
  const response = await api.post('/system-categories', {
    ...data,
    created_by: currentUser._id  // ✅ Should populate
  });
  
  return response.data;
};

const updateCategory = async (id: string, data: CategoryFormData, currentVersion: number) => {
  const currentUser = getCurrentUser();
  
  const response = await api.put(`/system-categories/${id}`, {
    ...data,
    updated_by: currentUser._id,  // ✅ Should populate
    version: currentVersion  // ✅ Optimistic locking
  });
  
  return response.data;
};

const deleteCategory = async (id: string) => {
  const currentUser = getCurrentUser();
  
  const response = await api.delete(`/system-categories/${id}`, {
    data: {
      deleted_by: currentUser._id  // ✅ Should populate
    }
  });
  
  return response.data;
};
```

---

## ✅ FINAL COMPLIANCE CHECKLIST

After completing all verifications, check off:

### Database Schema
- [ ] All tables have `_id UUID PRIMARY KEY`
- [ ] Tenant-specific tables have `tenant_id UUID NOT NULL`
- [ ] All tables have `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- [ ] All tables have `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- [ ] All tables have `created_by UUID NULL`
- [ ] All tables have `updated_by UUID NULL`
- [ ] All tables have `deleted_at TIMESTAMPTZ NULL`
- [ ] All tables have `deleted_by UUID NULL`
- [ ] All tables have `version BIGINT NOT NULL DEFAULT 1`

### Constraints & Indexes
- [ ] Foreign keys on `created_by`, `updated_by`, `deleted_by` → `users(_id)`
- [ ] Index on `tenant_id` (for tenant tables)
- [ ] Index on `deleted_at`
- [ ] Composite index on `(tenant_id, deleted_at)` (for tenant tables)
- [ ] Indexes on `created_by`, `updated_by`, `deleted_by`
- [ ] CHECK constraint: `updated_at >= created_at`
- [ ] CHECK constraint: `version >= 1`

### Triggers
- [ ] BEFORE UPDATE trigger for `updated_at` auto-update

### Application Logic
- [ ] Create operations populate `created_by`
- [ ] Update operations populate `updated_by` and increment `version`
- [ ] Delete operations populate `deleted_at` and `deleted_by` (soft delete)
- [ ] Queries filter `deleted_at IS NULL` by default
- [ ] Optimistic locking implemented (check version before update)

### Testing
- [ ] Soft delete working correctly
- [ ] Optimistic locking preventing concurrent updates
- [ ] Audit trail captured on all operations
- [ ] Performance acceptable (indexes working)
- [ ] Foreign key cascades working as expected

---

## 🚨 ROLLBACK PLAN

If migration fails, rollback steps:

```sql
-- Rollback Step 1: Drop audit fields
ALTER TABLE {table_name}
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS deleted_by CASCADE;

-- Rollback Step 2: Drop indexes
DROP INDEX IF EXISTS idx_{table}_created_by;
DROP INDEX IF EXISTS idx_{table}_updated_by;
DROP INDEX IF EXISTS idx_{table}_deleted_by;

-- Rollback Step 3: Restore from backup
-- psql -f backup_pre_migration_YYYYMMDD_HHMMSS.sql
```

---

## 📈 MONITORING POST-MIGRATION

Monitor these metrics after migration:

1. **Query Performance**
   - Check slow query log
   - Monitor index usage statistics
   - Check query execution plans

2. **Data Integrity**
   - Verify no NULL violations
   - Check FK constraint violations
   - Monitor version conflicts

3. **Application Errors**
   - Check application logs for migration-related errors
   - Monitor API error rates
   - Test all CRUD operations

---

**Verification Status**: ⏳ Pending  
**Last Updated**: 2026-01-12  
**Next Review**: After migration execution
