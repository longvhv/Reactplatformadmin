/**
 * Auth Helper Script
 * 
 * Helper functions để tạo và quản lý user trong Supabase Auth
 * Sử dụng trong development hoặc scripts
 */

import { supabase } from './supabase';

interface CreateUserOptions {
  email: string;
  password: string;
  metadata?: {
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
    [key: string]: any;
  };
  emailConfirm?: boolean;
}

/**
 * Create a new user in Supabase Auth
 * Note: This requires SUPABASE_SERVICE_ROLE_KEY which is only available server-side
 * Use this only in server-side code or scripts
 */
export async function createUser(options: CreateUserOptions) {
  const { email, password, metadata = {}, emailConfirm = true } = options;

  try {
    console.log('Creating user:', email);

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: undefined, // No email confirmation redirect
      },
    });

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    console.log('User created successfully:', data.user?.id);
    return data.user;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

/**
 * Create admin user with predefined credentials
 */
export async function createAdminUser() {
  return createUser({
    email: 'admin@saas.coquan.vn',
    password: 'Vhv@2026',
    metadata: {
      display_name: 'Admin',
      full_name: 'System Administrator',
      role: 'Super Admin',
    },
    emailConfirm: true,
  });
}

/**
 * Update user metadata
 */
export async function updateUser(metadata: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    console.log('User updated successfully');
    return data.user;
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
}

/**
 * Reset user password (requires admin privileges)
 */
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error resetting password:', error);
      throw error;
    }

    console.log('Password reset email sent to:', email);
    return data;
  } catch (error) {
    console.error('Error in resetPassword:', error);
    throw error;
  }
}

/**
 * List all users (Note: This requires admin API endpoint)
 * Not available in client-side Supabase client
 */
export async function listUsers() {
  console.warn('listUsers() requires server-side Supabase Admin API');
  console.warn('Use Supabase Dashboard or create a server endpoint');
  return null;
}

/**
 * Delete user (Note: This requires admin API endpoint)
 * Not available in client-side Supabase client
 */
export async function deleteUser(userId: string) {
  console.warn('deleteUser() requires server-side Supabase Admin API');
  console.warn('Use Supabase Dashboard or create a server endpoint');
  return null;
}

// Export for use in console for quick testing
if (typeof window !== 'undefined') {
  (window as any).authHelpers = {
    createUser,
    createAdminUser,
    updateUser,
    resetPassword,
    listUsers,
    deleteUser,
  };
  
  console.log('🔐 Auth Helpers loaded! Access via window.authHelpers');
  console.log('Example: await window.authHelpers.createAdminUser()');
}
