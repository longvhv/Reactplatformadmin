/**
 * Initialize Tenant Data Routes
 * Programmatically initialize tenant data via API
 */

import { Hono } from 'npm:hono';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Helper: Get Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

/**
 * POST /init-tenant
 * Initialize tenant with all necessary data
 */
app.post('/init-tenant', async (c: Context) => {
  try {
    const supabase = getSupabaseClient();
    
    // Configuration
    const TENANT_ID = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
    const DOMAIN = 'saas.coquan.vn';
    const APP_CODE = 'PLATFORM_ADMIN';
    
    const results: any = {};
    
    // ============================================
    // 1. Create Tenant
    // ============================================
    console.log('1️⃣  Creating tenant...');
    
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('_id')
      .eq('_id', TENANT_ID)
      .single();
    
    if (!existingTenant) {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          _id: TENANT_ID,
          code: 'saas-main',
          name: 'SaaS Main Tenant',
          domain: DOMAIN,
          tier: 'ENTERPRISE',
          status: 'ACTIVE',
          settings: {},
          metadata: {},
          version: 1,
        })
        .select()
        .single();
      
      if (tenantError) throw tenantError;
      results.tenant = tenant;
      console.log('   ✅ Tenant created');
    } else {
      results.tenant = existingTenant;
      console.log('   ℹ️  Tenant already exists');
    }
    
    // ============================================
    // 2. Create Application
    // ============================================
    console.log('2️⃣  Creating application...');
    
    const { data: app, error: appError } = await supabase
      .from('applications')
      .upsert({
        code: APP_CODE,
        name: 'Platform Admin',
        description: 'Platform Administration Application',
        is_active: true,
        version: 1,
      }, {
        onConflict: 'code',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (appError) throw appError;
    results.application = app;
    console.log('   ✅ Application created');
    
    // ============================================
    // 3. Create Permissions
    // ============================================
    console.log('3️⃣  Creating permissions...');
    
    const permissions = [
      { code: 'admin', parent_code: null, path: '/admin', is_group: true, name: 'Administration' },
      { code: 'admin.view', parent_code: 'admin', path: '/admin/admin.view', is_group: false, name: 'View Admin' },
      { code: 'users', parent_code: null, path: '/users', is_group: true, name: 'Users Management' },
      { code: 'users.view', parent_code: 'users', path: '/users/users.view', is_group: false, name: 'View Users' },
      { code: 'users.create', parent_code: 'users', path: '/users/users.create', is_group: false, name: 'Create Users' },
      { code: 'tenants', parent_code: null, path: '/tenants', is_group: true, name: 'Tenants Management' },
      { code: 'tenants.view', parent_code: 'tenants', path: '/tenants/tenants.view', is_group: false, name: 'View Tenants' },
    ];
    
    for (const perm of permissions) {
      await supabase
        .from('permissions')
        .upsert({
          code: perm.code,
          app_code: APP_CODE,
          parent_code: perm.parent_code,
          path: perm.path,
          is_group: perm.is_group,
          name: perm.name,
          description: `${perm.name} permission`,
          version: 1,
        }, {
          onConflict: 'code',
          ignoreDuplicates: false,
        });
    }
    
    results.permissions = permissions.length;
    console.log(`   ✅ Created ${permissions.length} permissions`);
    
    // ============================================
    // 4. Create Tenant Application
    // ============================================
    console.log('4️⃣  Creating tenant application...');
    
    const { data: tenantApp, error: tenantAppError } = await supabase
      .from('tenant_applications')
      .upsert({
        tenant_id: TENANT_ID,
        app_id: app._id,
        base_path: '/',
        domain: DOMAIN,
        is_active: true,
        version: 1,
      }, {
        onConflict: 'tenant_id,app_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (tenantAppError) throw tenantAppError;
    results.tenantApplication = tenantApp;
    console.log('   ✅ Tenant application created');
    
    // ============================================
    // 5. Create Administrator Role
    // ============================================
    console.log('5️⃣  Creating administrator role...');
    
    const allPermissionCodes = permissions.map(p => p.code);
    
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        tenant_id: TENANT_ID,
        name: 'Administrator',
        description: 'Full system access',
        type: 'SYSTEM',
        permission_codes: allPermissionCodes,
        version: 1,
      })
      .select()
      .single();
    
    if (roleError && roleError.code !== '23505') { // Ignore duplicate error
      throw roleError;
    }
    
    results.role = role || 'Already exists';
    console.log('   ✅ Administrator role created');
    
    // ============================================
    // 6. Create Tenant Subscription
    // ============================================
    console.log('6️⃣  Creating tenant subscription...');
    
    const { data: subscription, error: subscriptionError } = await supabase
      .from('tenant_subscriptions')
      .upsert({
        tenant_id: TENANT_ID,
        plan_name: 'ENTERPRISE',
        tier: 'ENTERPRISE',
        status: 'ACTIVE',
        started_at: new Date().toISOString(),
        is_unlimited: true,
        version: 1,
      }, {
        onConflict: 'tenant_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (subscriptionError) throw subscriptionError;
    results.subscription = subscription;
    console.log('   ✅ Subscription created');
    
    // ============================================
    // Success Response
    // ============================================
    
    return c.json({
      success: true,
      message: 'Tenant initialized successfully',
      data: results,
      next_steps: [
        '1. Create admin user via Supabase Auth Dashboard',
        '2. Call POST /init-admin-user with user_id',
        '3. Login with admin@saas.coquan.vn',
      ],
    }, 201);
    
  } catch (error: any) {
    console.error('Error initializing tenant:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to initialize tenant',
      details: error,
    }, 500);
  }
});

/**
 * POST /init-admin-user
 * Create admin user and link to tenant
 */
app.post('/init-admin-user', async (c: Context) => {
  try {
    const body = await c.req.json();
    const { user_id, email = 'admin@saas.coquan.vn' } = body;
    
    if (!user_id) {
      return c.json({
        error: 'user_id is required. Create user in Supabase Auth first.',
      }, 400);
    }
    
    const supabase = getSupabaseClient();
    const TENANT_ID = '078e19ae-af67-4452-9ccd-10e27acb2dfe';
    
    const results: any = {};
    
    // ============================================
    // 1. Create User record
    // ============================================
    console.log('1️⃣  Creating user record...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        _id: user_id,
        email: email,
        full_name: 'Administrator',
        status: 'ACTIVE',
        email_verified: true,
        version: 1,
      }, {
        onConflict: '_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (userError) throw userError;
    results.user = user;
    console.log('   ✅ User record created');
    
    // ============================================
    // 2. Create Tenant Member
    // ============================================
    console.log('2️⃣  Creating tenant member...');
    
    const { data: member, error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: TENANT_ID,
        user_id: user_id,
        status: 'ACTIVE',
        joined_at: new Date().toISOString(),
        version: 1,
      })
      .select()
      .single();
    
    if (memberError && memberError.code !== '23505') {
      throw memberError;
    }
    
    results.member = member || 'Already exists';
    console.log('   ✅ Tenant member created');
    
    // ============================================
    // 3. Assign Administrator Role
    // ============================================
    console.log('3️⃣  Assigning administrator role...');
    
    // Get role
    const { data: role } = await supabase
      .from('roles')
      .select('_id')
      .eq('tenant_id', TENANT_ID)
      .eq('name', 'Administrator')
      .single();
    
    if (role && member) {
      const { data: userRole, error: userRoleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user_id,
          role_id: role._id,
          tenant_id: TENANT_ID,
          version: 1,
        })
        .select()
        .single();
      
      if (userRoleError && userRoleError.code !== '23505') {
        throw userRoleError;
      }
      
      results.userRole = userRole || 'Already exists';
      console.log('   ✅ Role assigned');
    }
    
    // ============================================
    // Success Response
    // ============================================
    
    return c.json({
      success: true,
      message: 'Admin user initialized successfully',
      data: results,
      login: {
        email: email,
        tenant_id: TENANT_ID,
      },
    }, 201);
    
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to create admin user',
      details: error,
    }, 500);
  }
});

export default app;
