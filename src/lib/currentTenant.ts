/**
 * Current Tenant Library
 * 
 * Thư viện để truy xuất và quản lý thông tin tenant hiện tại
 * Features:
 * - Get current tenant from database
 * - Cache tenant data for performance
 */

import { supabase } from './supabase';

// Hardcoded tenant ID for now
const CURRENT_TENANT_ID = '078e19ae-af67-4452-9ccd-10e27acb2dfe';

export type TenantTier = 
  | 'FREE' 
  | 'PRO' 
  | 'ENTERPRISE' 
  | 'PARTNER_BASIC' 
  | 'PARTNER_PREMIUM' 
  | 'PARTNER_ELITE' 
  | 'PROVIDER';

export type TenantStatus = 
  | 'TRIAL' 
  | 'ACTIVE' 
  | 'SUSPENDED' 
  | 'CANCELLED';

export type BillingType = 
  | 'PREPAID' 
  | 'POSTPAID';

export type ComplianceLevel = 
  | 'STANDARD' 
  | 'GDPR' 
  | 'HIPAA' 
  | 'PCI-DSS';

export type DataRegion = 
  | 'ap-southeast-1' 
  | 'us-east-1' 
  | 'eu-central-1';

export interface Tenant {
  _id: string;
  code: string;
  name: string;
  parent_tenant_id?: string | null;
  path?: string | null;
  tier: TenantTier;
  status: TenantStatus;
  data_region: DataRegion;
  compliance_level: ComplianceLevel;
  timezone: string;
  billing_type: BillingType;
  profile: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version: number;
  partner_tenant_id?: string | null;
}

// In-memory cache
let tenantCache: Tenant | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current tenant from database
 * Temporarily returns hardcoded tenant by ID
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  try {
    // Check cache first
    const now = Date.now();
    if (tenantCache && (now - lastFetchTime) < CACHE_DURATION) {
      return tenantCache;
    }

    // Fetch from database
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('_id', CURRENT_TENANT_ID)
      .single();
    
    if (error) {
      console.error('Error getting current tenant:', error);
      return null;
    }
    
    if (!tenant) {
      console.warn('Tenant not found:', CURRENT_TENANT_ID);
      return null;
    }

    // Update cache
    tenantCache = tenant;
    lastFetchTime = now;
    
    return tenant;
  } catch (error) {
    console.error('Error in getCurrentTenant:', error);
    return null;
  }
}

/**
 * Clear tenant cache
 * Useful when tenant data is updated
 */
export function clearTenantCache() {
  tenantCache = null;
  lastFetchTime = 0;
}

/**
 * Get tenant name
 */
export function getTenantName(tenant: Tenant | null): string {
  if (!tenant) return 'Unknown Tenant';
  return tenant.name;
}

/**
 * Get tenant display code
 */
export function getTenantCode(tenant: Tenant | null): string {
  if (!tenant) return 'unknown';
  return tenant.code;
}

/**
 * Get tenant tier label in Vietnamese
 */
export function getTenantTierLabel(tier: TenantTier): string {
  const labels: Record<TenantTier, string> = {
    FREE: 'Miễn phí',
    PRO: 'Chuyên nghiệp',
    ENTERPRISE: 'Doanh nghiệp',
    PARTNER_BASIC: 'Đối tác Cơ bản',
    PARTNER_PREMIUM: 'Đối tác Cao cấp',
    PARTNER_ELITE: 'Đối tác Ưu tú',
    PROVIDER: 'Nhà cung cấp',
  };
  return labels[tier] || tier;
}

/**
 * Get tenant status label in Vietnamese
 */
export function getTenantStatusLabel(status: TenantStatus): string {
  const labels: Record<TenantStatus, string> = {
    TRIAL: 'Dùng thử',
    ACTIVE: 'Hoạt động',
    SUSPENDED: 'Tạm ngưng',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] || status;
}

/**
 * Check if tenant is active
 */
export function isTenantActive(tenant: Tenant | null): boolean {
  if (!tenant) return false;
  return tenant.status === 'ACTIVE' || tenant.status === 'TRIAL';
}

/**
 * Get tenant setting by key
 */
export function getTenantSetting<T = any>(
  tenant: Tenant | null, 
  key: string, 
  defaultValue?: T
): T | undefined {
  if (!tenant) return defaultValue;
  return tenant.settings?.[key] ?? defaultValue;
}

/**
 * Get tenant profile by key
 */
export function getTenantProfile<T = any>(
  tenant: Tenant | null, 
  key: string, 
  defaultValue?: T
): T | undefined {
  if (!tenant) return defaultValue;
  return tenant.profile?.[key] ?? defaultValue;
}
