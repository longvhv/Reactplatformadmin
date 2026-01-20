/**
 * Create Admin User in Supabase Auth
 * Run this script to create the admin user with authentication
 */

import { createClient } from '@supabase/supabase-js';

// Get from environment or use your values
const SUPABASE_URL = 'https://vewxdzhvrpxsmpmlwaqr.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Get from Supabase Dashboard

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAdminUser() {
  try {
    console.log('Creating admin user in Supabase Auth...');

    // Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@saas.coquan.vn',
      password: 'Vhv@2026',
      email_confirm: true,
      user_metadata: {
        name: 'Administrator',
        role: 'admin',
      },
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Now create in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          _id: authData.user.id, // Use same ID from auth
          email: 'admin@saas.coquan.vn',
          name: 'Administrator',
          status: 'ACTIVE',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user record:', userError);
      return;
    }

    console.log('✅ User record created:', userData);

    // Create tenant member
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert([
        {
          _id: crypto.randomUUID(),
          tenant_id: '078e19ae-af67-4452-9ccd-10e27acb2dfe',
          user_id: authData.user.id,
          status: 'ACTIVE',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (memberError) {
      console.error('❌ Error creating tenant member:', memberError);
      return;
    }

    console.log('✅ Tenant member created');

    // Get Administrator role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('_id')
      .eq('code', 'ADMINISTRATOR')
      .single();

    if (roleError || !roleData) {
      console.error('❌ Administrator role not found:', roleError);
      return;
    }

    // Assign role to user
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .insert([
        {
          _id: crypto.randomUUID(),
          user_id: authData.user.id,
          role_id: roleData._id,
          tenant_id: '078e19ae-af67-4452-9ccd-10e27acb2dfe',
          assigned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (userRoleError) {
      console.error('❌ Error assigning role:', userRoleError);
      return;
    }

    console.log('✅ Role assigned to user');
    console.log('\n🎉 Admin user created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@saas.coquan.vn');
    console.log('Password: Vhv@2026');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createAdminUser();
