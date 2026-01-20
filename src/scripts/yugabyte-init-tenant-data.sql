/**
 * YugabyteDB Initialization Script
 * Initialize tenant data for: 078e19ae-af67-4452-9ccd-10e27acb2dfe
 * 
 * Features:
 * - Creates PLATFORM_ADMIN application
 * - Sets up tenant applications with domain saas.coquan.vn
 * - Creates unlimited subscription
 * - Creates permissions and Administrator role
 * - Creates admin user with hashed password
 * - Links all data together
 * 
 * Usage:
 * ysqlsh -h <host> -d <database> -f yugabyte-init-tenant-data.sql
 */

-- ============================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- CONFIGURATION VARIABLES
-- ============================================

DO $$
DECLARE
  -- Configuration
  v_tenant_id UUID := '078e19ae-af67-4452-9ccd-10e27acb2dfe';
  v_domain VARCHAR := 'saas.coquan.vn';
  v_admin_email VARCHAR := 'admin@saas.coquan.vn';
  v_admin_password VARCHAR := 'Vhv@2026';
  
  -- Generated IDs
  v_app_id UUID;
  v_tenant_app_id UUID;
  v_subscription_id UUID;
  v_role_id UUID;
  v_user_id UUID;
  v_password_hash TEXT;
  
BEGIN
  RAISE NOTICE '🚀 Starting YugabyteDB tenant initialization...';
  RAISE NOTICE '📋 Tenant ID: %', v_tenant_id;
  RAISE NOTICE '🌐 Domain: %', v_domain;
  RAISE NOTICE '';

  -- ============================================
  -- 1. CREATE APPLICATION: PLATFORM_ADMIN
  -- ============================================
  
  RAISE NOTICE '1️⃣  Creating PLATFORM_ADMIN application...';
  
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
    uuid_generate_v4(),
    'PLATFORM_ADMIN',
    'PLATFORM_ADMIN',
    'Platform Administration Application',
    'INTERNAL',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP
  RETURNING _id INTO v_app_id;
  
  RAISE NOTICE '   ✅ Application created with ID: %', v_app_id;

  -- ============================================
  -- 2. CREATE TENANT_APPLICATIONS
  -- ============================================
  
  RAISE NOTICE '2️⃣  Creating tenant application mapping...';
  
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
    uuid_generate_v4(),
    v_tenant_id,
    v_app_id,
    '/',
    v_domain,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (tenant_id, application_id) DO UPDATE SET
    path_prefix = EXCLUDED.path_prefix,
    domain = EXCLUDED.domain,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP
  RETURNING _id INTO v_tenant_app_id;
  
  RAISE NOTICE '   ✅ Tenant application created: % -> %', v_domain, v_app_id;

  -- ============================================
  -- 3. CREATE TENANT_APP_ROUTES
  -- ============================================
  
  RAISE NOTICE '3️⃣  Creating tenant app routes...';
  
  -- Admin Dashboard
  INSERT INTO tenant_app_routes (
    _id, tenant_id, application_id, route_path, route_name, 
    route_type, is_active, created_at, updated_at
  ) VALUES 
    (uuid_generate_v4(), v_tenant_id, v_app_id, '/admin', 'Admin Dashboard', 'PAGE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), v_tenant_id, v_app_id, '/admin/products', 'Products Management', 'PAGE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), v_tenant_id, v_app_id, '/admin/users', 'Users Management', 'PAGE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), v_tenant_id, v_app_id, '/admin/tenants', 'Tenants Management', 'PAGE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), v_tenant_id, v_app_id, '/admin/orders', 'Orders Management', 'PAGE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), v_tenant_id, v_app_id, '/admin/roles', 'Roles & Permissions', 'PAGE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (tenant_id, application_id, route_path) DO UPDATE SET
    route_name = EXCLUDED.route_name,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
  
  RAISE NOTICE '   ✅ Created 6 app routes';

  -- ============================================
  -- 4. CREATE TENANT_SUBSCRIPTIONS (Unlimited)
  -- ============================================
  
  RAISE NOTICE '4️⃣  Creating unlimited subscription...';
  
  INSERT INTO tenant_subscriptions (
    _id,
    tenant_id,
    plan_name,
    plan_type,
    status,
    start_date,
    end_date,
    is_unlimited,
    max_users,
    max_storage_gb,
    features,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    v_tenant_id,
    'UNLIMITED_PLAN',
    'ENTERPRISE',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    NULL,
    true,
    NULL, -- Unlimited users
    NULL, -- Unlimited storage
    '{"all_features": true, "priority_support": true, "custom_domain": true, "api_access": true}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    is_unlimited = EXCLUDED.is_unlimited,
    updated_at = CURRENT_TIMESTAMP
  RETURNING _id INTO v_subscription_id;
  
  RAISE NOTICE '   ✅ Subscription created: UNLIMITED_PLAN';

  -- ============================================
  -- 5. CREATE PERMISSIONS
  -- ============================================
  
  RAISE NOTICE '5️⃣  Creating permissions...';
  
  INSERT INTO permissions (
    _id, name, code, description, resource, action, created_at, updated_at
  ) VALUES 
    -- Users Management
    (uuid_generate_v4(), 'View Users', 'users.view', 'View users list and details', 'users', 'view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Create Users', 'users.create', 'Create new users', 'users', 'create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Edit Users', 'users.edit', 'Edit existing users', 'users', 'edit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Delete Users', 'users.delete', 'Delete users', 'users', 'delete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Tenants Management
    (uuid_generate_v4(), 'View Tenants', 'tenants.view', 'View tenants list and details', 'tenants', 'view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Create Tenants', 'tenants.create', 'Create new tenants', 'tenants', 'create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Edit Tenants', 'tenants.edit', 'Edit existing tenants', 'tenants', 'edit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Delete Tenants', 'tenants.delete', 'Delete tenants', 'tenants', 'delete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Products Management
    (uuid_generate_v4(), 'View Products', 'products.view', 'View products list and details', 'products', 'view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Create Products', 'products.create', 'Create new products', 'products', 'create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Edit Products', 'products.edit', 'Edit existing products', 'products', 'edit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Delete Products', 'products.delete', 'Delete products', 'products', 'delete', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Orders Management
    (uuid_generate_v4(), 'View Orders', 'orders.view', 'View orders list and details', 'orders', 'view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Create Orders', 'orders.create', 'Create new orders', 'orders', 'create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Edit Orders', 'orders.edit', 'Edit existing orders', 'orders', 'edit', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Cancel Orders', 'orders.cancel', 'Cancel orders', 'orders', 'cancel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Roles & Permissions
    (uuid_generate_v4(), 'View Roles', 'roles.view', 'View roles and permissions', 'roles', 'view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'Manage Roles', 'roles.manage', 'Create and edit roles', 'roles', 'manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- System Administration
    (uuid_generate_v4(), 'System Settings', 'system.settings', 'Manage system settings', 'system', 'settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4(), 'View Audit Logs', 'audit.view', 'View audit logs', 'audit', 'view', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- Super Admin (All Access)
    (uuid_generate_v4(), 'Admin Full Access', 'admin.all', 'Full administrative access to all resources', '*', '*', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
  
  RAISE NOTICE '   ✅ Created 21 permissions';

  -- ============================================
  -- 6. CREATE ROLE: Administrator
  -- ============================================
  
  RAISE NOTICE '6️⃣  Creating Administrator role...';
  
  INSERT INTO roles (
    _id,
    name,
    code,
    description,
    is_system,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    'Administrator',
    'ADMINISTRATOR',
    'Full system administrator with all permissions',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP
  RETURNING _id INTO v_role_id;
  
  RAISE NOTICE '   ✅ Administrator role created with ID: %', v_role_id;

  -- ============================================
  -- 7. ASSIGN ALL PERMISSIONS TO ADMINISTRATOR
  -- ============================================
  
  RAISE NOTICE '7️⃣  Assigning all permissions to Administrator role...';
  
  INSERT INTO role_permissions (
    _id,
    role_id,
    permission_id,
    created_at
  )
  SELECT 
    uuid_generate_v4(),
    v_role_id,
    p._id,
    CURRENT_TIMESTAMP
  FROM permissions p
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  
  GET DIAGNOSTICS v_app_id = ROW_COUNT;
  RAISE NOTICE '   ✅ Assigned % permissions to Administrator role', v_app_id;

  -- ============================================
  -- 8. CREATE ADMIN USER WITH HASHED PASSWORD
  -- ============================================
  
  RAISE NOTICE '8️⃣  Creating admin user...';
  
  -- Hash password using bcrypt (pgcrypto)
  v_password_hash := crypt(v_admin_password, gen_salt('bf', 10));
  
  -- Generate user ID
  v_user_id := uuid_generate_v4();
  
  INSERT INTO users (
    _id,
    email,
    password_hash,
    name,
    status,
    is_verified,
    email_verified_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_admin_email,
    v_password_hash,
    'Administrator',
    'ACTIVE',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    is_verified = EXCLUDED.is_verified,
    updated_at = CURRENT_TIMESTAMP
  RETURNING _id INTO v_user_id;
  
  RAISE NOTICE '   ✅ Admin user created: % (ID: %)', v_admin_email, v_user_id;
  RAISE NOTICE '   🔑 Password: %', v_admin_password;

  -- ============================================
  -- 9. CREATE TENANT_MEMBERS
  -- ============================================
  
  RAISE NOTICE '9️⃣  Adding admin to tenant members...';
  
  INSERT INTO tenant_members (
    _id,
    tenant_id,
    user_id,
    status,
    role,
    joined_at,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    v_tenant_id,
    v_user_id,
    'ACTIVE',
    'OWNER',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    status = EXCLUDED.status,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;
  
  RAISE NOTICE '   ✅ Admin added as tenant member (OWNER)';

  -- ============================================
  -- 10. ASSIGN ADMINISTRATOR ROLE TO USER
  -- ============================================
  
  RAISE NOTICE '🔟 Assigning Administrator role to user...';
  
  INSERT INTO user_roles (
    _id,
    user_id,
    role_id,
    tenant_id,
    assigned_at,
    assigned_by,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    v_user_id,
    v_role_id,
    v_tenant_id,
    CURRENT_TIMESTAMP,
    v_user_id, -- Self-assigned
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE SET
    assigned_at = EXCLUDED.assigned_at,
    updated_at = CURRENT_TIMESTAMP;
  
  RAISE NOTICE '   ✅ Administrator role assigned to user';

  -- ============================================
  -- VERIFICATION
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 VERIFICATION SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

END $$;

-- ============================================
-- DETAILED VERIFICATION QUERIES
-- ============================================

SELECT 
  '✅ Applications' as check_item,
  COUNT(*)::text as count,
  STRING_AGG(name, ', ') as details
FROM applications 
WHERE code = 'PLATFORM_ADMIN'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Tenant Applications',
  COUNT(*)::text,
  STRING_AGG(domain, ', ')
FROM tenant_applications 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Tenant App Routes',
  COUNT(*)::text,
  COUNT(*)::text || ' routes'
FROM tenant_app_routes 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Tenant Subscriptions',
  COUNT(*)::text,
  STRING_AGG(plan_name, ', ')
FROM tenant_subscriptions 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Permissions',
  COUNT(*)::text,
  COUNT(*)::text || ' permissions'
FROM permissions
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Roles',
  COUNT(*)::text,
  STRING_AGG(name, ', ')
FROM roles 
WHERE code = 'ADMINISTRATOR'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Role Permissions',
  COUNT(*)::text,
  COUNT(*)::text || ' assigned'
FROM role_permissions rp
JOIN roles r ON r._id = rp.role_id
WHERE r.code = 'ADMINISTRATOR'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Users',
  COUNT(*)::text,
  STRING_AGG(email, ', ')
FROM users 
WHERE email = 'admin@saas.coquan.vn'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ Tenant Members',
  COUNT(*)::text,
  COUNT(*)::text || ' members'
FROM tenant_members 
WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
GROUP BY check_item

UNION ALL

SELECT 
  '✅ User Roles',
  COUNT(*)::text,
  STRING_AGG(DISTINCT r.name, ', ')
FROM user_roles ur
JOIN roles r ON r._id = ur.role_id
WHERE ur.tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
GROUP BY check_item;

-- ============================================
-- FINAL SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🎉 INITIALIZATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Login Information:';
  RAISE NOTICE '   Email: admin@saas.coquan.vn';
  RAISE NOTICE '   Password: Vhv@2026';
  RAISE NOTICE '   Domain: saas.coquan.vn';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to use!';
  RAISE NOTICE '';
END $$;
