-- =====================================================
-- FIX RLS POLICIES FOR TESTING
-- Run this in Supabase SQL Editor to allow anon access
-- =====================================================

-- IMPORTANT: This is for DEVELOPMENT/TESTING only!
-- DO NOT use in production without proper policies

-- Option 1: Disable RLS completely (easiest for testing)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS enabled but allow all operations for anon/authenticated
-- (Use this if you want RLS but need to test)

-- Allow anon to read tenants
DROP POLICY IF EXISTS "Allow anonymous read access" ON tenants;
CREATE POLICY "Allow anonymous read access"
  ON tenants FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- Allow anon to insert tenants (for testing)
DROP POLICY IF EXISTS "Allow anonymous insert" ON tenants;
CREATE POLICY "Allow anonymous insert"
  ON tenants FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to update tenants (for testing)
DROP POLICY IF EXISTS "Allow anonymous update" ON tenants;
CREATE POLICY "Allow anonymous update"
  ON tenants FOR UPDATE
  TO anon
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

-- Allow anon to delete tenants (for testing)
DROP POLICY IF EXISTS "Allow anonymous delete" ON tenants;
CREATE POLICY "Allow anonymous delete"
  ON tenants FOR DELETE
  TO anon
  USING (true);

-- Repeat for users table
DROP POLICY IF EXISTS "Allow anonymous read access" ON users;
CREATE POLICY "Allow anonymous read access"
  ON users FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Allow anonymous insert" ON users;
CREATE POLICY "Allow anonymous insert"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update" ON users;
CREATE POLICY "Allow anonymous update"
  ON users FOR UPDATE
  TO anon
  USING (deleted_at IS NULL)
  WITH CHECK (deleted_at IS NULL);

-- For other tables, either disable RLS or add similar policies

-- =====================================================
-- VERIFY POLICIES
-- =====================================================

-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants', 'users', 'tenant_members', 
    'departments', 'user_groups', 'group_members',
    'locations'
  )
ORDER BY tablename;

-- Check existing policies on tenants
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'tenants';
