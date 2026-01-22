/**
 * Tenant Utilities
 * Helper functions for tenant management
 */

import type { Tenant, TenantStatus, TenantTier, DataRegion, ComplianceLevel } from '../data/tenants';

// Color mappings matching new schema
export const tenantStatusColors: Record<TenantStatus, string> = {
  TRIAL: 'bg-blue-500 text-white',
  ACTIVE: 'bg-emerald-500 text-white',
  SUSPENDED: 'bg-orange-500 text-white',
  CANCELLED: 'bg-red-500 text-white',
};

export const tenantTierColors: Record<TenantTier, string> = {
  FREE: 'bg-gray-500 text-white',
  PRO: 'bg-indigo-600 text-white',
  ENTERPRISE: 'bg-purple-600 text-white',
  PARTNER_BASIC: 'bg-cyan-500 text-white',
  PARTNER_PREMIUM: 'bg-teal-600 text-white',
  PARTNER_ELITE: 'bg-emerald-700 text-white',
  PROVIDER: 'bg-violet-700 text-white',
};

export const complianceLevelColors: Record<ComplianceLevel, string> = {
  STANDARD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  GDPR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  HIPAA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'PCI-DSS': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export const dataRegionColors: Record<DataRegion, string> = {
  'ap-southeast-1': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'us-east-1': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'eu-central-1': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
};

export const billingTypeColors: Record<string, string> = {
  PREPAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  POSTPAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

// Region names
export const dataRegionNames: Record<DataRegion, string> = {
  'ap-southeast-1': '🌏 Singapore',
  'us-east-1': '🇺🇸 Virginia',
  'eu-central-1': '🇪🇺 Frankfurt',
};

// Tier names
export const tierNames: Record<TenantTier, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
  PARTNER_BASIC: 'Partner Basic',
  PARTNER_PREMIUM: 'Partner Premium',
  PARTNER_ELITE: 'Partner Elite',
  PROVIDER: 'Provider',
};

// Status names
export const statusNames: Record<TenantStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
};

/**
 * Get hierarchy depth from materialized path
 */
export const getHierarchyDepth = (tenant: Tenant): number => {
  if (!tenant.path) return 0;
  return (tenant.path.match(/\//g) || []).length - 1;
};

/**
 * Check if tenant is root (no parent)
 */
export const isRootTenant = (tenant: Tenant): boolean => {
  return tenant.parent_tenant_id === null;
};

/**
 * Check if tenant is partner tier
 */
export const isPartnerTenant = (tenant: Tenant): boolean => {
  return tenant.tier.startsWith('PARTNER_');
};

/**
 * Format date relative to now
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

/**
 * Format storage size
 */
export const formatStorage = (gb: number): string => {
  if (gb < 1) return `${Math.round(gb * 1024)} MB`;
  if (gb < 1024) return `${gb.toFixed(1)} GB`;
  return `${(gb / 1024).toFixed(1)} TB`;
};

/**
 * Calculate usage percentage
 */
export const calculateUsagePercentage = (current: number, max: number): number => {
  if (max === 0) return 0;
  return Math.min(Math.round((current / max) * 100), 100);
};

/**
 * Get usage color based on percentage
 */
export const getUsageColor = (percentage: number): string => {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 70) return 'text-orange-600';
  return 'text-emerald-600';
};

/**
 * Get usage bar color based on percentage
 */
export const getUsageBarColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-orange-500';
  return 'bg-emerald-500';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate tenant code format (lowercase alphanumeric with hyphens)
 */
export const isValidTenantCode = (code: string): boolean => {
  return /^[a-z0-9-]+$/.test(code);
};

/**
 * Generate slug from name
 */
export const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Check if subscription is expiring soon (within 30 days)
 */
export const isSubscriptionExpiringSoon = (tenant: Tenant): boolean => {
  if (!tenant.settings?.subscription_end_date) return false;
  
  const endDate = new Date(tenant.settings.subscription_end_date);
  const now = new Date();
  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
  
  return diffDays <= 30 && diffDays > 0;
};

/**
 * Check if subscription is expired
 */
export const isSubscriptionExpired = (tenant: Tenant): boolean => {
  if (!tenant.settings?.subscription_end_date) return false;
  
  const endDate = new Date(tenant.settings.subscription_end_date);
  const now = new Date();
  
  return endDate < now;
};

/**
 * Get feature list display
 */
export const getFeatureDisplayNames = (features: string[]): string[] => {
  const featureMap: Record<string, string> = {
    sso: 'Single Sign-On',
    api_access: 'API Access',
    custom_domain: 'Custom Domain',
    custom_branding: 'Custom Branding',
    priority_support: 'Priority Support',
    advanced_analytics: 'Advanced Analytics',
    white_label: 'White Label',
    partner_portal: 'Partner Portal',
    revenue_sharing: 'Revenue Sharing',
    basic_support: 'Basic Support',
    analytics: 'Analytics',
  };
  
  return features.map(f => featureMap[f] || f);
};