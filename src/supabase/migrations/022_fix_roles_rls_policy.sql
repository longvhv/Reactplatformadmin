-- ============================================
-- Fix Roles RLS Policy
-- Allow anon key to read roles data
-- Bug: Roles page showing no data because RLS blocked anon access
-- ============================================

-- Drop old policy that only allows authenticated users
DROP POLICY IF EXISTS "Allow read roles for authenticated users" ON roles;

-- Create new policy that allows anon to read
CREATE POLICY "Allow read roles for all users"
  ON roles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Keep the service role policy for all operations
-- (This policy already exists, just documenting it here)
-- CREATE POLICY "Allow all for service role"
--   ON roles FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);

-- ============================================
-- Notes:
-- - This allows public read access to roles table
-- - Write operations still require service_role
-- - This is safe because roles are not sensitive data
-- - Each tenant's data is still isolated by tenant_id filter in app
-- ============================================
