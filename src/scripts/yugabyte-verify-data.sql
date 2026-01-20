/**
 * YugabyteDB Data Verification Script
 * Verify all initialized data is correct
 */

-- ============================================
-- COMPREHENSIVE DATA VERIFICATION
-- ============================================

\echo '============================================'
\echo '🔍 DATA VERIFICATION REPORT'
\echo '============================================'
\echo ''

-- Set tenant ID variable
\set tenant_id '078e19ae-af67-4452-9ccd-10e27acb2dfe'
\set admin_email 'admin@saas.coquan.vn'

-- ============================================
-- 1. APPLICATIONS
-- ============================================

\echo '1️⃣  Applications:'
SELECT 
  _id,
  name,
  code,
  status,
  created_at
FROM applications 
WHERE code = 'PLATFORM_ADMIN';

-- ============================================
-- 2. TENANT APPLICATIONS
-- ============================================

\echo ''
\echo '2️⃣  Tenant Applications:'
SELECT 
  ta._id,
  ta.tenant_id,
  a.name as application_name,
  ta.domain,
  ta.path_prefix,
  ta.is_active
FROM tenant_applications ta
JOIN applications a ON a._id = ta.application_id
WHERE ta.tenant_id = :'tenant_id';

-- ============================================
-- 3. TENANT APP ROUTES
-- ============================================

\echo ''
\echo '3️⃣  Tenant App Routes:'
SELECT 
  route_path,
  route_name,
  route_type,
  is_active
FROM tenant_app_routes
WHERE tenant_id = :'tenant_id'
ORDER BY route_path;

-- ============================================
-- 4. TENANT SUBSCRIPTIONS
-- ============================================

\echo ''
\echo '4️⃣  Tenant Subscriptions:'
SELECT 
  plan_name,
  plan_type,
  status,
  is_unlimited,
  start_date,
  end_date,
  max_users,
  max_storage_gb
FROM tenant_subscriptions
WHERE tenant_id = :'tenant_id';

-- ============================================
-- 5. PERMISSIONS COUNT
-- ============================================

\echo ''
\echo '5️⃣  Permissions:'
SELECT 
  resource,
  COUNT(*) as permission_count,
  STRING_AGG(action, ', ') as actions
FROM permissions
GROUP BY resource
ORDER BY resource;

-- ============================================
-- 6. ROLES
-- ============================================

\echo ''
\echo '6️⃣  Roles:'
SELECT 
  r._id,
  r.name,
  r.code,
  r.is_system,
  COUNT(DISTINCT rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r._id
WHERE r.code = 'ADMINISTRATOR'
GROUP BY r._id, r.name, r.code, r.is_system;

-- ============================================
-- 7. ROLE PERMISSIONS DETAIL
-- ============================================

\echo ''
\echo '7️⃣  Administrator Role Permissions:'
SELECT 
  p.resource,
  p.action,
  p.name,
  p.code
FROM role_permissions rp
JOIN roles r ON r._id = rp.role_id
JOIN permissions p ON p._id = rp.permission_id
WHERE r.code = 'ADMINISTRATOR'
ORDER BY p.resource, p.action;

-- ============================================
-- 8. USERS
-- ============================================

\echo ''
\echo '8️⃣  Admin User:'
SELECT 
  _id,
  email,
  name,
  status,
  is_verified,
  email_verified_at,
  created_at,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✅ Password set'
    ELSE '❌ No password'
  END as password_status
FROM users
WHERE email = :'admin_email';

-- ============================================
-- 9. TENANT MEMBERS
-- ============================================

\echo ''
\echo '9️⃣  Tenant Members:'
SELECT 
  tm._id,
  u.email,
  u.name,
  tm.status,
  tm.role,
  tm.joined_at
FROM tenant_members tm
JOIN users u ON u._id = tm.user_id
WHERE tm.tenant_id = :'tenant_id';

-- ============================================
-- 10. USER ROLES
-- ============================================

\echo ''
\echo '🔟 User Roles:'
SELECT 
  u.email,
  u.name as user_name,
  r.name as role_name,
  r.code as role_code,
  ur.assigned_at
FROM user_roles ur
JOIN users u ON u._id = ur.user_id
JOIN roles r ON r._id = ur.role_id
WHERE ur.tenant_id = :'tenant_id';

-- ============================================
-- SUMMARY COUNTS
-- ============================================

\echo ''
\echo '============================================'
\echo '📊 SUMMARY'
\echo '============================================'

SELECT 
  'Applications' as item,
  COUNT(*)::text as count
FROM applications 
WHERE code = 'PLATFORM_ADMIN'

UNION ALL

SELECT 
  'Tenant Applications',
  COUNT(*)::text
FROM tenant_applications 
WHERE tenant_id = :'tenant_id'

UNION ALL

SELECT 
  'Tenant App Routes',
  COUNT(*)::text
FROM tenant_app_routes 
WHERE tenant_id = :'tenant_id'

UNION ALL

SELECT 
  'Tenant Subscriptions',
  COUNT(*)::text
FROM tenant_subscriptions 
WHERE tenant_id = :'tenant_id'

UNION ALL

SELECT 
  'Total Permissions',
  COUNT(*)::text
FROM permissions

UNION ALL

SELECT 
  'Roles',
  COUNT(*)::text
FROM roles 
WHERE code = 'ADMINISTRATOR'

UNION ALL

SELECT 
  'Role Permissions',
  COUNT(*)::text
FROM role_permissions rp
JOIN roles r ON r._id = rp.role_id
WHERE r.code = 'ADMINISTRATOR'

UNION ALL

SELECT 
  'Users',
  COUNT(*)::text
FROM users 
WHERE email = :'admin_email'

UNION ALL

SELECT 
  'Tenant Members',
  COUNT(*)::text
FROM tenant_members 
WHERE tenant_id = :'tenant_id'

UNION ALL

SELECT 
  'User Roles',
  COUNT(*)::text
FROM user_roles 
WHERE tenant_id = :'tenant_id';

-- ============================================
-- PASSWORD VERIFICATION TEST
-- ============================================

\echo ''
\echo '============================================'
\echo '🔐 PASSWORD VERIFICATION TEST'
\echo '============================================'

SELECT 
  email,
  CASE 
    WHEN password_hash = crypt('Vhv@2026', password_hash) 
    THEN '✅ Password matches!'
    ELSE '❌ Password does not match!'
  END as password_test
FROM users
WHERE email = :'admin_email';

-- ============================================
-- FINAL STATUS
-- ============================================

\echo ''
\echo '============================================'
\echo '✅ VERIFICATION COMPLETED'
\echo '============================================'
\echo ''
\echo '📝 If all counts are correct:'
\echo '   - Applications: 1'
\echo '   - Tenant Applications: 1'
\echo '   - Tenant App Routes: 6'
\echo '   - Tenant Subscriptions: 1'
\echo '   - Total Permissions: 21'
\echo '   - Roles: 1'
\echo '   - Role Permissions: 21'
\echo '   - Users: 1'
\echo '   - Tenant Members: 1'
\echo '   - User Roles: 1'
\echo '   - Password Test: ✅'
\echo ''
\echo '🎉 Setup is complete and verified!'
\echo ''
