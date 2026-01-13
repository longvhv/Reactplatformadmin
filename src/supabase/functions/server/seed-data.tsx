/**
 * Seed Data API
 * Initialize demo data for tenants, users, tenant_members, linked_identities, mfa_methods, and sso_configs
 */

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import type { Context } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Helper: Get Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

/**
 * Helper: Hash password using Web Crypto API
 * Compatible with Deno edge runtime
 */
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Demo data (imported inline to avoid module issues)
const DEMO_TENANTS = [
  {
    code: 'vhv-platform',
    name: 'VHV Platform',
    type: 'PLATFORM',
    status: 'ACTIVE',
    description: 'Main platform tenant - root of all organizations',
    contact_email: 'admin@vhvplatform.com',
    contact_phone: '+84-28-1234-5678',
    address: 'Ho Chi Minh City, Vietnam',
    website: 'https://vhvplatform.com',
    logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
    settings: { timezone: 'Asia/Ho_Chi_Minh', currency: 'VND', language: 'vi' },
    parent_code: null,
  },
  {
    code: 'tech-corp',
    name: 'Tech Corporation',
    type: 'ENTERPRISE',
    status: 'ACTIVE',
    description: 'Large technology corporation with multiple divisions',
    contact_email: 'contact@techcorp.com',
    contact_phone: '+1-415-555-0100',
    address: 'San Francisco, CA, USA',
    website: 'https://techcorp.example.com',
    logo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200',
    settings: { timezone: 'America/Los_Angeles', currency: 'USD', language: 'en', max_users: 500 },
    parent_code: 'vhv-platform',
  },
  {
    code: 'edu-institute',
    name: 'Education Institute',
    type: 'EDUCATION',
    status: 'ACTIVE',
    description: 'Educational institution with multiple campuses',
    contact_email: 'admin@eduinstitute.edu',
    contact_phone: '+44-20-7946-0958',
    address: 'London, UK',
    website: 'https://eduinstitute.example.com',
    logo_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200',
    settings: { timezone: 'Europe/London', currency: 'GBP', language: 'en', max_users: 1000 },
    parent_code: 'vhv-platform',
  },
  {
    code: 'health-care',
    name: 'HealthCare Plus',
    type: 'HEALTHCARE',
    status: 'ACTIVE',
    description: 'Healthcare provider network',
    contact_email: 'info@healthcareplus.com',
    contact_phone: '+1-212-555-0150',
    address: 'New York, NY, USA',
    website: 'https://healthcareplus.example.com',
    logo_url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200',
    settings: { timezone: 'America/New_York', currency: 'USD', language: 'en', max_users: 300 },
    parent_code: 'vhv-platform',
  },
  {
    code: 'tech-corp-engineering',
    name: 'Engineering Division',
    type: 'DIVISION',
    status: 'ACTIVE',
    description: 'Software engineering and development',
    contact_email: 'engineering@techcorp.com',
    contact_phone: '+1-415-555-0101',
    address: 'San Francisco, CA, USA',
    logo_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200',
    settings: { timezone: 'America/Los_Angeles', currency: 'USD', language: 'en' },
    parent_code: 'tech-corp',
  },
  {
    code: 'tech-corp-sales',
    name: 'Sales & Marketing Division',
    type: 'DIVISION',
    status: 'ACTIVE',
    description: 'Sales and marketing operations',
    contact_email: 'sales@techcorp.com',
    contact_phone: '+1-415-555-0102',
    address: 'San Francisco, CA, USA',
    logo_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=200',
    settings: { timezone: 'America/Los_Angeles', currency: 'USD', language: 'en' },
    parent_code: 'tech-corp',
  },
  {
    code: 'demo-tenant',
    name: 'Demo Tenant',
    type: 'TRIAL',
    status: 'ACTIVE',
    description: 'Demo tenant for testing purposes',
    contact_email: 'demo@example.com',
    contact_phone: '+1-555-0199',
    logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200',
    settings: { timezone: 'UTC', currency: 'USD', language: 'en', is_demo: true },
    parent_code: 'vhv-platform',
  },
];

const DEMO_USERS = [
  {
    email: 'admin@vhvplatform.com',
    password: 'Admin@123456',
    name: 'Platform Administrator',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    department: 'Platform Operations',
    position: 'Chief Technology Officer',
    phone: '+84-28-1234-5678',
    location: 'Ho Chi Minh City, Vietnam',
    bio: 'Platform administrator with full system access',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
  {
    email: 'john.doe@techcorp.com',
    password: 'User@123456',
    name: 'John Doe',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Engineering',
    position: 'Engineering Manager',
    phone: '+1-415-555-0101',
    location: 'San Francisco, CA',
    bio: 'Engineering manager with 10+ years of experience',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  },
  {
    email: 'mike.wilson@techcorp.com',
    password: 'User@123456',
    name: 'Mike Wilson',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Engineering',
    position: 'Senior Frontend Developer',
    phone: '+1-415-555-0110',
    location: 'San Francisco, CA',
    bio: 'React and TypeScript specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    email: 'emma.brown@techcorp.com',
    password: 'User@123456',
    name: 'Emma Brown',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Engineering',
    position: 'Senior Backend Developer',
    phone: '+1-415-555-0111',
    location: 'San Francisco, CA',
    bio: 'Node.js and database expert',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
  {
    email: 'david.smith@eduinstitute.edu',
    password: 'User@123456',
    name: 'Dr. David Smith',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Administration',
    position: 'Academic Director',
    phone: '+44-20-7946-0960',
    location: 'London, UK',
    bio: 'Leading academic excellence and innovation',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200',
  },
  {
    email: 'guest@vhvplatform.com',
    password: 'User@123456',
    name: 'Guest User',
    role: 'VIEWER',
    status: 'ACTIVE',
    department: 'Guest Access',
    position: 'Guest',
    location: 'Global',
    bio: 'Read-only access for demonstration',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200',
  },
];

// Demo tenant members relationships
const DEMO_TENANT_MEMBERS = [
  // Platform admins
  { user_email: 'admin@vhvplatform.com', tenant_code: 'vhv-platform', role: 'OWNER', employee_code: 'EMP-001', job_title: 'Platform Administrator' },
  { user_email: 'sarah.admin@vhvplatform.com', tenant_code: 'vhv-platform', role: 'ADMIN', employee_code: 'EMP-002', job_title: 'System Administrator' },

  // Tech Corp
  { user_email: 'john.doe@techcorp.com', tenant_code: 'tech-corp', role: 'OWNER', employee_code: 'TC-001', job_title: 'CEO' },
  { user_email: 'lisa.chen@techcorp.com', tenant_code: 'tech-corp', role: 'ADMIN', employee_code: 'TC-002', job_title: 'CTO' },
  { user_email: 'john.doe@techcorp.com', tenant_code: 'tech-corp-engineering', role: 'ADMIN', employee_code: 'ENG-001', job_title: 'Engineering Director' },
  
  // Engineering teams
  { user_email: 'mike.wilson@techcorp.com', tenant_code: 'tech-corp-engineering', role: 'MEMBER', employee_code: 'ENG-010', job_title: 'Senior Developer' },
  { user_email: 'emma.brown@techcorp.com', tenant_code: 'tech-corp-engineering', role: 'MEMBER', employee_code: 'ENG-011', job_title: 'Tech Lead' },

  // Education Institute
  { user_email: 'david.smith@eduinstitute.edu', tenant_code: 'edu-institute', role: 'OWNER', employee_code: 'EDU-001', job_title: 'Dean' },
  
  // Healthcare
  { user_email: 'dr.maria.garcia@healthcareplus.com', tenant_code: 'health-care', role: 'OWNER', employee_code: 'HC-001', job_title: 'Medical Director' },

  // Support staff
  { user_email: 'support@vhvplatform.com', tenant_code: 'vhv-platform', role: 'MEMBER', employee_code: 'SUP-001', job_title: 'Support Engineer' },
  
  // Guest viewer
  { user_email: 'guest@vhvplatform.com', tenant_code: 'demo-tenant', role: 'VIEWER', job_title: 'Guest' },
];

// Demo linked identities for users (OAuth/Social login)
const DEMO_LINKED_IDENTITIES = [
  // Admin user with multiple providers
  {
    user_email: 'admin@vhvplatform.com',
    provider: 'GOOGLE',
    provider_user_id: 'google_110741234567890123456',
    provider_username: 'admin',
    provider_email: 'admin@vhvplatform.com',
    display_name: 'Platform Administrator',
    avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
  },
  {
    user_email: 'admin@vhvplatform.com',
    provider: 'GITHUB',
    provider_user_id: 'github_12345678',
    provider_username: 'vhv-admin',
    provider_email: 'admin@vhvplatform.com',
    display_name: 'vhv-admin',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345678',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: false,
  },
  // John Doe
  {
    user_email: 'john.doe@techcorp.com',
    provider: 'MICROSOFT',
    provider_user_id: 'microsoft_aad_abc123',
    provider_username: 'john.doe',
    provider_email: 'john.doe@techcorp.com',
    display_name: 'John Doe',
    avatar_url: 'https://graph.microsoft.com/v1.0/me/photo/$value',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
  },
  {
    user_email: 'john.doe@techcorp.com',
    provider: 'LINKEDIN',
    provider_user_id: 'linkedin_xyz789',
    provider_username: 'johndoe',
    provider_email: 'john.doe@techcorp.com',
    display_name: 'John Doe',
    avatar_url: 'https://media.licdn.com/dms/image/C5603AQHP2t3x4o-Ixw/profile-displayphoto-shrink_100_100/0',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: false,
  },
  // Mike Wilson
  {
    user_email: 'mike.wilson@techcorp.com',
    provider: 'GITHUB',
    provider_user_id: 'github_87654321',
    provider_username: 'mikewilson-dev',
    provider_email: 'mike.wilson@techcorp.com',
    display_name: 'Mike Wilson',
    avatar_url: 'https://avatars.githubusercontent.com/u/87654321',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
  },
  // Emma Brown
  {
    user_email: 'emma.brown@techcorp.com',
    provider: 'GOOGLE',
    provider_user_id: 'google_210987654321098765432',
    provider_username: 'emma.brown',
    provider_email: 'emma.brown@techcorp.com',
    display_name: 'Emma Brown',
    avatar_url: 'https://lh3.googleusercontent.com/a/default-user-2',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
  },
  // David Smith
  {
    user_email: 'david.smith@eduinstitute.edu',
    provider: 'MICROSOFT',
    provider_user_id: 'microsoft_aad_edu456',
    provider_username: 'david.smith',
    provider_email: 'david.smith@eduinstitute.edu',
    display_name: 'Dr. David Smith',
    avatar_url: 'https://graph.microsoft.com/v1.0/me/photo/$value',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
  },
];

// Demo MFA methods for users
const DEMO_MFA_METHODS = [
  // Admin user - TOTP + SMS
  {
    user_email: 'admin@vhvplatform.com',
    method_type: 'TOTP',
    method_name: 'Authenticator App (Google)',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
    is_enforced: true,
    device_name: 'Google Authenticator',
    device_type: 'MOBILE',
    success_count: 247,
    failure_count: 3,
  },
  {
    user_email: 'admin@vhvplatform.com',
    method_type: 'SMS',
    method_name: 'SMS to +84-28-1234-5678',
    sms_phone_number: '+84281234567',
    sms_phone_verified: true,
    status: 'ACTIVE',
    is_verified: true,
    is_primary: false,
    is_enforced: false,
    success_count: 89,
    failure_count: 1,
  },
  {
    user_email: 'admin@vhvplatform.com',
    method_type: 'BACKUP_CODES',
    method_name: 'Backup Recovery Codes',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: false,
    is_enforced: false,
    backup_codes_total: 10,
    backup_codes_used: 2,
    success_count: 2,
    failure_count: 0,
  },
  // John Doe - TOTP + WebAuthn
  {
    user_email: 'john.doe@techcorp.com',
    method_type: 'TOTP',
    method_name: 'Microsoft Authenticator',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
    is_enforced: true,
    device_name: 'Microsoft Authenticator',
    device_type: 'MOBILE',
    success_count: 156,
    failure_count: 2,
  },
  {
    user_email: 'john.doe@techcorp.com',
    method_type: 'WEBAUTHN',
    method_name: 'YubiKey 5 NFC',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: false,
    is_enforced: false,
    device_name: 'YubiKey 5 NFC',
    device_type: 'HARDWARE_TOKEN',
    success_count: 78,
    failure_count: 0,
  },
  // Mike Wilson - TOTP
  {
    user_email: 'mike.wilson@techcorp.com',
    method_type: 'TOTP',
    method_name: 'Authy',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
    is_enforced: false,
    device_name: 'Authy',
    device_type: 'MOBILE',
    success_count: 92,
    failure_count: 5,
  },
  // Emma Brown - SMS + Email
  {
    user_email: 'emma.brown@techcorp.com',
    method_type: 'SMS',
    method_name: 'SMS to +1-415-555-0111',
    sms_phone_number: '+14155550111',
    sms_phone_verified: true,
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
    is_enforced: true,
    success_count: 64,
    failure_count: 2,
  },
  {
    user_email: 'emma.brown@techcorp.com',
    method_type: 'EMAIL',
    method_name: 'Email to emma.brown@techcorp.com',
    email_address: 'emma.brown@techcorp.com',
    email_verified: true,
    status: 'ACTIVE',
    is_verified: true,
    is_primary: false,
    is_enforced: false,
    success_count: 23,
    failure_count: 1,
  },
  // David Smith - TOTP + Backup Codes
  {
    user_email: 'david.smith@eduinstitute.edu',
    method_type: 'TOTP',
    method_name: 'Google Authenticator',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: true,
    is_enforced: true,
    device_name: 'Google Authenticator',
    device_type: 'MOBILE',
    success_count: 183,
    failure_count: 4,
  },
  {
    user_email: 'david.smith@eduinstitute.edu',
    method_type: 'BACKUP_CODES',
    method_name: 'Backup Recovery Codes',
    status: 'ACTIVE',
    is_verified: true,
    is_primary: false,
    is_enforced: false,
    backup_codes_total: 10,
    backup_codes_used: 0,
    success_count: 0,
    failure_count: 0,
  },
];

// Demo SSO configs for tenants
const DEMO_SSO_CONFIGS = [
  // Tech Corp - Microsoft Azure AD (OIDC)
  {
    tenant_code: 'tech-corp',
    provider: 'OIDC',
    name: 'Microsoft Azure AD SSO',
    description: 'Corporate Microsoft Azure Active Directory integration',
    status: 'ACTIVE',
    client_id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    client_secret: '***ENCRYPTED***',
    authorization_endpoint: 'https://login.microsoftonline.com/techcorp.com/oauth2/v2.0/authorize',
    token_endpoint: 'https://login.microsoftonline.com/techcorp.com/oauth2/v2.0/token',
    userinfo_endpoint: 'https://graph.microsoft.com/oidc/userinfo',
    jwks_uri: 'https://login.microsoftonline.com/techcorp.com/discovery/v2.0/keys',
    scopes: ['openid', 'profile', 'email', 'User.Read'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
      given_name: 'given_name',
      family_name: 'family_name',
      picture: 'picture',
    },
    settings: {
      auto_provision: true,
      default_role: 'USER',
      require_email_verification: false,
    },
  },
  // Tech Corp - Okta SAML
  {
    tenant_code: 'tech-corp',
    provider: 'SAML',
    name: 'Okta SAML 2.0',
    description: 'Okta SAML integration for partner access',
    status: 'ACTIVE',
    entity_id: 'https://techcorp.okta.com/app/techcorp_vhvplatform_1/exk123456789abcdef/sso/saml',
    sso_url: 'https://techcorp.okta.com/app/techcorp_vhvplatform_1/exk123456789abcdef/sso/saml',
    slo_url: 'https://techcorp.okta.com/app/techcorp_vhvplatform_1/exk123456789abcdef/slo/saml',
    certificate: '-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAXYZ...\n-----END CERTIFICATE-----',
    metadata_url: 'https://techcorp.okta.com/app/exk123456789abcdef/sso/saml/metadata',
    attribute_mapping: {
      email: 'email',
      name: 'displayName',
      first_name: 'firstName',
      last_name: 'lastName',
      department: 'department',
    },
    settings: {
      auto_provision: true,
      default_role: 'MEMBER',
      sign_requests: true,
    },
  },
  // Education Institute - Google Workspace
  {
    tenant_code: 'edu-institute',
    provider: 'OIDC',
    name: 'Google Workspace SSO',
    description: 'Google Workspace for Education integration',
    status: 'ACTIVE',
    client_id: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
    client_secret: '***ENCRYPTED***',
    authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    token_endpoint: 'https://oauth2.googleapis.com/token',
    userinfo_endpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
    jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
    scopes: ['openid', 'profile', 'email'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
      given_name: 'given_name',
      family_name: 'family_name',
      picture: 'picture',
      email_verified: 'email_verified',
    },
    settings: {
      auto_provision: true,
      default_role: 'USER',
      require_email_domain: 'eduinstitute.edu',
    },
  },
  // Healthcare - Auth0
  {
    tenant_code: 'health-care',
    provider: 'OIDC',
    name: 'Auth0 Enterprise SSO',
    description: 'Auth0 enterprise authentication',
    status: 'ACTIVE',
    client_id: 'healthcareplus_client_id_123',
    client_secret: '***ENCRYPTED***',
    authorization_endpoint: 'https://healthcareplus.auth0.com/authorize',
    token_endpoint: 'https://healthcareplus.auth0.com/oauth/token',
    userinfo_endpoint: 'https://healthcareplus.auth0.com/userinfo',
    jwks_uri: 'https://healthcareplus.auth0.com/.well-known/jwks.json',
    scopes: ['openid', 'profile', 'email', 'roles'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
      nickname: 'nickname',
      picture: 'picture',
      roles: 'https://healthcareplus.com/roles',
    },
    settings: {
      auto_provision: true,
      default_role: 'VIEWER',
      require_mfa: true,
    },
  },
  // VHV Platform - GitHub (for developers)
  {
    tenant_code: 'vhv-platform',
    provider: 'OAUTH2',
    name: 'GitHub OAuth',
    description: 'GitHub OAuth for developer access',
    status: 'ACTIVE',
    client_id: 'Iv1.abc123def456ghi789',
    client_secret: '***ENCRYPTED***',
    authorization_endpoint: 'https://github.com/login/oauth/authorize',
    token_endpoint: 'https://github.com/login/oauth/access_token',
    userinfo_endpoint: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
    attribute_mapping: {
      email: 'email',
      name: 'name',
      login: 'login',
      avatar_url: 'avatar_url',
    },
    settings: {
      auto_provision: false,
      default_role: 'VIEWER',
      require_approval: true,
    },
  },
];

// Demo sessions for users
const DEMO_SESSIONS = [
  // Admin user - Multiple devices
  {
    user_email: 'admin@vhvplatform.com',
    ip_address: '203.162.4.191',
    device_type: 'Desktop',
    device_name: 'MacBook Pro 16"',
    os_name: 'macOS',
    os_version: '14.2',
    browser_name: 'Chrome',
    browser_version: '120.0.6099.129',
    country: 'Vietnam',
    city: 'Ho Chi Minh City',
    status: 'ACTIVE',
    is_current: true,
    login_method: 'PASSWORD',
    mfa_verified: true,
    is_trusted_device: true,
    days_ago: 0,
  },
  {
    user_email: 'admin@vhvplatform.com',
    ip_address: '203.162.5.42',
    device_type: 'Mobile',
    device_name: 'iPhone 15 Pro',
    os_name: 'iOS',
    os_version: '17.2',
    browser_name: 'Safari',
    browser_version: '17.2',
    country: 'Vietnam',
    city: 'Hanoi',
    status: 'ACTIVE',
    is_current: false,
    login_method: 'MFA',
    mfa_verified: true,
    is_trusted_device: true,
    days_ago: 2,
  },
  // John Doe - Work and home
  {
    user_email: 'john.doe@techcorp.com',
    ip_address: '172.56.23.145',
    device_type: 'Desktop',
    device_name: 'Dell XPS 15',
    os_name: 'Windows',
    os_version: '11',
    browser_name: 'Edge',
    browser_version: '120.0.2210.91',
    country: 'United States',
    city: 'San Francisco',
    status: 'ACTIVE',
    is_current: true,
    login_method: 'SSO',
    mfa_verified: true,
    is_trusted_device: true,
    days_ago: 0,
  },
  {
    user_email: 'john.doe@techcorp.com',
    ip_address: '172.56.23.198',
    device_type: 'Tablet',
    device_name: 'iPad Pro',
    os_name: 'iPadOS',
    os_version: '17.2',
    browser_name: 'Safari',
    browser_version: '17.2',
    country: 'United States',
    city: 'San Francisco',
    status: 'ACTIVE',
    is_current: false,
    login_method: 'SSO',
    mfa_verified: true,
    is_trusted_device: false,
    days_ago: 5,
  },
  {
    user_email: 'john.doe@techcorp.com',
    ip_address: '172.56.24.67',
    device_type: 'Mobile',
    device_name: 'Samsung Galaxy S23',
    os_name: 'Android',
    os_version: '14',
    browser_name: 'Chrome',
    browser_version: '120.0.6099.144',
    country: 'United States',
    city: 'Los Angeles',
    status: 'LOGGED_OUT',
    is_current: false,
    login_method: 'PASSWORD',
    mfa_verified: false,
    is_trusted_device: false,
    days_ago: 15,
  },
  // Mike Wilson - Developer sessions
  {
    user_email: 'mike.wilson@techcorp.com',
    ip_address: '172.56.25.89',
    device_type: 'Desktop',
    device_name: 'MacBook Air M2',
    os_name: 'macOS',
    os_version: '14.1',
    browser_name: 'Chrome',
    browser_version: '120.0.6099.129',
    country: 'United States',
    city: 'San Francisco',
    status: 'ACTIVE',
    is_current: true,
    login_method: 'OAUTH',
    mfa_verified: true,
    is_trusted_device: true,
    days_ago: 0,
  },
  {
    user_email: 'mike.wilson@techcorp.com',
    ip_address: '172.56.26.123',
    device_type: 'Desktop',
    device_name: 'Ubuntu Workstation',
    os_name: 'Linux',
    os_version: 'Ubuntu 22.04',
    browser_name: 'Firefox',
    browser_version: '121.0',
    country: 'United States',
    city: 'San Francisco',
    status: 'EXPIRED',
    is_current: false,
    login_method: 'PASSWORD',
    mfa_verified: true,
    is_trusted_device: false,
    days_ago: 45,
  },
  // Emma Brown - Mobile first
  {
    user_email: 'emma.brown@techcorp.com',
    ip_address: '172.56.27.234',
    device_type: 'Mobile',
    device_name: 'iPhone 14',
    os_name: 'iOS',
    os_version: '17.1',
    browser_name: 'Safari',
    browser_version: '17.1',
    country: 'United States',
    city: 'San Francisco',
    status: 'ACTIVE',
    is_current: true,
    login_method: 'BIOMETRIC',
    mfa_verified: true,
    is_trusted_device: true,
    days_ago: 0,
  },
  {
    user_email: 'emma.brown@techcorp.com',
    ip_address: '172.56.28.45',
    device_type: 'Desktop',
    device_name: 'HP Pavilion',
    os_name: 'Windows',
    os_version: '11',
    browser_name: 'Chrome',
    browser_version: '119.0.6045.199',
    country: 'United States',
    city: 'Seattle',
    status: 'REVOKED',
    is_current: false,
    login_method: 'PASSWORD',
    mfa_verified: false,
    is_trusted_device: false,
    days_ago: 30,
  },
  // David Smith - Academic sessions
  {
    user_email: 'david.smith@eduinstitute.edu',
    ip_address: '81.2.69.142',
    device_type: 'Desktop',
    device_name: 'ThinkPad X1 Carbon',
    os_name: 'Windows',
    os_version: '11 Pro',
    browser_name: 'Edge',
    browser_version: '120.0.2210.91',
    country: 'United Kingdom',
    city: 'London',
    status: 'ACTIVE',
    is_current: true,
    login_method: 'SSO',
    mfa_verified: true,
    is_trusted_device: true,
    days_ago: 0,
  },
];

/**
 * POST /seed
 * Seed all demo data
 */
app.post('/seed', async (c: Context) => {
  const supabase = getSupabaseClient();
  const results = {
    tenants: { created: 0, errors: [] as any[] },
    users: { created: 0, errors: [] as any[] },
    tenant_members: { created: 0, errors: [] as any[] },
    linked_identities: { created: 0, errors: [] as any[] },
    mfa_methods: { created: 0, errors: [] as any[] },
    sso_configs: { created: 0, errors: [] as any[] },
    sessions: { created: 0, errors: [] as any[] },
    summary: '',
  };

  try {
    console.log('Starting seed process...');

    // Step 1: Seed Tenants (in order for hierarchy)
    console.log('Seeding tenants...');
    const tenantIdMap = new Map<string, string>();

    for (const tenant of DEMO_TENANTS) {
      try {
        // Check if tenant already exists
        const { data: existing } = await supabase
          .from('tenants')
          .select('_id')
          .eq('code', tenant.code)
          .is('deleted_at', null)
          .single();

        if (existing) {
          console.log(`Tenant ${tenant.code} already exists, skipping...`);
          tenantIdMap.set(tenant.code, existing._id);
          continue;
        }

        const tenantId = crypto.randomUUID();
        
        // Get parent_tenant_id if parent_code exists
        let parent_tenant_id = null;
        if (tenant.parent_code) {
          parent_tenant_id = tenantIdMap.get(tenant.parent_code) || null;
        }

        const { data, error } = await supabase
          .from('tenants')
          .insert({
            _id: tenantId,
            code: tenant.code,
            name: tenant.name,
            type: tenant.type,
            status: tenant.status,
            description: tenant.description || null,
            contact_email: tenant.contact_email || null,
            contact_phone: tenant.contact_phone || null,
            address: tenant.address || null,
            website: tenant.website || null,
            logo_url: tenant.logo_url || null,
            settings: tenant.settings || {},
            parent_tenant_id,
            version: 1,
          })
          .select()
          .single();

        if (error) throw error;

        tenantIdMap.set(tenant.code, tenantId);
        results.tenants.created++;
        console.log(`Created tenant: ${tenant.code}`);
      } catch (err: any) {
        console.error(`Error creating tenant ${tenant.code}:`, err);
        results.tenants.errors.push({ code: tenant.code, error: err.message });
      }
    }

    // Step 2: Seed Users
    console.log('Seeding users...');
    const userIdMap = new Map<string, string>();

    for (const user of DEMO_USERS) {
      try {
        // Check if user already exists
        const { data: existing } = await supabase
          .from('users')
          .select('_id')
          .eq('email', user.email)
          .is('deleted_at', null)
          .single();

        if (existing) {
          console.log(`User ${user.email} already exists, skipping...`);
          userIdMap.set(user.email, existing._id);
          continue;
        }

        const userId = crypto.randomUUID();
        const passwordHash = await hashPassword(user.password);

        const { data, error } = await supabase
          .from('users')
          .insert({
            _id: userId,
            email: user.email,
            password_hash: passwordHash,
            name: user.name,
            avatar: user.avatar || null,
            phone: user.phone || null,
            location: user.location || null,
            department: user.department || null,
            position: user.position || null,
            bio: user.bio || null,
            role: user.role,
            status: user.status,
            email_verified: true, // Auto-verify demo users
            tenant_id: null, // Platform users
            version: 1,
          })
          .select()
          .single();

        if (error) throw error;

        userIdMap.set(user.email, userId);
        results.users.created++;
        console.log(`Created user: ${user.email}`);
      } catch (err: any) {
        console.error(`Error creating user ${user.email}:`, err);
        results.users.errors.push({ email: user.email, error: err.message });
      }
    }

    // Step 3: Seed Tenant Members
    console.log('Seeding tenant members...');
    for (const member of DEMO_TENANT_MEMBERS) {
      try {
        // Check if tenant member already exists
        const { data: existing } = await supabase
          .from('tenant_members')
          .select('_id')
          .eq('user_email', member.user_email)
          .eq('tenant_code', member.tenant_code)
          .is('deleted_at', null)
          .single();

        if (existing) {
          console.log(`Tenant member ${member.user_email} in ${member.tenant_code} already exists, skipping...`);
          continue;
        }

        const memberId = crypto.randomUUID();
        
        // Get tenant_id and user_id
        const tenant_id = tenantIdMap.get(member.tenant_code) || null;
        const user_id = userIdMap.get(member.user_email) || null;

        const { data, error } = await supabase
          .from('tenant_members')
          .insert({
            _id: memberId,
            user_email: member.user_email,
            tenant_code: member.tenant_code,
            role: member.role,
            employee_code: member.employee_code,
            job_title: member.job_title,
            tenant_id,
            user_id,
            version: 1,
          })
          .select()
          .single();

        if (error) throw error;

        results.tenant_members.created++;
        console.log(`Created tenant member: ${member.user_email} in ${member.tenant_code}`);
      } catch (err: any) {
        console.error(`Error creating tenant member ${member.user_email} in ${member.tenant_code}:`, err);
        results.tenant_members.errors.push({ user_email: member.user_email, tenant_code: member.tenant_code, error: err.message });
      }
    }

    // Step 4: Seed Linked Identities
    console.log('Seeding linked identities...');
    for (const identity of DEMO_LINKED_IDENTITIES) {
      try {
        const user_id = userIdMap.get(identity.user_email);
        if (!user_id) {
          console.log(`User ${identity.user_email} not found, skipping linked identity...`);
          continue;
        }

        // Check if linked identity already exists
        const { data: existing } = await supabase
          .from('user_linked_identities')
          .select('_id')
          .eq('user_id', user_id)
          .eq('provider', identity.provider)
          .is('deleted_at', null)
          .single();

        if (existing) {
          console.log(`Linked identity ${identity.provider} for ${identity.user_email} already exists, skipping...`);
          continue;
        }

        const identityId = crypto.randomUUID();
        const now = new Date().toISOString();
        const lastUsed = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('user_linked_identities')
          .insert({
            _id: identityId,
            user_id,
            provider: identity.provider,
            provider_user_id: identity.provider_user_id,
            provider_username: identity.provider_username,
            provider_email: identity.provider_email,
            display_name: identity.display_name,
            avatar_url: identity.avatar_url,
            status: identity.status,
            is_verified: identity.is_verified,
            is_primary: identity.is_primary,
            last_used_at: lastUsed,
            metadata: {},
            version: 1,
          })
          .select()
          .single();

        if (error) {
          // Table might not exist yet
          if (error.code === 'PGRST204' || error.code === '42P01') {
            console.log('⚠️ Table user_linked_identities does not exist. Please create it first.');
            results.linked_identities.errors.push({ 
              user_email: identity.user_email, 
              error: 'Table does not exist' 
            });
            break;
          }
          throw error;
        }

        results.linked_identities.created++;
        console.log(`Created linked identity: ${identity.provider} for ${identity.user_email}`);
      } catch (err: any) {
        console.error(`Error creating linked identity for ${identity.user_email}:`, err);
        results.linked_identities.errors.push({ 
          user_email: identity.user_email, 
          provider: identity.provider,
          error: err.message 
        });
      }
    }

    // Step 5: Seed MFA Methods
    console.log('Seeding MFA methods...');
    for (const mfa of DEMO_MFA_METHODS) {
      try {
        const user_id = userIdMap.get(mfa.user_email);
        if (!user_id) {
          console.log(`User ${mfa.user_email} not found, skipping MFA method...`);
          continue;
        }

        // Check if MFA method already exists
        const { data: existing } = await supabase
          .from('user_mfa_methods')
          .select('_id')
          .eq('user_id', user_id)
          .eq('method_type', mfa.method_type)
          .is('deleted_at', null)
          .maybeSingle();

        if (existing) {
          console.log(`MFA method ${mfa.method_type} for ${mfa.user_email} already exists, skipping...`);
          continue;
        }

        const mfaId = crypto.randomUUID();
        const now = new Date().toISOString();
        const lastUsed = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
        const lastVerified = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('user_mfa_methods')
          .insert({
            _id: mfaId,
            user_id,
            method_type: mfa.method_type,
            method_name: mfa.method_name,
            sms_phone_number: mfa.sms_phone_number || null,
            sms_phone_verified: mfa.sms_phone_verified || false,
            email_address: mfa.email_address || null,
            email_verified: mfa.email_verified || false,
            status: mfa.status,
            is_verified: mfa.is_verified,
            is_primary: mfa.is_primary,
            is_enforced: mfa.is_enforced,
            device_name: mfa.device_name || null,
            device_type: mfa.device_type || null,
            backup_codes_total: mfa.backup_codes_total || null,
            backup_codes_used: mfa.backup_codes_used || 0,
            success_count: mfa.success_count,
            failure_count: mfa.failure_count,
            last_used_at: lastUsed,
            last_verified_at: lastVerified,
            metadata: {},
            version: 1,
          })
          .select()
          .single();

        if (error) {
          // Table might not exist yet
          if (error.code === 'PGRST204' || error.code === '42P01') {
            console.log('⚠️ Table user_mfa_methods does not exist. Please create it first.');
            results.mfa_methods.errors.push({ 
              user_email: mfa.user_email, 
              error: 'Table does not exist' 
            });
            break;
          }
          throw error;
        }

        results.mfa_methods.created++;
        console.log(`Created MFA method: ${mfa.method_type} for ${mfa.user_email}`);
      } catch (err: any) {
        console.error(`Error creating MFA method for ${mfa.user_email}:`, err);
        results.mfa_methods.errors.push({ 
          user_email: mfa.user_email, 
          method_type: mfa.method_type,
          error: err.message 
        });
      }
    }

    // Step 6: Seed SSO Configs
    console.log('Seeding SSO configs...');
    for (const sso of DEMO_SSO_CONFIGS) {
      try {
        const tenant_id = tenantIdMap.get(sso.tenant_code);
        if (!tenant_id) {
          console.log(`Tenant ${sso.tenant_code} not found, skipping SSO config...`);
          continue;
        }

        // Check if SSO config already exists
        const { data: existing } = await supabase
          .from('tenant_sso_configs')
          .select('_id')
          .eq('tenant_id', tenant_id)
          .eq('provider', sso.provider)
          .eq('name', sso.name)
          .is('deleted_at', null)
          .maybeSingle();

        if (existing) {
          console.log(`SSO config ${sso.name} for ${sso.tenant_code} already exists, skipping...`);
          continue;
        }

        const ssoId = crypto.randomUUID();

        const { data, error } = await supabase
          .from('tenant_sso_configs')
          .insert({
            _id: ssoId,
            tenant_id,
            provider: sso.provider,
            name: sso.name,
            description: sso.description,
            status: sso.status,
            entity_id: sso.entity_id || null,
            sso_url: sso.sso_url || null,
            slo_url: sso.slo_url || null,
            certificate: sso.certificate || null,
            metadata_url: sso.metadata_url || null,
            client_id: sso.client_id || null,
            client_secret: sso.client_secret || null,
            authorization_endpoint: sso.authorization_endpoint || null,
            token_endpoint: sso.token_endpoint || null,
            userinfo_endpoint: sso.userinfo_endpoint || null,
            jwks_uri: sso.jwks_uri || null,
            scopes: sso.scopes || [],
            attribute_mapping: sso.attribute_mapping || {},
            settings: sso.settings || {},
            version: 1,
          })
          .select()
          .single();

        if (error) {
          // Table might not exist yet
          if (error.code === 'PGRST204' || error.code === '42P01') {
            console.log('⚠️ Table tenant_sso_configs does not exist. Please create it first.');
            results.sso_configs.errors.push({ 
              tenant_code: sso.tenant_code, 
              error: 'Table does not exist' 
            });
            break;
          }
          throw error;
        }

        results.sso_configs.created++;
        console.log(`Created SSO config: ${sso.name} for ${sso.tenant_code}`);
      } catch (err: any) {
        console.error(`Error creating SSO config for ${sso.tenant_code}:`, err);
        results.sso_configs.errors.push({ 
          tenant_code: sso.tenant_code, 
          name: sso.name,
          error: err.message 
        });
      }
    }

    // Step 7: Seed Sessions
    console.log('Seeding sessions...');
    for (const session of DEMO_SESSIONS) {
      try {
        const user_id = userIdMap.get(session.user_email);
        if (!user_id) {
          console.log(`User ${session.user_email} not found, skipping session...`);
          continue;
        }

        // Check if session already exists (simpler check)
        const { data: existing } = await supabase
          .from('user_sessions')
          .select('_id')
          .eq('user_id', user_id)
          .eq('device_name', session.device_name)
          .is('deleted_at', null)
          .maybeSingle();

        if (existing) {
          console.log(`Session for ${session.user_email} on ${session.device_name} already exists, skipping...`);
          continue;
        }

        const sessionId = crypto.randomUUID();
        const sessionToken = `sess_${crypto.randomUUID()}_${Date.now()}`;
        const now = new Date();
        const daysAgo = session.days_ago || 0;
        const loginAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        const lastActivityAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 60 * 60 * 1000).toISOString();
        const expiresAt = new Date(now.getTime() + (30 - daysAgo) * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('user_sessions')
          .insert({
            _id: sessionId,
            user_id,
            session_token: sessionToken,
            ip_address: session.ip_address,
            user_agent: `${session.browser_name}/${session.browser_version} (${session.os_name} ${session.os_version})`,
            device_type: session.device_type,
            device_name: session.device_name,
            os_name: session.os_name,
            os_version: session.os_version,
            browser_name: session.browser_name,
            browser_version: session.browser_version,
            country: session.country,
            city: session.city,
            status: session.status,
            is_current: session.is_current,
            login_at: loginAt,
            last_activity_at: lastActivityAt,
            expires_at: expiresAt,
            logout_at: session.status === 'LOGGED_OUT' ? lastActivityAt : null,
            login_method: session.login_method,
            mfa_verified: session.mfa_verified,
            is_trusted_device: session.is_trusted_device,
            metadata: {},
            version: 1,
          })
          .select()
          .single();

        if (error) {
          // Table might not exist yet
          if (error.code === 'PGRST204' || error.code === '42P01') {
            console.log('⚠️ Table user_sessions does not exist. Please create it first.');
            results.sessions.errors.push({ 
              user_email: session.user_email, 
              error: 'Table does not exist' 
            });
            break;
          }
          throw error;
        }

        results.sessions.created++;
        console.log(`Created session: ${session.user_email} on ${session.device_name}`);
      } catch (err: any) {
        console.error(`Error creating session for ${session.user_email}:`, err);
        results.sessions.errors.push({ 
          user_email: session.user_email, 
          error: err.message 
        });
      }
    }

    results.summary = `Successfully seeded ${results.tenants.created} tenants, ${results.users.created} users, ${results.tenant_members.created} tenant members, ${results.linked_identities.created} linked identities, ${results.mfa_methods.created} MFA methods, ${results.sso_configs.created} SSO configs, and ${results.sessions.created} sessions`;
    
    return c.json({
      success: true,
      message: 'Demo data seeded successfully',
      results,
    });
  } catch (error: any) {
    console.error('Seed process failed:', error);
    return c.json({
      success: false,
      error: error.message,
      results,
    }, 500);
  }
});

/**
 * DELETE /seed
 * Clear all demo data
 */
app.delete('/seed', async (c: Context) => {
  const supabase = getSupabaseClient();
  
  try {
    console.log('Clearing demo data...');

    // Delete demo users (by email pattern)
    const demoUserEmails = DEMO_USERS.map(u => u.email);
    
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .in('email', demoUserEmails);
    
    if (usersError) throw usersError;

    // Delete demo tenants (by code)
    const demoTenantCodes = DEMO_TENANTS.map(t => t.code);
    
    const { error: tenantsError } = await supabase
      .from('tenants')
      .delete()
      .in('code', demoTenantCodes);
    
    if (tenantsError) throw tenantsError;

    return c.json({
      success: true,
      message: 'Demo data cleared successfully',
    });
  } catch (error: any) {
    console.error('Clear demo data failed:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

/**
 * GET /seed/status
 * Check seed data status
 */
app.get('/seed/status', async (c: Context) => {
  const supabase = getSupabaseClient();
  
  try {
    // Count existing demo data
    const { count: tenantsCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .in('code', DEMO_TENANTS.map(t => t.code));

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('email', DEMO_USERS.map(u => u.email));

    return c.json({
      status: {
        tenants: {
          existing: tenantsCount || 0,
          expected: DEMO_TENANTS.length,
          seeded: (tenantsCount || 0) > 0,
        },
        users: {
          existing: usersCount || 0,
          expected: DEMO_USERS.length,
          seeded: (usersCount || 0) > 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Check status failed:', error);
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});

export default app;