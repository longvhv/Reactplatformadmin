/**
 * Tenant Constants
 * Centralized constants for tenant management
 */

import type { TenantStatus, TenantTier, DataRegion, ComplianceLevel, BillingType } from '../data/tenants';

// Default tenant ID (UUID của default tenant trong database)
export const DEFAULT_TENANT_ID = '078e19ae-af67-4452-9ccd-10e27acb2dfe';

// Status values
export const TENANT_STATUSES: readonly TenantStatus[] = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'] as const;

// Tier values
export const TENANT_TIERS: readonly TenantTier[] = [
  'FREE',
  'PRO',
  'ENTERPRISE',
  'PARTNER_BASIC',
  'PARTNER_PREMIUM',
  'PARTNER_ELITE',
  'PROVIDER'
] as const;

// Data regions
export const DATA_REGIONS: readonly DataRegion[] = [
  'ap-southeast-1',
  'us-east-1',
  'eu-central-1'
] as const;

// Compliance levels
export const COMPLIANCE_LEVELS: readonly ComplianceLevel[] = [
  'STANDARD',
  'GDPR',
  'HIPAA',
  'PCI-DSS'
] as const;

// Billing types
export const BILLING_TYPES: readonly BillingType[] = ['PREPAID', 'POSTPAID'] as const;

// Timezones
export const TIMEZONES: readonly string[] = [
  'UTC',
  'Asia/Ho_Chi_Minh',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney'
] as const;

// Default values
export const DEFAULTS = {
  TIER: 'FREE' as TenantTier,
  STATUS: 'TRIAL' as TenantStatus,
  DATA_REGION: 'ap-southeast-1' as DataRegion,
  COMPLIANCE_LEVEL: 'STANDARD' as ComplianceLevel,
  BILLING_TYPE: 'POSTPAID' as BillingType,
  TIMEZONE: 'UTC',
  MAX_USERS: 10,
  MAX_STORAGE_GB: 5,
  VERSION: 1,
} as const;

// Validation patterns
export const PATTERNS = {
  CODE: /^[a-z0-9-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[0-9\s-()]+$/,
} as const;

// Length constraints
export const LENGTH = {
  CODE_MIN: 3,
  CODE_MAX: 64,
  NAME_MIN: 2,
  NAME_MAX: 255,
  DOMAIN_MAX: 255,
  EMAIL_MAX: 255,
  PHONE_MAX: 20,
} as const;

// Resource limits by tier
export const TIER_LIMITS = {
  FREE: {
    max_users: 10,
    max_storage_gb: 5,
    api_rate_limit: 100,
  },
  PRO: {
    max_users: 100,
    max_storage_gb: 50,
    api_rate_limit: 1000,
  },
  ENTERPRISE: {
    max_users: -1, // unlimited
    max_storage_gb: 500,
    api_rate_limit: 10000,
  },
  PARTNER_BASIC: {
    max_users: 50,
    max_storage_gb: 25,
    api_rate_limit: 500,
  },
  PARTNER_PREMIUM: {
    max_users: 200,
    max_storage_gb: 100,
    api_rate_limit: 2000,
  },
  PARTNER_ELITE: {
    max_users: -1, // unlimited
    max_storage_gb: 1000,
    api_rate_limit: 20000,
  },
  PROVIDER: {
    max_users: -1, // unlimited
    max_storage_gb: -1, // unlimited
    api_rate_limit: 50000,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  CODE_REQUIRED: 'Tenant code is required',
  CODE_INVALID: 'Tenant code must contain only lowercase letters, numbers, and hyphens',
  CODE_TOO_SHORT: `Tenant code must be at least ${LENGTH.CODE_MIN} characters`,
  CODE_TOO_LONG: `Tenant code must not exceed ${LENGTH.CODE_MAX} characters`,
  CODE_EXISTS: 'Tenant code already exists',
  
  NAME_REQUIRED: 'Tenant name is required',
  NAME_TOO_SHORT: `Tenant name must be at least ${LENGTH.NAME_MIN} characters`,
  NAME_TOO_LONG: `Tenant name must not exceed ${LENGTH.NAME_MAX} characters`,
  
  EMAIL_REQUIRED: 'Billing email is required',
  EMAIL_INVALID: 'Invalid email format',
  
  STATUS_INVALID: `Status must be one of: ${TENANT_STATUSES.join(', ')}`,
  TIER_INVALID: `Tier must be one of: ${TENANT_TIERS.join(', ')}`,
  REGION_INVALID: `Data region must be one of: ${DATA_REGIONS.join(', ')}`,
  COMPLIANCE_INVALID: `Compliance level must be one of: ${COMPLIANCE_LEVELS.join(', ')}`,
  BILLING_INVALID: `Billing type must be one of: ${BILLING_TYPES.join(', ')}`,
  
  PARENT_NOT_FOUND: 'Parent tenant not found',
  PARENT_CIRCULAR: 'Circular parent reference detected',
  
  VERSION_CONFLICT: 'Version conflict: record was modified by another user',
  NOT_FOUND: 'Tenant not found',
  UNAUTHORIZED: 'Unauthorized',
} as const;