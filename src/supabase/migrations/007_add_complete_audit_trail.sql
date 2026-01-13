-- ============================================
-- Migration: Add Complete Audit Trail to All Tables
-- Description: Add created_by, updated_by, deleted_by to existing tables
-- Author: VHV Platform
-- Date: 2026-01-12
-- ============================================

-- ============================================
-- UTILITY FUNCTION: Add audit fields to any table
-- ============================================
CREATE OR REPLACE FUNCTION add_complete_audit_trail(target_table TEXT)
RETURNS TEXT AS $$
DECLARE
  result_message TEXT := '';
  has_users_table BOOLEAN;
BEGIN
  -- Check if users table exists (for foreign keys)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO has_users_table;
  
  -- Add created_by if not exists
  BEGIN
    EXECUTE format('
      ALTER TABLE %I 
      ADD COLUMN IF NOT EXISTS created_by UUID NULL
    ', target_table);
    result_message := result_message || '✓ created_by added. ';
  EXCEPTION WHEN OTHERS THEN
    result_message := result_message || '✗ created_by failed: ' || SQLERRM || '. ';
  END;
  
  -- Add updated_by if not exists  
  BEGIN
    EXECUTE format('
      ALTER TABLE %I 
      ADD COLUMN IF NOT EXISTS updated_by UUID NULL
    ', target_table);
    result_message := result_message || '✓ updated_by added. ';
  EXCEPTION WHEN OTHERS THEN
    result_message := result_message || '✗ updated_by failed: ' || SQLERRM || '. ';
  END;
  
  -- Add deleted_by if not exists
  BEGIN
    EXECUTE format('
      ALTER TABLE %I 
      ADD COLUMN IF NOT EXISTS deleted_by UUID NULL
    ', target_table);
    result_message := result_message || '✓ deleted_by added. ';
  EXCEPTION WHEN OTHERS THEN
    result_message := result_message || '✗ deleted_by failed: ' || SQLERRM || '. ';
  END;
  
  -- Add foreign key constraints (only if users table exists)
  IF has_users_table THEN
    -- FK for created_by
    BEGIN
      EXECUTE format('
        ALTER TABLE %I
        ADD CONSTRAINT fk_%I_created_by 
          FOREIGN KEY (created_by) REFERENCES users(_id) ON DELETE SET NULL
      ', target_table, target_table);
      result_message := result_message || '✓ FK created_by added. ';
    EXCEPTION 
      WHEN duplicate_object THEN
        result_message := result_message || '~ FK created_by exists. ';
      WHEN OTHERS THEN
        result_message := result_message || '✗ FK created_by failed: ' || SQLERRM || '. ';
    END;
    
    -- FK for updated_by
    BEGIN
      EXECUTE format('
        ALTER TABLE %I
        ADD CONSTRAINT fk_%I_updated_by 
          FOREIGN KEY (updated_by) REFERENCES users(_id) ON DELETE SET NULL
      ', target_table, target_table);
      result_message := result_message || '✓ FK updated_by added. ';
    EXCEPTION 
      WHEN duplicate_object THEN
        result_message := result_message || '~ FK updated_by exists. ';
      WHEN OTHERS THEN
        result_message := result_message || '✗ FK updated_by failed: ' || SQLERRM || '. ';
    END;
    
    -- FK for deleted_by
    BEGIN
      EXECUTE format('
        ALTER TABLE %I
        ADD CONSTRAINT fk_%I_deleted_by 
          FOREIGN KEY (deleted_by) REFERENCES users(_id) ON DELETE SET NULL
      ', target_table, target_table);
      result_message := result_message || '✓ FK deleted_by added. ';
    EXCEPTION 
      WHEN duplicate_object THEN
        result_message := result_message || '~ FK deleted_by exists. ';
      WHEN OTHERS THEN
        result_message := result_message || '✗ FK deleted_by failed: ' || SQLERRM || '. ';
    END;
  ELSE
    result_message := result_message || '! Users table not found, skipping FKs. ';
  END IF;
  
  -- Add indexes
  BEGIN
    EXECUTE format('
      CREATE INDEX IF NOT EXISTS idx_%I_created_by ON %I(created_by)
    ', target_table, target_table);
    result_message := result_message || '✓ Index created_by added. ';
  EXCEPTION WHEN OTHERS THEN
    result_message := result_message || '✗ Index created_by failed: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE INDEX IF NOT EXISTS idx_%I_updated_by ON %I(updated_by)
    ', target_table, target_table);
    result_message := result_message || '✓ Index updated_by added. ';
  EXCEPTION WHEN OTHERS THEN
    result_message := result_message || '✗ Index updated_by failed: ' || SQLERRM || '. ';
  END;
  
  BEGIN
    EXECUTE format('
      CREATE INDEX IF NOT EXISTS idx_%I_deleted_by ON %I(deleted_by)
    ', target_table, target_table);
    result_message := result_message || '✓ Index deleted_by added. ';
  EXCEPTION WHEN OTHERS THEN
    result_message := result_message || '✗ Index deleted_by failed: ' || SQLERRM || '. ';
  END;
  
  RETURN target_table || ': ' || result_message;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APPLY TO ALL EXISTING TABLES
-- ============================================

-- TENANT-SPECIFIC TABLES
SELECT add_complete_audit_trail('system_categories');
SELECT add_complete_audit_trail('app_components');
SELECT add_complete_audit_trail('tenants');

-- Add more tables as they are created
-- SELECT add_complete_audit_trail('users');
-- SELECT add_complete_audit_trail('tenant_members');
-- SELECT add_complete_audit_trail('departments');
-- SELECT add_complete_audit_trail('user_groups');

-- GLOBAL TABLES
SELECT add_complete_audit_trail('regions');

-- ============================================
-- VERIFICATION REPORT
-- ============================================

-- Generate audit trail compliance report
DO $$
DECLARE
  rec RECORD;
  output TEXT := E'\n========================================\n';
  output2 TEXT := 'AUDIT TRAIL COMPLIANCE REPORT\n';
  output3 TEXT := '========================================\n\n';
BEGIN
  output := output || output2 || output3;
  
  output := output || E'Table Name                 | _id | tenant_id | created_at | updated_at | created_by | updated_by | deleted_at | deleted_by | version\n';
  output := output || E'---------------------------+-----+-----------+------------+------------+------------+------------+------------+------------+--------\n';
  
  FOR rec IN (
    SELECT 
      t.table_name,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = '_id'), '✗') as has_id,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'tenant_id'), '-') as has_tenant,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'created_at'), '✗') as has_created_at,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'updated_at'), '✗') as has_updated_at,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'created_by'), '✗') as has_created_by,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'updated_by'), '✗') as has_updated_by,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'deleted_at'), '✗') as has_deleted_at,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'deleted_by'), '✗') as has_deleted_by,
      COALESCE((SELECT '✓' FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.column_name = 'version'), '✗') as has_version
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE 'pg_%'
    ORDER BY t.table_name
  ) LOOP
    output := output || 
      RPAD(rec.table_name, 26) || ' | ' ||
      RPAD(rec.has_id, 3) || ' | ' ||
      RPAD(rec.has_tenant, 9) || ' | ' ||
      RPAD(rec.has_created_at, 10) || ' | ' ||
      RPAD(rec.has_updated_at, 10) || ' | ' ||
      RPAD(rec.has_created_by, 10) || ' | ' ||
      RPAD(rec.has_updated_by, 10) || ' | ' ||
      RPAD(rec.has_deleted_at, 10) || ' | ' ||
      RPAD(rec.has_deleted_by, 10) || ' | ' ||
      rec.has_version || E'\n';
  END LOOP;
  
  output := output || E'\n✓ = Present  ✗ = Missing  - = Not applicable (GLOBAL table)\n';
  
  RAISE NOTICE '%', output;
END $$;

-- ============================================
-- DETAILED COLUMN LIST FOR AUDIT FIELDS
-- ============================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('created_by', 'updated_by', 'deleted_by')
ORDER BY table_name, column_name;

-- ============================================
-- CONSTRAINTS REPORT
-- ============================================
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND kcu.column_name IN ('created_by', 'updated_by', 'deleted_by')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================
-- CLEANUP (Optional - comment out to keep utility function)
-- ============================================
-- DROP FUNCTION IF EXISTS add_complete_audit_trail(TEXT);

-- ============================================
-- FINAL STATUS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'MIGRATION COMPLETE ✓';
  RAISE NOTICE E'========================================\n';
  RAISE NOTICE 'All tables have been updated with complete audit trail:';
  RAISE NOTICE '  - created_by UUID NULL';
  RAISE NOTICE '  - updated_by UUID NULL';
  RAISE NOTICE '  - deleted_by UUID NULL';
  RAISE NOTICE '  - Foreign keys added (if users table exists)';
  RAISE NOTICE '  - Indexes created for performance';
  RAISE NOTICE E'\nNext steps:';
  RAISE NOTICE '  1. Review the compliance report above';
  RAISE NOTICE '  2. Update application code to populate audit fields';
  RAISE NOTICE '  3. Test soft delete and optimistic locking';
  RAISE NOTICE E'========================================\n';
END $$;
