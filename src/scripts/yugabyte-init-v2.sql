/**
 * YugabyteDB Initialization Script v2
 * Initialize tenant data for: 078e19ae-af67-4452-9ccd-10e27acb2dfe
 * Based on new schema structure
 * 
 * Usage:
 * ysqlsh -h <host> -d <database> -f yugabyte-init-v2.sql
 */

-- ============================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- MAIN INITIALIZATION SCRIPT
-- ============================================

DO $$
DECLARE
  -- Configuration
  v_tenant_id UUID := '078e19ae-af67-4452-9ccd-10e27acb2dfe';
  v_domain VARCHAR := 'saas.coquan.vn';
  v_admin_email VARCHAR := 'admin@saas.coquan.vn';
  v_admin_password VARCHAR := 'Vhv@2026';
  
  -- Generated IDs
  v_app_code VARCHAR := 'PLATFORM_ADMIN';
  v_role_id UUID;
  v_user_id UUID;
  v_password_hash TEXT;
  v_member_id UUID;
  
  -- Counters
  v_count INT;
  
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 YugabyteDB Initialization v2';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'Domain: %', v_domain;
  RAISE NOTICE 'Admin Email: %', v_admin_email;
  RAISE NOTICE '============================================';
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
    gen_random_uuid(),
    v_app_code,
    'Platform Admin',
    'Platform Administration Application - Full tenant management system',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP,
    version = applications.version + 1;
  
  RAISE NOTICE '   ✅ Application created: %', v_app_code;

  -- ============================================
  -- 2. CREATE PERMISSIONS (Tree structure)
  -- ============================================
  
  RAISE NOTICE '2️⃣  Creating permissions tree...';
  
  -- Root permissions (groups)
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('admin', v_app_code, NULL, '/admin', true, 'Administration', 'Full admin access'),
    ('users', v_app_code, NULL, '/users', true, 'Users Management', 'User management group'),
    ('tenants', v_app_code, NULL, '/tenants', true, 'Tenants Management', 'Tenant management group'),
    ('products', v_app_code, NULL, '/products', true, 'Products Management', 'Product management group'),
    ('orders', v_app_code, NULL, '/orders', true, 'Orders Management', 'Order management group'),
    ('roles', v_app_code, NULL, '/roles', true, 'Roles & Permissions', 'Role management group')
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;
  
  -- User permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('users.view', v_app_code, 'users', '/users/view', false, 'View Users', 'View users list and details'),
    ('users.create', v_app_code, 'users', '/users/create', false, 'Create Users', 'Create new users'),
    ('users.edit', v_app_code, 'users', '/users/edit', false, 'Edit Users', 'Edit existing users'),
    ('users.delete', v_app_code, 'users', '/users/delete', false, 'Delete Users', 'Delete users'),
    ('users.export', v_app_code, 'users', '/users/export', false, 'Export Users', 'Export user data')
  ON CONFLICT (code) DO NOTHING;
  
  -- Tenant permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('tenants.view', v_app_code, 'tenants', '/tenants/view', false, 'View Tenants', 'View tenants list'),
    ('tenants.create', v_app_code, 'tenants', '/tenants/create', false, 'Create Tenants', 'Create new tenants'),
    ('tenants.edit', v_app_code, 'tenants', '/tenants/edit', false, 'Edit Tenants', 'Edit tenant details'),
    ('tenants.delete', v_app_code, 'tenants', '/tenants/delete', false, 'Delete Tenants', 'Delete tenants'),
    ('tenants.settings', v_app_code, 'tenants', '/tenants/settings', false, 'Tenant Settings', 'Manage tenant settings')
  ON CONFLICT (code) DO NOTHING;
  
  -- Product permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('products.view', v_app_code, 'products', '/products/view', false, 'View Products', 'View products list'),
    ('products.create', v_app_code, 'products', '/products/create', false, 'Create Products', 'Create new products'),
    ('products.edit', v_app_code, 'products', '/products/edit', false, 'Edit Products', 'Edit products'),
    ('products.delete', v_app_code, 'products', '/products/delete', false, 'Delete Products', 'Delete products'),
    ('products.pricing', v_app_code, 'products', '/products/pricing', false, 'Manage Pricing', 'Manage product pricing')
  ON CONFLICT (code) DO NOTHING;
  
  -- Order permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('orders.view', v_app_code, 'orders', '/orders/view', false, 'View Orders', 'View orders list'),
    ('orders.create', v_app_code, 'orders', '/orders/create', false, 'Create Orders', 'Create new orders'),
    ('orders.edit', v_app_code, 'orders', '/orders/edit', false, 'Edit Orders', 'Edit order details'),
    ('orders.cancel', v_app_code, 'orders', '/orders/cancel', false, 'Cancel Orders', 'Cancel orders'),
    ('orders.refund', v_app_code, 'orders', '/orders/refund', false, 'Refund Orders', 'Process refunds')
  ON CONFLICT (code) DO NOTHING;
  
  -- Role permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('roles.view', v_app_code, 'roles', '/roles/view', false, 'View Roles', 'View roles and permissions'),
    ('roles.create', v_app_code, 'roles', '/roles/create', false, 'Create Roles', 'Create new roles'),
    ('roles.edit', v_app_code, 'roles', '/roles/edit', false, 'Edit Roles', 'Edit role permissions'),
    ('roles.delete', v_app_code, 'roles', '/roles/delete', false, 'Delete Roles', 'Delete custom roles'),
    ('roles.assign', v_app_code, 'roles', '/roles/assign', false, 'Assign Roles', 'Assign roles to users')
  ON CONFLICT (code) DO NOTHING;
  
  -- Admin super permissions
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('admin.all', v_app_code, 'admin', '/admin/all', false, 'Full Admin Access', 'Complete system access'),
    ('admin.settings', v_app_code, 'admin', '/admin/settings', false, 'System Settings', 'Manage system settings'),
    ('admin.audit', v_app_code, 'admin', '/admin/audit', false, 'Audit Logs', 'View audit logs')
  ON CONFLICT (code) DO NOTHING;
  
  SELECT COUNT(*) INTO v_count FROM permissions WHERE app_code = v_app_code;
  RAISE NOTICE '   ✅ Created % permissions', v_count;

  -- ============================================
  -- 3. CREATE ADMINISTRATOR ROLE
  -- ============================================
  
  RAISE NOTICE '3️⃣  Creating Administrator role...';
  
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
  )
  SELECT 
    gen_random_uuid(),
    v_tenant_id,
    'Administrator',
    'Full system administrator with all permissions',
    'SYSTEM',
    array_agg(p.code),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  FROM permissions p
  WHERE p.app_code = v_app_code
  ON CONFLICT DO NOTHING
  RETURNING _id INTO v_role_id;
  
  -- If role already exists, get its ID
  IF v_role_id IS NULL THEN
    SELECT _id INTO v_role_id 
    FROM roles 
    WHERE tenant_id = v_tenant_id 
      AND name = 'Administrator' 
      AND type = 'SYSTEM';
    
    -- Update permission codes
    UPDATE roles
    SET permission_codes = (
      SELECT array_agg(p.code)
      FROM permissions p
      WHERE p.app_code = v_app_code
    ),
    updated_at = CURRENT_TIMESTAMP,
    version = version + 1
    WHERE _id = v_role_id;
  END IF;
  
  RAISE NOTICE '   ✅ Administrator role: %', v_role_id;

  -- ============================================
  -- 4. CREATE TENANT_APPLICATIONS
  -- ============================================
  
  RAISE NOTICE '4️⃣  Creating tenant application...';
  
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
    gen_random_uuid(),
    v_tenant_id,
    v_app_code,
    true,
    CURRENT_TIMESTAMP,
    'ENTERPRISE',
    NULL, -- Unlimited users
    NULL, -- No expiration
    '{"features": ["all"], "custom_domain": true, "api_access": true}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (tenant_id, app_code) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    license_type = EXCLUDED.license_type,
    max_users = EXCLUDED.max_users,
    expires_at = EXCLUDED.expires_at,
    settings = EXCLUDED.settings,
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_applications.version + 1;
  
  RAISE NOTICE '   ✅ Tenant application activated';

  -- ============================================
  -- 5. CREATE TENANT_APP_ROUTES
  -- ============================================
  
  RAISE NOTICE '5️⃣  Creating tenant app routes...';
  
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
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_app_code,
    v_domain,
    '/',
    true,
    true,
    'ACTIVE',
    'ACTIVE',
    'SPECIFIC_DOMAIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (domain, path_prefix) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_app_routes.version + 1;
  
  RAISE NOTICE '   ✅ Route created: % -> %', v_domain, v_app_code;

  -- ============================================
  -- 6. CREATE TENANT_SUBSCRIPTIONS
  -- ============================================
  
  RAISE NOTICE '6️⃣  Creating unlimited subscription...';
  
  INSERT INTO tenant_subscriptions (
    _id,
    tenant_id,
    subscription_number,
    subscription_name,
    start_date,
    end_date,
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
    gen_random_uuid(),
    v_tenant_id,
    'SUB-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || SUBSTRING(v_tenant_id::text, 1, 8),
    'Unlimited Enterprise Plan',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '100 years', -- Virtually unlimited
    'active',
    true,
    false,
    'UNLIMITED_ENTERPRISE',
    'yearly',
    0, -- Free for platform admin
    0,
    0,
    0,
    'VND',
    999999, -- Virtually unlimited
    1, -- Current admin user
    999999, -- Unlimited storage
    0,
    '["all_features", "unlimited_users", "unlimited_storage", "priority_support", "custom_domain", "api_access", "white_label"]'::jsonb,
    '{"api_calls_per_month": null, "concurrent_sessions": null}'::jsonb,
    'paid',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (subscription_number) DO UPDATE SET
    status = EXCLUDED.status,
    current_users = EXCLUDED.current_users,
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_subscriptions.version + 1;
  
  RAISE NOTICE '   ✅ Unlimited subscription created';

  -- ============================================
  -- 7. CREATE ADMIN USER
  -- ============================================
  
  RAISE NOTICE '7️⃣  Creating admin user...';
  
  v_password_hash := crypt(v_admin_password, gen_salt('bf', 10));
  v_user_id := gen_random_uuid();
  
  INSERT INTO users (
    _id,
    email,
    password_hash,
    full_name,
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
    'System Administrator',
    'ACTIVE',
    true,
    false,
    true,
    'vi-VN',
    '{"role": "platform_admin", "created_by": "system"}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status,
    is_verified = EXCLUDED.is_verified,
    updated_at = CURRENT_TIMESTAMP
  RETURNING _id INTO v_user_id;
  
  RAISE NOTICE '   ✅ Admin user created: %', v_user_id;
  RAISE NOTICE '   📧 Email: %', v_admin_email;
  RAISE NOTICE '   🔑 Password: %', v_admin_password;

  -- ============================================
  -- 8. CREATE TENANT_MEMBERS
  -- ============================================
  
  RAISE NOTICE '8️⃣  Adding admin to tenant...';
  
  INSERT INTO tenant_members (
    _id,
    tenant_id,
    user_id,
    employee_code,
    internal_email,
    job_title,
    role,
    status,
    joined_at,
    permissions,
    metadata,
    created_at,
    updated_at,
    version
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_user_id,
    'ADMIN001',
    v_admin_email,
    'System Administrator',
    'OWNER',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    '["admin.all"]'::jsonb,
    '{"is_founder": true, "access_level": "full"}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
  )
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP,
    version = tenant_members.version + 1
  RETURNING _id INTO v_member_id;
  
  RAISE NOTICE '   ✅ Tenant member created: %', v_member_id;

  -- ============================================
  -- 9. ASSIGN ADMINISTRATOR ROLE
  -- ============================================
  
  RAISE NOTICE '9️⃣  Assigning Administrator role...';
  
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
    gen_random_uuid(),
    v_user_id,
    v_role_id,
    v_tenant_id,
    'tenant',
    v_tenant_id,
    v_user_id, -- Self-granted
    CURRENT_TIMESTAMP,
    NULL, -- Never expires
    true,
    '{"granted_reason": "system_initialization"}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id, role_id, scope, scope_id) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;
  
  RAISE NOTICE '   ✅ Administrator role assigned';

  -- ============================================
  -- VERIFICATION
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 VERIFICATION';
  RAISE NOTICE '============================================';
  
  SELECT COUNT(*) INTO v_count FROM applications WHERE code = v_app_code;
  RAISE NOTICE 'Applications: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM permissions WHERE app_code = v_app_code;
  RAISE NOTICE 'Permissions: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM roles WHERE tenant_id = v_tenant_id;
  RAISE NOTICE 'Roles: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM tenant_applications WHERE tenant_id = v_tenant_id;
  RAISE NOTICE 'Tenant Applications: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM tenant_app_routes WHERE tenant_id = v_tenant_id;
  RAISE NOTICE 'Tenant Routes: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM tenant_subscriptions WHERE tenant_id = v_tenant_id;
  RAISE NOTICE 'Subscriptions: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM users WHERE email = v_admin_email;
  RAISE NOTICE 'Users: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM tenant_members WHERE tenant_id = v_tenant_id;
  RAISE NOTICE 'Tenant Members: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM user_roles WHERE tenant_id = v_tenant_id;
  RAISE NOTICE 'User Roles: %', v_count;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Success message
  RAISE NOTICE '🎉 INITIALIZATION COMPLETED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Login Information:';
  RAISE NOTICE '   Email: %', v_admin_email;
  RAISE NOTICE '   Password: %', v_admin_password;
  RAISE NOTICE '   Domain: %', v_domain;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to use!';
  
END $$;
