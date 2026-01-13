/**
 * Mock Seed Data for Development/Testing
 * Used as fallback when Supabase API is not available
 */

import type { Tenant } from './tenants';
import type { User } from './users';

export const MOCK_TENANTS: Tenant[] = [
  {
    _id: 'tenant-platform-001',
    code: 'basicsoft-platform',
    name: 'BasicSoft Platform',
    data_region: 'ap-southeast-1',
    compliance_level: 'ENTERPRISE',
    parent_tenant_id: null,
    path: '/tenant-platform-001/',
    tier: 'ENTERPRISE',
    billing_type: 'MONTHLY',
    timezone: 'Asia/Ho_Chi_Minh',
    profile: {
      description: 'Root platform tenant',
      industry: 'Technology',
      website: 'https://basicsoft.vn',
    },
    settings: {
      max_users: 1000,
      max_storage: 1000,
      current_users: 16,
      current_storage: 45.2,
      mfa_enforced: true,
      sso_enabled: true,
      custom_branding: true,
      api_access: true,
      features: ['advanced_analytics', 'custom_integrations', 'priority_support'],
    },
    status: 'ACTIVE',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_by: 'system',
    updated_by: 'system',
    deleted_at: null,
    deleted_by: null,
    version: 1,
  },
  {
    _id: 'tenant-enterprise-001',
    code: 'acme-corp',
    name: 'ACME Corporation',
    data_region: 'ap-southeast-1',
    compliance_level: 'ENTERPRISE',
    parent_tenant_id: 'tenant-platform-001',
    path: '/tenant-platform-001/tenant-enterprise-001/',
    tier: 'ENTERPRISE',
    billing_type: 'ANNUAL',
    timezone: 'America/New_York',
    profile: {
      description: 'Large enterprise customer',
      industry: 'Manufacturing',
    },
    settings: {
      max_users: 500,
      max_storage: 500,
      current_users: 245,
      current_storage: 312.5,
      mfa_enforced: true,
      sso_enabled: true,
      custom_branding: true,
      api_access: true,
      features: ['advanced_analytics', 'priority_support'],
    },
    status: 'ACTIVE',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    created_by: 'system',
    updated_by: 'system',
    deleted_at: null,
    deleted_by: null,
    version: 1,
  },
  {
    _id: 'tenant-division-001',
    code: 'acme-engineering',
    name: 'ACME Engineering Division',
    data_region: 'ap-southeast-1',
    compliance_level: 'STANDARD',
    parent_tenant_id: 'tenant-enterprise-001',
    path: '/tenant-platform-001/tenant-enterprise-001/tenant-division-001/',
    tier: 'BUSINESS',
    billing_type: 'MONTHLY',
    timezone: 'America/New_York',
    profile: {
      description: 'Engineering division',
      department: 'Engineering',
    },
    settings: {
      max_users: 100,
      max_storage: 200,
      current_users: 78,
      current_storage: 145.8,
      mfa_enforced: false,
      sso_enabled: true,
      custom_branding: false,
      api_access: true,
      features: ['basic_analytics'],
    },
    status: 'ACTIVE',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    created_by: 'system',
    updated_by: 'system',
    deleted_at: null,
    deleted_by: null,
    version: 1,
  },
];

export const MOCK_USERS: User[] = [
  {
    _id: 'user-superadmin-001',
    username: 'superadmin',
    email: 'superadmin@basicsoft.vn',
    name: 'Super Administrator',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    email_verified: true,
    mfa_enabled: true,
    avatar: null,
    position: 'System Administrator',
    department: 'IT Operations',
    phone: '+84123456789',
    location: 'Ho Chi Minh City',
    bio: 'Platform super administrator with full system access',
    preferences: {
      language: 'en',
      timezone: 'Asia/Ho_Chi_Minh',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    last_login_at: '2026-01-12T08:00:00Z',
    password_changed_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-01-12T08:00:00Z',
    created_by: 'system',
    updated_by: 'system',
    deleted_at: null,
    deleted_by: null,
    version: 1,
  },
  {
    _id: 'user-admin-001',
    username: 'admin',
    email: 'admin@acme.com',
    name: 'John Smith',
    role: 'ADMIN',
    status: 'ACTIVE',
    email_verified: true,
    mfa_enabled: true,
    avatar: null,
    position: 'IT Director',
    department: 'Information Technology',
    phone: '+1234567890',
    location: 'New York',
    bio: 'ACME Corp IT Director',
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: true,
      },
    },
    last_login_at: '2026-01-12T07:30:00Z',
    password_changed_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2026-01-12T07:30:00Z',
    created_by: 'system',
    updated_by: 'system',
    deleted_at: null,
    deleted_by: null,
    version: 1,
  },
  {
    _id: 'user-manager-001',
    username: 'manager1',
    email: 'manager@acme.com',
    name: 'Sarah Johnson',
    role: 'MANAGER',
    status: 'ACTIVE',
    email_verified: true,
    mfa_enabled: false,
    avatar: null,
    position: 'Engineering Manager',
    department: 'Engineering',
    phone: '+1234567891',
    location: 'New York',
    bio: 'Engineering team lead',
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    last_login_at: '2026-01-11T16:45:00Z',
    password_changed_at: '2024-02-01T00:00:00Z',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2026-01-11T16:45:00Z',
    created_by: 'system',
    updated_by: 'system',
    deleted_at: null,
    deleted_by: null,
    version: 1,
  },
  {
    _id: 'user-user-001',
    username: 'user1',
    email: 'user1@acme.com',
    name: 'Mike Wilson',
    role: 'USER',
    status: 'ACTIVE',
    email_verified: true,
    mfa_enabled: false,
    avatar: null,
    position: 'Senior Developer',
    department: 'Engineering',
    phone: '+1234567892',
    location: 'New York',
    bio: null,
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
    },
    last_login_at: '2026-01-12T06:15:00Z',
    password_changed_at: '2024-02-05T00:00:00Z',
    created_at: '2024-02-05T00:00:00Z',
    updated_at: '2026-01-12T06:15:00Z',
    created_by: 'system',
    updated_by: 'system',
    deleted_at: null,
    deleted_by: null,
    version: 1,
  },
];

/**
 * Initialize mock data in localStorage
 * Call this on app startup if API is not available
 */
export function initializeMockData(): void {
  if (!localStorage.getItem('seed_tenants')) {
    localStorage.setItem('seed_tenants', JSON.stringify(MOCK_TENANTS));
    localStorage.setItem('tenants_cache', JSON.stringify({
      data: MOCK_TENANTS,
      timestamp: Date.now()
    }));
  }

  if (!localStorage.getItem('seed_users')) {
    localStorage.setItem('seed_users', JSON.stringify(MOCK_USERS));
    localStorage.setItem('users_cache', JSON.stringify({
      data: MOCK_USERS,
      timestamp: Date.now()
    }));
  }

  console.log('✅ Mock data initialized in localStorage');
}

/**
 * Check if API is available
 */
export async function checkAPIAvailability(projectId: string, publicAnonKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/debug`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}