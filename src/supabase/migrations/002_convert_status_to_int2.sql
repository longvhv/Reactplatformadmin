-- Migration: Convert status from VARCHAR to INT2
-- Purpose: Change all status fields from 'active'/'inactive' strings to 0/1 integers
-- Date: 2026-01-08

-- Step 1: Update existing data to temporary numeric values
UPDATE system_categories SET status = '1' WHERE status = 'active';
UPDATE system_categories SET status = '0' WHERE status = 'inactive';

-- Step 2: Update categoryGroup for SystemCategoryGroup records  
UPDATE system_categories SET "categoryGroup" = 'business' WHERE code = 'GRP_BUSINESS';
UPDATE system_categories SET "categoryGroup" = 'user' WHERE code = 'GRP_USER';
UPDATE system_categories SET "categoryGroup" = 'technical' WHERE code = 'GRP_TECHNICAL';
UPDATE system_categories SET "categoryGroup" = 'app_components' WHERE code = 'GRP_APP_COMPONENTS';
UPDATE system_categories SET "categoryGroup" = 'regions' WHERE code = 'GRP_REGIONS';

-- Step 3: Alter column type from VARCHAR to INT2
ALTER TABLE system_categories 
ALTER COLUMN status TYPE INT2 USING status::INT2;

-- Step 4: Add constraint to ensure only 0 or 1 values
ALTER TABLE system_categories 
ADD CONSTRAINT status_check CHECK (status IN (0, 1));

-- Step 5: Set default value to 1 (active)
ALTER TABLE system_categories 
ALTER COLUMN status SET DEFAULT 1;

-- Step 6: Drop and recreate index for better performance
DROP INDEX IF EXISTS idx_system_categories_status;
CREATE INDEX idx_system_categories_status ON system_categories(status);

-- Verify the migration
SELECT 
  code, 
  name, 
  type, 
  "categoryGroup", 
  status,
  CASE 
    WHEN status = 1 THEN 'active' 
    WHEN status = 0 THEN 'inactive'
    ELSE 'unknown'
  END as status_label
FROM system_categories
ORDER BY type DESC, "order";
