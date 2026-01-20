/**
 * Supabase Initialization Script V2
 * Based on new schema structure
 * Tenant: 078e19ae-af67-4452-9ccd-10e27acb2dfe
 * 
 * Run this in Supabase SQL Editor
 * NOTE: Create user first via Supabase Auth Dashboard, then run this script
 */

-- ============================================
-- CONFIGURATION
-- Replace USER_ID_FROM_AUTH with actual user ID from Supabase Auth
-- ============================================

DO $$
DECLARE
  -- !!! IMPORTANT: Update this with actual user ID from Supabase Auth !!!
  v_user_id_from_auth UUID := NULL; -- Will prompt to set this
  
  -- Configuration
  v_tenant_id UUID := '078e19ae-af67-4452-9ccd-10e27acb2dfe';
  v_domain VARCHAR := 'saas.coquan.vn';
  v_admin_email VARCHAR := 'admin@saas.coquan.vn';
  v_admin_name VARCHAR := 'Administrator';
  
  -- Generated IDs
  v_app_code VARCHAR := 'PLATFORM_ADMIN';
  v_role_id UUID;
  v_user_id UUID;
  v_permission_codes TEXT[];
  
BEGIN
  RAISE NOTICE '🚀 Starting Supabase initialization...';
  RAISE NOTICE '';
  
  -- Check if user_id is provided
  IF v_user_id_from_auth IS NULL THEN
    RAISE EXCEPTION E'\n\n❌ ERROR: Please set v_user_id_from_auth!\n\nSteps:\n1. Create user in Supabase Auth Dashboard\n   Email: admin@saas.coquan.vn\n   Password: Vhv@2026\n2. Copy the user ID (UUID)\n3. Paste it into v_user_id_from_auth variable at the top of this script\n4. Run the script again\n';
  END IF;
  
  v_user_id := v_user_id_from_auth;
  RAISE NOTICE '👤 Using user ID: %', v_user_id;
  RAISE NOTICE '';

  -- ============================================
  -- 1. CREATE APPLICATION
  -- ============================================
  
  RAISE NOTICE '1️⃣  Creating application...';
  
  INSERT INTO applications (code, name, description, is_active, version) VALUES
    (v_app_code, 'Platform Administration', 'Core platform administration application', true, 1)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = true,
    updated_at = now(),
    version = applications.version + 1;
  
  RAISE NOTICE '   ✅ Application: %', v_app_code;

  -- ============================================
  -- 2. CREATE PERMISSIONS
  -- ============================================
  
  RAISE NOTICE '2️⃣  Creating permissions...';
  
  INSERT INTO permissions (code, app_code, parent_code, path, is_group, name, description) VALUES
    ('admin', v_app_code, NULL, 'admin', true, 'Administration', 'Root permissions'),
    ('users', v_app_code, 'admin', 'admin.users', true, 'Users Management', 'User permissions'),
    ('tenants', v_app_code, 'admin', 'admin.tenants', true, 'Tenants Management', 'Tenant permissions'),
    ('products', v_app_code, 'admin', 'admin.products', true, 'Products Management', 'Product permissions'),
    ('orders', v_app_code, 'admin', 'admin.orders', true, 'Orders Management', 'Order permissions'),
    ('roles', v_app_code, 'admin', 'admin.roles', true, 'Roles & Permissions', 'Role permissions'),
    ('users.view', v_app_code, 'users', 'admin.users.view', false, 'View Users', 'View users'),
    ('users.create', v_app_code, 'users', 'admin.users.create', false, 'Create Users', 'Create users'),
    ('users.edit', v_app_code, 'users', 'admin.users.edit', false, 'Edit Users', 'Edit users'),
    ('users.delete', v_app_code, 'users', 'admin.users.delete', false, 'Delete Users', 'Delete users'),
    ('tenants.view', v_app_code, 'tenants', 'admin.tenants.view', false, 'View Tenants', 'View tenants'),
    ('tenants.create', v_app_code, 'tenants', 'admin.tenants.create', false, 'Create Tenants', 'Create tenants'),
    ('tenants.edit', v_app_code, 'tenants', 'admin.tenants.edit', false, 'Edit Tenants', 'Edit tenants'),
    ('tenants.delete', v_app_code, 'tenants', 'admin.tenants.delete', false, 'Delete Tenants', 'Delete tenants'),
    ('products.view', v_app_code, 'products', 'admin.products.view', false, 'View Products', 'View products'),
    ('products.create', v_app_code, 'products', 'admin.products.create', false, 'Create Products', 'Create products'),
    ('products.edit', v_app_code, 'products', 'admin.products.edit', false, 'Edit Products', 'Edit products'),
    ('products.delete', v_app_code, 'products', 'admin.products.delete', false, 'Delete Products', 'Delete products'),
    ('orders.view', v_app_code, 'orders', 'admin.orders.view', false, 'View Orders', 'View orders'),
    ('orders.create', v_app_code, 'orders', 'admin.orders.create', false, 'Create Orders', 'Create orders'),
    ('orders.edit', v_app_code, 'orders', 'admin.orders.edit', false, 'Edit Orders', 'Edit orders'),
    ('orders.cancel', v_app_code, 'orders', 'admin.orders.cancel', false, 'Cancel Orders', 'Cancel orders'),
    ('roles.view', v_app_code, 'roles', 'admin.roles.view', false, 'View Roles', 'View roles'),
    ('roles.manage', v_app_code, 'roles', 'admin.roles.manage', false, 'Manage Roles', 'Manage roles'),
    ('admin.all', v_app_code, 'admin', 'admin.all', false, 'Full Access', 'Complete access')
  ON CONFLICT (code) DO NOTHING;
  
  RAISE NOTICE '   ✅ Created permissions';

  -- ============================================
  -- 3. TENANT APPLICATION
  -- ============================================
  
  RAISE NOTICE '3️⃣  Activating tenant application...';
  
  INSERT INTO tenant_applications (tenant_id, app_code, is_active, activated_at, license_type, max_users, settings) VALUES
    (v_tenant_id, v_app_code, true, now(), 'ENTERPRISE', NULL, '{"features": ["all"]}'::jsonb)
  ON CONFLICT (tenant_id, app_code) DO UPDATE SET
    is_active = true,
    activated_at = now(),
    license_type = 'ENTERPRISE',
    updated_at = now();
  
  RAISE NOTICE '   ✅ Application activated';

  -- ============================================
  -- 4. TENANT ROUTES
  -- ============================================
  
  RAISE NOTICE '4️⃣  Creating routes...';
  
  INSERT INTO tenant_app_routes (_id, tenant_id, app_code, domain, path_prefix, is_primary, is_custom_domain, ssl_status, status, route_scope) VALUES
    (gen_random_uuid(), v_tenant_id, v_app_code, v_domain, '/', true, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN'),
    (gen_random_uuid(), v_tenant_id, v_app_code, v_domain, '/admin', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN'),
    (gen_random_uuid(), v_tenant_id, v_app_code, v_domain, '/admin/users', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN'),
    (gen_random_uuid(), v_tenant_id, v_app_code, v_domain, '/admin/tenants', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN'),
    (gen_random_uuid(), v_tenant_id, v_app_code, v_domain, '/admin/products', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN'),
    (gen_random_uuid(), v_tenant_id, v_app_code, v_domain, '/admin/orders', false, true, 'ACTIVE', 'ACTIVE', 'SPECIFIC_DOMAIN')
  ON CONFLICT (domain, path_prefix) DO UPDATE SET
    status = 'ACTIVE',
    updated_at = now();
  
  RAISE NOTICE '   ✅ Created 6 routes';

  -- ============================================
  -- 5. SUBSCRIPTION
  -- ============================================
  
  RAISE NOTICE '5️⃣  Creating subscription...';
  
  INSERT INTO tenant_subscriptions (
    tenant_id, subscription_number, subscription_name, start_date, end_date,
    status, auto_renew, is_trial, plan_name, billing_cycle,
    base_price, total_amount, currency, max_users, current_users,
    max_storage_gb, current_storage_gb, features, limits, payment_status
  ) VALUES (
    v_tenant_id,
    'SUB-' || to_char(now(), 'YYYYMMDD') || '-' || substring(v_tenant_id::text, 1, 8),
    'Enterprise Unlimited',
    current_date,
    current_date + interval '100 years',
    'active',
    false,
    false,
    'ENTERPRISE_UNLIMITED',
    'yearly',
    0, 0, 'USD',
    999999, 1,
    999999, 0,
    '["all_features", "priority_support", "api_access"]'::jsonb,
    '{"storage": "unlimited", "users": "unlimited"}'::jsonb,
    'paid'
  )
  ON CONFLICT (subscription_number) DO NOTHING;
  
  RAISE NOTICE '   ✅ Subscription created';

  -- ============================================
  -- 6. COLLECT PERMISSIONS
  -- ============================================
  
  SELECT array_agg(code) INTO v_permission_codes
  FROM permissions
  WHERE app_code = v_app_code AND deleted_at IS NULL;

  -- ============================================
  -- 7. CREATE ROLE
  -- ============================================
  
  RAISE NOTICE '7️⃣  Creating Administrator role...';
  
  INSERT INTO roles (tenant_id, name, description, type, permission_codes)
  VALUES (v_tenant_id, 'Administrator', 'Full admin access', 'SYSTEM', v_permission_codes)
  RETURNING _id INTO v_role_id;
  
  RAISE NOTICE '   ✅ Role created with % permissions', array_length(v_permission_codes, 1);

  -- ============================================
  -- 8. CREATE/UPDATE USER
  -- ============================================
  
  RAISE NOTICE '8️⃣  Setting up user record...';
  
  INSERT INTO users (_id, email, full_name, status, is_support_staff, is_verified, locale, metadata)
  VALUES (v_user_id, v_admin_email, v_admin_name, 'ACTIVE', true, true, 'vi-VN', '{"role": "admin"}'::jsonb)
  ON CONFLICT (_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    status = 'ACTIVE',
    is_verified = true,
    updated_at = now();
  
  RAISE NOTICE '   ✅ User record created/updated';

  -- ============================================
  -- 9. TENANT MEMBER
  -- ============================================
  
  RAISE NOTICE '9️⃣  Adding tenant member...';
  
  INSERT INTO tenant_members (tenant_id, user_id, employee_code, internal_email, job_title, role, status, joined_at, metadata)
  VALUES (v_tenant_id, v_user_id, 'ADMIN001', v_admin_email, 'System Administrator', 'OWNER', 'ACTIVE', now(), '{"is_founder": true}'::jsonb)
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    role = 'OWNER',
    status = 'ACTIVE',
    updated_at = now();
  
  RAISE NOTICE '   ✅ Tenant member added (OWNER)';

  -- ============================================
  -- 10. USER ROLE
  -- ============================================
  
  RAISE NOTICE '🔟 Assigning role...';
  
  INSERT INTO user_roles (user_id, role_id, tenant_id, scope, scope_id, granted_by, granted_at, is_active, metadata)
  VALUES (v_user_id, v_role_id, v_tenant_id, 'tenant', v_tenant_id, v_user_id, now(), true, '{"source": "init_script"}'::jsonb)
  ON CONFLICT (user_id, role_id, scope, scope_id) DO UPDATE SET
    is_active = true,
    updated_at = now();
  
  RAISE NOTICE '   ✅ Role assigned';
  RAISE NOTICE '';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  
END $$;

-- Verification
SELECT 'Applications:' as check_type, count(*) as count FROM applications WHERE code = 'PLATFORM_ADMIN'
UNION ALL SELECT 'Permissions:', count(*) FROM permissions WHERE app_code = 'PLATFORM_ADMIN'
UNION ALL SELECT 'Tenant Apps:', count(*) FROM tenant_applications WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL SELECT 'Routes:', count(*) FROM tenant_app_routes WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL SELECT 'Subscriptions:', count(*) FROM tenant_subscriptions WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL SELECT 'Roles:', count(*) FROM roles WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL SELECT 'Users:', count(*) FROM users WHERE email = 'admin@saas.coquan.vn'
UNION ALL SELECT 'Members:', count(*) FROM tenant_members WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe'
UNION ALL SELECT 'User Roles:', count(*) FROM user_roles WHERE tenant_id = '078e19ae-af67-4452-9ccd-10e27acb2dfe';

-- Show login info
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🔐 LOGIN INFORMATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Email: admin@saas.coquan.vn';
  RAISE NOTICE 'Password: Vhv@2026';
  RAISE NOTICE 'Domain: saas.coquan.vn';
  RAISE NOTICE '============================================';
END $$;
