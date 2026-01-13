/**
 * Tenants Data Layer
 * 
 * Multi-tenancy data structures for SaaS platform
 * Aligned with go-framework database schema from DatabaseCommand.md
 */

// Base types matching YugabyteDB schema
export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type TenantTier = 
  | 'FREE' | 'PRO' | 'ENTERPRISE'  // Customer tiers
  | 'PARTNER_BASIC' | 'PARTNER_PREMIUM' | 'PARTNER_ELITE'  // Partner tiers
  | 'PROVIDER';  // Platform owner
export type BillingType = 'PREPAID' | 'POSTPAID';
export type DataRegion = 'ap-southeast-1' | 'us-east-1' | 'eu-central-1';
export type ComplianceLevel = 'STANDARD' | 'GDPR' | 'HIPAA' | 'PCI-DSS';

// JSONB Profile structure
export interface TenantProfile {
  billing_email?: string;
  phone?: string;
  domain?: string;
  contact_person?: string;
  industry?: string;
  company_size?: string;
  country?: string;
  address?: string;
  tax_id?: string;
  logo_url?: string;
  website?: string;
}

// JSONB Settings structure
export interface TenantSettings {
  max_users: number;
  max_storage: number;  // in GB
  current_users: number;
  current_storage: number;  // in GB
  mfa_enforced: boolean;
  sso_enabled: boolean;
  custom_branding: boolean;
  api_access: boolean;
  subscription_end_date?: string;
  features: string[];
  allowed_domains?: string[];
  ip_whitelist?: string[];
}

// Main Tenant interface matching DatabaseCommand.md schema
export interface Tenant {
  // I. IDENTITY & INFRASTRUCTURE
  _id: string;  // UUID PRIMARY KEY
  code: string;  // VARCHAR(64) NOT NULL, slug format
  data_region: DataRegion;
  compliance_level: ComplianceLevel;
  parent_tenant_id: string | null;  // UUID for hierarchical structure
  path?: string;  // Materialized path: /parent_id/child_id/
  
  // II. BUSINESS INFORMATION & LOCALIZATION
  name: string;  // TEXT NOT NULL
  tier: TenantTier;
  billing_type: BillingType;
  timezone: string;  // VARCHAR(50)
  
  // III. DYNAMIC DATA (JSONB)
  profile: TenantProfile;
  settings: TenantSettings;
  
  // IV. STATUS & AUDIT TRAIL
  status: TenantStatus;
  created_at: string;  // TIMESTAMPTZ
  updated_at: string;  // TIMESTAMPTZ
  deleted_at?: string | null;  // TIMESTAMPTZ
  created_by?: string | null;  // UUID (from migration 007)
  updated_by?: string | null;  // UUID (from migration 007)
  deleted_by?: string | null;  // UUID (from migration 007)
  version: number;  // BIGINT for optimistic locking
}

// Helper type for creating new tenant
export type CreateTenantInput = Omit<Tenant, '_id' | 'created_at' | 'updated_at' | 'version' | 'path'> & {
  _id?: string;
};

// Helper type for updating tenant
export type UpdateTenantInput = Partial<Omit<Tenant, '_id' | 'created_at' | 'version'>> & {
  _id: string;
  version: number;  // Required for optimistic locking
};

// Legacy compatibility types (deprecated)
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

// Re-export for backward compatibility (deprecated - use utils/tenant-utils instead)
export { tenantStatusColors, tenantTierColors as subscriptionTierColors } from '../utils/tenant-utils';

// Validation functions
export const validateTenantCode = (code: string): boolean => {
  return /^[a-z0-9-]+$/.test(code);
};

export const validateTenantTier = (tier: string): tier is TenantTier => {
  return ['FREE', 'PRO', 'ENTERPRISE', 'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE', 'PROVIDER'].includes(tier);
};

export const validateTenantStatus = (status: string): status is TenantStatus => {
  return ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'].includes(status);
};

export const validateDataRegion = (region: string): region is DataRegion => {
  return ['ap-southeast-1', 'us-east-1', 'eu-central-1'].includes(region);
};

export const validateComplianceLevel = (level: string): level is ComplianceLevel => {
  return ['STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS'].includes(level);
};

// Utility functions
export const getTenantHierarchyDepth = (tenant: Tenant): number => {
  if (!tenant.path) return 0;
  return (tenant.path.match(/\//g) || []).length - 1;
};

export const isRootTenant = (tenant: Tenant): boolean => {
  return tenant.parent_tenant_id === null;
};

export const getParentPath = (tenant: Tenant): string | null => {
  if (!tenant.path || isRootTenant(tenant)) return null;
  const parts = tenant.path.split('/').filter(Boolean);
  parts.pop(); // Remove current tenant ID
  return parts.length > 0 ? `/${parts.join('/')}/` : null;
};

// Mock data for development
export const mockTenants: Tenant[] = [
  {
    _id: '018d1234-5678-7abc-def0-123456789001',
    code: 'acme-corp',
    data_region: 'us-east-1',
    compliance_level: 'STANDARD',
    parent_tenant_id: null,
    path: '/018d1234-5678-7abc-def0-123456789001/',
    name: 'Acme Corporation',
    tier: 'ENTERPRISE',
    billing_type: 'POSTPAID',
    timezone: 'America/Los_Angeles',
    profile: {
      billing_email: 'billing@acme.com',
      phone: '+1-555-0100',
      domain: 'acme.example.com',
      contact_person: 'John Doe',
      industry: 'Technology',
      company_size: '100-500',
      country: 'USA',
      address: '123 Tech Street, San Francisco, CA 94105',
      tax_id: 'US-123456789',
    },
    settings: {
      max_users: 100,
      max_storage: 500,
      current_users: 78,
      current_storage: 342,
      mfa_enforced: true,
      sso_enabled: true,
      custom_branding: true,
      api_access: true,
      subscription_end_date: '2024-12-31',
      features: ['sso', 'api_access', 'custom_domain', 'priority_support', 'advanced_analytics'],
    },
    status: 'ACTIVE',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-08T10:30:00Z',
    version: 1,
  },
  {
    _id: '018d1234-5678-7abc-def0-123456789002',
    code: 'techstart',
    data_region: 'us-east-1',
    compliance_level: 'STANDARD',
    parent_tenant_id: null,
    path: '/018d1234-5678-7abc-def0-123456789002/',
    name: 'TechStart Inc',
    tier: 'PRO',
    billing_type: 'POSTPAID',
    timezone: 'America/New_York',
    profile: {
      billing_email: 'finance@techstart.io',
      phone: '+1-555-0200',
      domain: 'techstart.example.com',
      contact_person: 'Jane Smith',
      industry: 'Software',
      company_size: '50-100',
      country: 'USA',
    },
    settings: {
      max_users: 50,
      max_storage: 200,
      current_users: 32,
      current_storage: 145,
      mfa_enforced: false,
      sso_enabled: false,
      custom_branding: true,
      api_access: true,
      subscription_end_date: '2025-02-14',
      features: ['api_access', 'custom_branding', 'analytics'],
    },
    status: 'ACTIVE',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-01-08T09:15:00Z',
    version: 1,
  },
  {
    _id: '018d1234-5678-7abc-def0-123456789003',
    code: 'digital-solutions',
    data_region: 'eu-central-1',
    compliance_level: 'GDPR',
    parent_tenant_id: null,
    path: '/018d1234-5678-7abc-def0-123456789003/',
    name: 'Digital Solutions',
    tier: 'FREE',
    billing_type: 'PREPAID',
    timezone: 'Europe/London',
    profile: {
      billing_email: 'admin@digitalsol.com',
      phone: '+44-20-1234-5678',
      contact_person: 'Mike Johnson',
      industry: 'Consulting',
      company_size: '10-50',
      country: 'UK',
    },
    settings: {
      max_users: 10,
      max_storage: 50,
      current_users: 5,
      current_storage: 12,
      mfa_enforced: false,
      sso_enabled: false,
      custom_branding: false,
      api_access: false,
      subscription_end_date: '2024-12-31',
      features: ['basic_support'],
    },
    status: 'TRIAL',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
    version: 1,
  },
  {
    _id: '018d1234-5678-7abc-def0-123456789004',
    code: 'global-retail',
    data_region: 'us-east-1',
    compliance_level: 'PCI-DSS',
    parent_tenant_id: null,
    path: '/018d1234-5678-7abc-def0-123456789004/',
    name: 'Global Retail Co',
    tier: 'ENTERPRISE',
    billing_type: 'POSTPAID',
    timezone: 'America/Chicago',
    profile: {
      billing_email: 'billing@globalretail.com',
      phone: '+1-555-0300',
      domain: 'retail.example.com',
      contact_person: 'Sarah Williams',
      industry: 'Retail',
      company_size: '500+',
      country: 'USA',
      tax_id: 'US-987654321',
    },
    settings: {
      max_users: 200,
      max_storage: 1000,
      current_users: 156,
      current_storage: 687,
      mfa_enforced: true,
      sso_enabled: true,
      custom_branding: true,
      api_access: true,
      subscription_end_date: '2025-05-31',
      features: ['sso', 'api_access', 'custom_domain', 'priority_support', 'advanced_analytics', 'white_label'],
    },
    status: 'ACTIVE',
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2024-01-07T14:20:00Z',
    version: 1,
  },
];