/**
 * YugabyteDB Initialization Script V2
 * Based on new schema structure
 * Tenant: 078e19ae-af67-4452-9ccd-10e27acb2dfe
 * 
 * Usage: ysqlsh -h <host> -d <database> -f init-data-v2-yugabyte.sql
 */

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- MAIN INITIALIZATION
-- ============================================

DO $$
DECLARE
  -- Configuration
  v_tenant_id UUID := '078e19ae-af67-4452-9ccd-10e27acb2dfe';
  v_domain VARCHAR := 'saas.coquan.vn';
  v_admin_email VARCHAR := 'admin@saas.coquan.vn';
  v_admin_password VARCHAR := 'Vhv@2026';
  v_admin_name VARCHAR := 'Administrator';
  
  -- Generated IDs
  v_app_code VARCHAR := 'PLATFORM_ADMIN';
  v_role_id UUID;
  v_user_id UUID;
  v_tenant_member_id UUID;
  v_subscription_id UUID;
  v_password_hash TEXT;
  
  -- Permission codes array
  v_permission_codes TEXT[];
  
BEGIN
  RAISE NOTICE '🚀 Starting initialization for tenant: %', v_tenant_id;
  RAISE NOTICE '';

  -- ============================================
  -- 1. CREATE APPLICATION
  -- ============================================
  
  RAISE NOTICE '1️⃣  Creating PLATFORM_ADMIN application...';
  
  INSERT INTO applications (
    _id,
    code,
    name,
    description,
    is_active,
    created_at,
    updated_at,
    version
  ) VALUES (
    uuid_generate_v4(),
    v_app_code,
    'Platform Administration',
    'Core platform administration application for managing tenants, users, and system resources',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true,
    updated_at = CURRENT_TIMESTAMP,
    version = applications.version + 1;
  
  RAISE NOTICE '   ✅ Application created: %', v_app_code;

  -- ============================================
  -- 2. CREATE PERMISSIONS (Hierarchical)
  -- ============================================
  
  RAISE NOTICE '2️⃣  Creating permissions hierarchy...';
  
  -- Root permission groups
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description, version) VALUES
    ('admin', v_app_code, NULL, 'admin', true, 'Administration', 'Root administrative permissions', 1),
    ('users', v_app_code, 'admin', 'admin.users', true, 'Users Management', 'User administration permissions', 1),
    ('tenants', v_app_code, 'admin', 'admin.tenants', true, 'Tenants Management', 'Tenant administration permissions', 1),
    ('products', v_app_code, 'admin', 'admin.products', true, 'Products Management', 'Product administration permissions', 1),
    ('orders', v_app_code, 'admin', 'admin.orders', true, 'Orders Management', 'Order administration permissions', 1),
    ('roles', v_app_code, 'admin', 'admin.roles', true, 'Roles & Permissions', 'Role and permission management', 1)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
  
  -- Users permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description, version) VALUES
    ('users.view', v_app_code, 'users', 'admin.users.view', false, 'View Users', 'View user list and details', 1),
    ('users.create', v_app_code, 'users', 'admin.users.create', false, 'Create Users', 'Create new users', 1),
    ('users.edit', v_app_code, 'users', 'admin.users.edit', false, 'Edit Users', 'Edit existing users', 1),
    ('users.delete', v_app_code, 'users', 'admin.users.delete', false, 'Delete Users', 'Delete users', 1)
  ON CONFLICT (code) DO NOTHING;
  
  -- Tenants permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description, version) VALUES
    ('tenants.view', v_app_code, 'tenants', 'admin.tenants.view', false, 'View Tenants', 'View tenant list and details', 1),
    ('tenants.create', v_app_code, 'tenants', 'admin.tenants.create', false, 'Create Tenants', 'Create new tenants', 1),
    ('tenants.edit', v_app_code, 'tenants', 'admin.tenants.edit', false, 'Edit Tenants', 'Edit existing tenants', 1),
    ('tenants.delete', v_app_code, 'tenants', 'admin.tenants.delete', false, 'Delete Tenants', 'Delete tenants', 1)
  ON CONFLICT (code) DO NOTHING;
  
  -- Products permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description, version) VALUES
    ('products.view', v_app_code, 'products', 'admin.products.view', false, 'View Products', 'View product list and details', 1),
    ('products.create', v_app_code, 'products', 'admin.products.create', false, 'Create Products', 'Create new products', 1),
    ('products.edit', v_app_code, 'products', 'admin.products.edit', false, 'Edit Products', 'Edit existing products', 1),
    ('products.delete', v_app_code, 'products', 'admin.products.delete', false, 'Delete Products', 'Delete products', 1)
  ON CONFLICT (code) DO NOTHING;
  
  -- Orders permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description, version) VALUES
    ('orders.view', v_app_code, 'orders', 'admin.orders.view', false, 'View Orders', 'View order list and details', 1),
    ('orders.create', v_app_code, 'orders', 'admin.orders.create', false, 'Create Orders', 'Create new orders', 1),
    ('orders.edit', v_app_code, 'orders', 'admin.orders.edit', false, 'Edit Orders', 'Edit existing orders', 1),
    ('orders.cancel', v_app_code, 'orders', 'admin.orders.cancel', false, 'Cancel Orders', 'Cancel orders', 1)
  ON CONFLICT (code) DO NOTHING;
  
  -- Roles permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description, version) VALUES
    ('roles.view', v_app_code, 'roles', 'admin.roles.view', false, 'View Roles', 'View roles and permissions', 1),
    ('roles.manage', v_app_code, 'roles', 'admin.roles.manage', false, 'Manage Roles', 'Create and edit roles', 1)
  ON CONFLICT (code) DO NOTHING;
  
  -- Super admin permission
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description, version) VALUES
    ('admin.all', v_app_code, 'admin', 'admin.all', false, 'Full Admin Access', 'Complete administrative access', 1)
  ON CONFLICT (code) DO NOTHING;
  
  RAISE NOTICE '   ✅ Created hierarchical permissions';

  -- ============================================
  -- 3. CREATE TENANT_APPLICATIONS
  -- ============================================
  
  RAISE NOTICE '3️⃣  Activating application for tenant...';
  
  INSERT INTO tenant_applications (
    _id,
    tenant_id,
    app_code,
    is_active,
    activated_at,
    license_type,
    max_users,
    expires_at,
    settings,
    created_at,
    updated_at,
    version
  ) VALUES (
    uuid_generate_v4(),
    v_tenant_id,
    v_app_code,
    true,
    CURRENT_TIMESTAMP,
    'ENTERPRISE',
    NULL, -- Unlimited users
    NULL, -- Never expires
    '{"features": ["all"], "limits": {"storage": "unlimited", "api_calls": "unlimited"}}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (tenant_id, app_code) DO UPDATE SET
    is_active = true,
    activated_at = CURRENT_TIMESTAMP,
    license_type = 'ENTERPRISE',
    max_users = NULL,
    expires_at = NULL,
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_applications.version + 1;
  
  RAISE NOTICE '   ✅ Application activated for tenant';

  -- ============================================
  -- 4. CREATE TENANT_APP_ROUTES
  -- ============================================
  
  RAISE NOTICE '4️⃣  Setting up tenant routes...';
  
  -- Primary domain route
  INSERT INTO tenant_app_routes (
    _id,
    tenant_id,
    app_code,
    domain,
    path_prefix,
    is_primary,
    is_custom_domain,
    ssl_status,
    status,
    route_scope,
    created_at,
    updated_at,
    version
  ) VALUES 
    (uuid_generate_v4(), v_tenant_id, v_app_code, v_domain, '/', true, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    (uuid_generate_v4(), v_tenant_id, v_app_code, v_domain, '/admin', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    (uuid_generate_v4(), v_tenant_id, v_app_code, v_domain, '/admin/users', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    (uuid_generate_v4(), v_tenant_id, v_app_code, v_domain, '/admin/tenants', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    (uuid_generate_v4(), v_tenant_id, v_app_code, v_domain, '/admin/products', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1),
    (uuid_generate_v4(), v_tenant_id, v_app_code, v_domain, '/admin/orders', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
  ON CONFLICT (domain, path_prefix) DO UPDATE SET
    status = 'ACTIVE',
    is_primary = EXCLUDED.is_primary,
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_app_routes.version + 1;
  
  RAISE NOTICE '   ✅ Created 6 routes for domain: %', v_domain;

  -- ============================================
  -- 5. CREATE TENANT_SUBSCRIPTION
  -- ============================================
  
  RAISE NOTICE '5️⃣  Creating unlimited subscription...';
  
  INSERT INTO tenant_subscriptions (
    _id,
    tenant_id,
    subscription_number,
    subscription_name,
    start_date,
    end_date,
    trial_end_date,
    status,
    auto_renew,
    is_trial,
    plan_name,
    billing_cycle,
    base_price,
    discount_amount,
    tax_amount,
    total_amount,
    currency,
    max_users,
    current_users,
    max_storage_gb,
    current_storage_gb,
    features,
    limits,
    payment_status,
    created_at,
    updated_at,
    version
  ) VALUES (
    uuid_generate_v4(),
    v_tenant_id,
    'SUB-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || substring(v_tenant_id::text, 1, 8),
    'Enterprise Unlimited Plan',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '100 years', -- Effectively unlimited
    NULL,
    'active',
    false, -- No auto-renew needed for unlimited
    false,
    'ENTERPRISE_UNLIMITED',
    'yearly',
    0, -- Free for this tenant
    0,
    0,
    0,
    'USD',
    999999, -- Effectively unlimited
    1, -- Current admin user
    999999, -- Effectively unlimited GB
    0,
    '["all_features", "priority_support", "custom_domain", "api_access", "white_label", "advanced_analytics"]'::jsonb,
    '{"api_rate_limit": "unlimited", "storage": "unlimited", "users": "unlimited"}'::jsonb,
    'paid',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (subscription_number) DO UPDATE SET
    status = 'active',
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_subscriptions.version + 1;
  
  GET DIAGNOSTICS v_subscription_id = NULL;
  RAISE NOTICE '   ✅ Unlimited subscription created';

  -- ============================================
  -- 6. COLLECT ALL PERMISSION CODES FOR ADMIN ROLE
  -- ============================================
  
  RAISE NOTICE '6️⃣  Collecting permission codes...';
  
  SELECT ARRAY_AGG(code) INTO v_permission_codes
  FROM permissions
  WHERE app_code = v_app_code
    AND deleted_at IS NULL;
  
  RAISE NOTICE '   ✅ Collected % permission codes', ARRAY_LENGTH(v_permission_codes, 1);

  -- ============================================
  -- 7. CREATE ADMINISTRATOR ROLE
  -- ============================================
  
  RAISE NOTICE '7️⃣  Creating Administrator role...';
  
  INSERT INTO roles (
    _id,
    tenant_id,
    name,
    description,
    type,
    permission_codes,
    created_at,
    updated_at,
    version
  ) VALUES (
    uuid_generate_v4(),
    v_tenant_id,
    'Administrator',
    'Full system administrator with all permissions',
    'SYSTEM',
    v_permission_codes,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  RETURNING _id INTO v_role_id;
  
  RAISE NOTICE '   ✅ Administrator role created with ID: %', v_role_id;
  RAISE NOTICE '   ✅ Assigned % permissions to role', ARRAY_LENGTH(v_permission_codes, 1);

  -- ============================================
  -- 8. CREATE ADMIN USER
  -- ============================================
  
  RAISE NOTICE '8️⃣  Creating admin user...';
  
  -- Hash password
  v_password_hash := crypt(v_admin_password, gen_salt('bf', 10));
  v_user_id := uuid_generate_v4();
  
  INSERT INTO users (
    _id,
    email,
    password_hash,
    full_name,
    phone_number,
    status,
    is_support_staff,
    mfa_enabled,
    is_verified,
    locale,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_admin_email,
    v_password_hash,
    v_admin_name,
    NULL,
    'ACTIVE',
    true, -- Support staff access
    false,
    true,
    'vi-VN',
    '{"role": "system_admin", "created_by": "init_script"}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    status = 'ACTIVE',
    is_verified = true,
    updated_at = CURRENT_TIMESTAMP
  RETURNING _id INTO v_user_id;
  
  RAISE NOTICE '   ✅ Admin user created: % (ID: %)', v_admin_email, v_user_id;

  -- ============================================
  -- 9. CREATE TENANT_MEMBER
  -- ============================================
  
  RAISE NOTICE '9️⃣  Adding user as tenant member...';
  
  INSERT INTO tenant_members (
    _id,
    tenant_id,
    user_id,
    employee_code,
    internal_email,
    job_title,
    manager_id,
    role,
    status,
    joined_at,
    permissions,
    metadata,
    created_at,
    updated_at,
    version
  ) VALUES (
    uuid_generate_v4(),
    v_tenant_id,
    v_user_id,
    'ADMIN001',
    v_admin_email,
    'System Administrator',
    NULL,
    'OWNER',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    '[]'::jsonb, -- No extra permissions needed (role has all)
    '{"is_founder": true, "created_by_script": true}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    role = 'OWNER',
    status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_members.version + 1
  RETURNING _id INTO v_tenant_member_id;
  
  RAISE NOTICE '   ✅ Tenant member created (OWNER)';

  -- ============================================
  -- 10. ASSIGN ROLE TO USER
  -- ============================================
  
  RAISE NOTICE '🔟 Assigning Administrator role to user...';
  
  INSERT INTO user_roles (
    _id,
    user_id,
    role_id,
    tenant_id,
    scope,
    scope_id,
    granted_by,
    granted_at,
    expires_at,
    is_active,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    v_user_id,
    v_role_id,
    v_tenant_id,
    'tenant',
    v_tenant_id,
    v_user_id, -- Self-granted
    CURRENT_TIMESTAMP,
    NULL, -- Never expires
    true,
    '{"granted_by": "init_script", "reason": "initial_setup"}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id, role_id, scope, scope_id) DO UPDATE SET
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;
  
  RAISE NOTICE '   ✅ Administrator role assigned';
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ INITIALIZATION COMPLETED!';
  RAISE NOTICE '============================================';
  
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

\echo ''
\echo '============================================'
\echo '📊 VERIFICATION SUMMARY'
\echo '============================================'
\echo ''

SELECT 
  '✅ Applications' as item,
  COUNT(*)::text as count
FROM applications WHERE code = 'PLATFORM_ADMIN'
UNION ALL
SELECT '✅ Permissions', COUNT(*)::text FROM permissions WHERE app_code = 'PLATFORM_ADMIN'
UNION ALL
SELECT '✅ Tenant Applications', COUNT(*)::text FROM tenant_applications WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT '✅ Tenant Routes', COUNT(*)::text FROM tenant_app_routes WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT '✅ Subscriptions', COUNT(*)::text FROM tenant_subscriptions WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT '✅ Roles', COUNT(*)::text FROM roles WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT '✅ Users', COUNT(*)::text FROM users WHERE email = 'admin@saas.coquan.vn'
UNION ALL
SELECT '✅ Tenant Members', COUNT(*)::text FROM tenant_members WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL
SELECT '✅ User Roles', COUNT(*)::text FROM user_roles WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';

\echo ''
\echo '============================================'
\echo '🔐 LOGIN INFORMATION'
\echo '============================================'
\echo 'Email: admin@saas.coquan.vn'
\echo 'Password: Vhv@2026'
\echo 'Domain: saas.coquan.vn'
\echo ''
\echo '🎉 Ready to use!'
\echo '============================================'
