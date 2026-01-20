/**
 * Initialize Tenant Data Script
 * Creates all necessary data for tenant: 078e19ae-af67-4452-9ccd-10e27acb2dfe
 * 
 * Run with: node scripts/init-tenant-data.js
 */

-- ============================================
-- 1. CREATE APPLICATION: PLATFORM_ADMIN
-- ============================================

INSERT INTO applications (
  _id,
  name,
  code,
  description,
  type,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'PLATFORM_ADMIN',
  'PLATFORM_ADMIN',
  'Platform Administration Application',
  'INTERNAL',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING
RETURNING _id;

-- Store the application ID for later use
-- Let's assume it returns: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- ============================================
-- 2. CREATE TENANT_APPLICATIONS
-- ============================================

INSERT INTO tenant_applications (
  _id,
  tenant_id,
  application_id,
  path_prefix,
  domain,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  (SELECT _id FROM applications WHERE code = 'PLATFORM_ADMIN'),
  '/',
  'saas.coquan.vn',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================
-- 3. CREATE TENANT_APP_ROUTES
-- ============================================

INSERT INTO tenant_app_routes (
  _id,
  tenant_id,
  application_id,
  route_path,
  route_name,
  is_active,
  created_at,
  updated_at
) VALUES 
  -- Admin Dashboard
  (
    gen_random_uuid(),
    '078e19ae-af67-4452-9ccd-10e27acb2dfe',
    (SELECT _id FROM applications WHERE code = 'PLATFORM_ADMIN'),
    '/admin',
    'Admin Dashboard',
    true,
    NOW(),
    NOW()
  ),
  -- Products
  (
    gen_random_uuid(),
    '078e19ae-af67-4452-9ccd-10e27acb2dfe',
    (SELECT _id FROM applications WHERE code = 'PLATFORM_ADMIN'),
    '/admin/products',
    'Products Management',
    true,
    NOW(),
    NOW()
  ),
  -- Users
  (
    gen_random_uuid(),
    '078e19ae-af67-4452-9ccd-10e27acb2dfe',
    (SELECT _id FROM applications WHERE code = 'PLATFORM_ADMIN'),
    '/admin/users',
    'Users Management',
    true,
    NOW(),
    NOW()
  ),
  -- Tenants
  (
    gen_random_uuid(),
    '078e19ae-af67-4452-9ccd-10e27acb2dfe',
    (SELECT _id FROM applications WHERE code = 'PLATFORM_ADMIN'),
    '/admin/tenants',
    'Tenants Management',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CREATE TENANT_SUBSCRIPTIONS (Không thời hạn)
-- ============================================

INSERT INTO tenant_subscriptions (
  _id,
  tenant_id,
  plan_name,
  plan_type,
  status,
  start_date,
  end_date,
  is_unlimited,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  'UNLIMITED_PLAN',
  'ENTERPRISE',
  'ACTIVE',
  NOW(),
  NULL,
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================
-- 5. CREATE PERMISSIONS (Admin permissions)
-- ============================================

INSERT INTO permissions (
  _id,
  name,
  code,
  description,
  resource,
  action,
  created_at,
  updated_at
) VALUES 
  -- Users
  (gen_random_uuid(), 'View Users', 'users.view', 'View users list', 'users', 'view', NOW(), NOW()),
  (gen_random_uuid(), 'Create Users', 'users.create', 'Create new users', 'users', 'create', NOW(), NOW()),
  (gen_random_uuid(), 'Edit Users', 'users.edit', 'Edit existing users', 'users', 'edit', NOW(), NOW()),
  (gen_random_uuid(), 'Delete Users', 'users.delete', 'Delete users', 'users', 'delete', NOW(), NOW()),
  
  -- Tenants
  (gen_random_uuid(), 'View Tenants', 'tenants.view', 'View tenants list', 'tenants', 'view', NOW(), NOW()),
  (gen_random_uuid(), 'Create Tenants', 'tenants.create', 'Create new tenants', 'tenants', 'create', NOW(), NOW()),
  (gen_random_uuid(), 'Edit Tenants', 'tenants.edit', 'Edit existing tenants', 'tenants', 'edit', NOW(), NOW()),
  (gen_random_uuid(), 'Delete Tenants', 'tenants.delete', 'Delete tenants', 'tenants', 'delete', NOW(), NOW()),
  
  -- Products
  (gen_random_uuid(), 'View Products', 'products.view', 'View products list', 'products', 'view', NOW(), NOW()),
  (gen_random_uuid(), 'Create Products', 'products.create', 'Create new products', 'products', 'create', NOW(), NOW()),
  (gen_random_uuid(), 'Edit Products', 'products.edit', 'Edit existing products', 'products', 'edit', NOW(), NOW()),
  (gen_random_uuid(), 'Delete Products', 'products.delete', 'Delete products', 'products', 'delete', NOW(), NOW()),
  
  -- All Access
  (gen_random_uuid(), 'Admin Access', 'admin.all', 'Full admin access', '*', '*', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 6. CREATE ROLE: Administrator
-- ============================================

INSERT INTO roles (
  _id,
  name,
  code,
  description,
  is_system,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Administrator',
  'ADMINISTRATOR',
  'Full system administrator role',
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING
RETURNING _id;

-- ============================================
-- 7. ASSIGN ALL PERMISSIONS TO ADMINISTRATOR ROLE
-- ============================================

INSERT INTO role_permissions (
  _id,
  role_id,
  permission_id,
  created_at
)
SELECT 
  gen_random_uuid(),
  (SELECT _id FROM roles WHERE code = 'ADMINISTRATOR'),
  p._id,
  NOW()
FROM permissions p
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. CREATE USER: admin@saas.coquan.vn
-- ============================================

-- First, create in Supabase Auth (must be done via Supabase Dashboard or API)
-- Then insert into users table

INSERT INTO users (
  _id,
  email,
  name,
  status,
  is_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@saas.coquan.vn',
  'Administrator',
  'ACTIVE',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING
RETURNING _id;

-- ============================================
-- 9. CREATE TENANT_MEMBERS
-- ============================================

INSERT INTO tenant_members (
  _id,
  tenant_id,
  user_id,
  status,
  joined_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  (SELECT _id FROM users WHERE email = 'admin@saas.coquan.vn'),
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================
-- 10. CREATE USER_ROLES (Assign Administrator role)
-- ============================================

INSERT INTO user_roles (
  _id,
  user_id,
  role_id,
  tenant_id,
  assigned_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT _id FROM users WHERE email = 'admin@saas.coquan.vn'),
  (SELECT _id FROM roles WHERE code = 'ADMINISTRATOR'),
  '078e19ae-af67-4452-9ccd-10e27acb2dfe',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check created data
SELECT 'Applications:' as check_type, COUNT(*) as count FROM applications WHERE code = 'PLATFORM_ADMIN'
UNION ALL
SELECT 'Tenant Applications:', COUNT(*) FROM tenant_applications WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'Tenant App Routes:', COUNT(*) FROM tenant_app_routes WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'Tenant Subscriptions:', COUNT(*) FROM tenant_subscriptions WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'Permissions:', COUNT(*) FROM permissions
UNION ALL
SELECT 'Roles:', COUNT(*) FROM roles WHERE code = 'ADMINISTRATOR'
UNION ALL
SELECT 'Users:', COUNT(*) FROM users WHERE email = 'admin@saas.coquan.vn'
UNION ALL
SELECT 'Tenant Members:', COUNT(*) FROM tenant_members WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT 'User Roles:', COUNT(*) FROM user_roles WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Data initialization completed successfully!' as message;
