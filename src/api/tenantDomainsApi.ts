/**
 * Tenant Domains API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Manages domain verification and policies for tenants
 * 
 * CRITICAL: Fully aligned with tenant_domains database schema
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type VerificationStatus = 'PENDING' | 'VERIFIED';
export type VerificationMethod = 'DNS_TXT' | 'HTML_FILE';
export type DomainPolicy = 'NONE' | 'CAPTURE' | 'ENFORCE_SSO';

export const VerificationStatusHelper = {
  PENDING: 'PENDING' as VerificationStatus,
  VERIFIED: 'VERIFIED' as VerificationStatus,

  isPending: (status: VerificationStatus) => status === 'PENDING',
  isVerified: (status: VerificationStatus) => status === 'VERIFIED',
};

export const VerificationMethodHelper = {
  DNS_TXT: 'DNS_TXT' as VerificationMethod,
  HTML_FILE: 'HTML_FILE' as VerificationMethod,

  isDNS: (method: VerificationMethod) => method === 'DNS_TXT',
  isHTML: (method: VerificationMethod) => method === 'HTML_FILE',
};

export const DomainPolicyHelper = {
  NONE: 'NONE' as DomainPolicy,
  CAPTURE: 'CAPTURE' as DomainPolicy,
  ENFORCE_SSO: 'ENFORCE_SSO' as DomainPolicy,

  hasPolicy: (policy: DomainPolicy) => policy !== 'NONE',
  requiresSSO: (policy: DomainPolicy) => policy === 'ENFORCE_SSO',
  capturesEmails: (policy: DomainPolicy) => policy === 'CAPTURE' || policy === 'ENFORCE_SSO',
};

// ==================== MAIN INTERFACE ====================

export interface TenantDomain {
  // I. IDENTITY & RELATIONSHIPS
  _id: string;
  tenant_id: string;

  // II. DOMAIN INFORMATION
  domain: string; // varchar(255), unique, format: ^[a-z0-9.-]+$

  // III. VERIFICATION
  verification_status: VerificationStatus;
  verification_method: VerificationMethod | null;
  verification_token: string | null; // varchar(100)
  verified_at: string | null;

  // IV. POLICY
  policy: DomainPolicy;

  // V. AUDIT TRAIL
  created_at: string;
}

export interface DomainWithDetails extends TenantDomain {
  tenant_name?: string;
  days_verified?: number | null;
  is_recently_verified?: boolean; // Within 7 days
}

// ==================== REQUEST INTERFACES ====================

export interface CreateDomainRequest {
  // Required
  tenant_id: string;
  domain: string;

  // Optional with defaults
  verification_status?: VerificationStatus; // default: 'PENDING'
  verification_method?: VerificationMethod; // default: 'DNS_TXT'
  policy?: DomainPolicy; // default: 'NONE'

  // Optional (will be generated if not provided)
  verification_token?: string;
}

export interface UpdateDomainRequest {
  domain?: string;
  verification_method?: VerificationMethod;
  policy?: DomainPolicy;
  // Note: verification_status, verification_token, verified_at are updated via specific methods
}

export interface DomainFilters extends BaseFilters {
  tenant_id?: string;
  verification_status?: VerificationStatus;
  verification_method?: VerificationMethod;
  policy?: DomainPolicy;
  search?: string; // Search in domain name
}

// ==================== VERIFICATION ====================

export interface VerificationInstructions {
  method: VerificationMethod;
  instructions: string;
  recordName?: string;
  recordValue?: string;
  filePath?: string;
  fileContent?: string;
}

export interface VerifyDomainResult {
  success: boolean;
  message: string;
  domain?: TenantDomain;
}

// ==================== STATISTICS ====================

export interface DomainStatistics {
  total_domains: number;
  verified_domains: number;
  pending_domains: number;
  by_policy: Record<DomainPolicy, number>;
  by_method: Record<VerificationMethod, number>;
  recently_verified: number; // Within 7 days
  avg_days_to_verify: number | null;
}

// ==================== VALIDATION RESULT ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantDomain, CreateDomainRequest, UpdateDomainRequest>(
  'tenant_domains',
  '/tenant-domains',
  false // No soft delete
);

// ==================== API CLIENT ====================

export const tenantDomainsApi = {
  /**
   * GET /tenant-domains
   * Fetch domains with filters
   */
  getAll: async (filters?: DomainFilters): Promise<TenantDomain[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_domains')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.verification_status) {
      query = query.eq('verification_status', filters.verification_status);
    }
    if (filters?.verification_method) {
      query = query.eq('verification_method', filters.verification_method);
    }
    if (filters?.policy) {
      query = query.eq('policy', filters.policy);
    }
    if (filters?.search) {
      query = query.ilike('domain', `%${filters.search}%`);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tenant domains: ${error.message}`);
    }

    return data || [];
  },

  /**
   * GET /tenant-domains/:id
   */
  getById: async (id: string): Promise<TenantDomain> => {
    return adapter.getById(id);
  },

  /**
   * GET /tenant-domains/:id/details
   * Get domain with additional details
   */
  getByIdWithDetails: async (id: string): Promise<DomainWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get domain
    const { data: domain, error: domainError } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('_id', id)
      .single();

    if (domainError || !domain) {
      throw new Error(`Domain not found: ${domainError?.message || 'Unknown error'}`);
    }

    // Get tenant name
    let tenant_name: string | undefined;
    if (domain.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('_id', domain.tenant_id)
        .single();
      tenant_name = tenant?.name;
    }

    const days_verified = getDaysVerified(domain);
    const is_recently_verified = isRecentlyVerified(domain);

    return {
      ...domain,
      tenant_name,
      days_verified,
      is_recently_verified,
    } as DomainWithDetails;
  },

  /**
   * GET /tenant-domains/by-domain/:domain
   * Get domain by domain name
   */
  getByDomain: async (domain: string): Promise<TenantDomain | null> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const normalizedDomain = normalizeDomain(domain);

    const { data, error } = await supabase
      .from('tenant_domains')
      .select('*')
      .eq('domain', normalizedDomain)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows
      throw new Error(`Failed to get domain: ${error.message}`);
    }

    return data || null;
  },

  /**
   * POST /tenant-domains
   * Create new domain with validation and defaults
   */
  create: async (data: CreateDomainRequest): Promise<TenantDomain> => {
    // Normalize domain
    const normalizedDomain = normalizeDomain(data.domain);

    // Validate
    const validation = tenantDomainsApi.validate({
      ...data,
      domain: normalizedDomain,
    });
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for existing domain
    const existing = await tenantDomainsApi.getByDomain(normalizedDomain);
    if (existing) {
      throw new Error(`Domain already exists: ${normalizedDomain}`);
    }

    // Generate verification token if not provided
    const verification_token = data.verification_token || generateVerificationToken();

    // Apply defaults
    const requestData = {
      ...data,
      domain: normalizedDomain,
      verification_status: 'PENDING' as VerificationStatus, // default
      verification_method: data.verification_method || 'DNS_TXT' as VerificationMethod, // default
      policy: data.policy || 'NONE' as DomainPolicy, // default
      verification_token,
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-domains/:id
   * Update domain with validation
   */
  update: async (id: string, data: UpdateDomainRequest): Promise<TenantDomain> => {
    // Get current domain
    const current = await tenantDomainsApi.getById(id);

    // If domain is being changed, normalize and validate
    let updateData = { ...data };
    if (data.domain) {
      const normalizedDomain = normalizeDomain(data.domain);

      // Validate
      const validation = tenantDomainsApi.validate({ domain: normalizedDomain });
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if new domain already exists (excluding current domain)
      if (normalizedDomain !== current.domain) {
        const existing = await tenantDomainsApi.getByDomain(normalizedDomain);
        if (existing && existing._id !== id) {
          throw new Error(`Domain already exists: ${normalizedDomain}`);
        }

        // If domain changes, reset verification
        updateData = {
          ...updateData,
          domain: normalizedDomain,
          verification_status: 'PENDING' as VerificationStatus,
          verification_token: generateVerificationToken(),
          verified_at: null,
        };
      } else {
        updateData.domain = normalizedDomain;
      }
    }

    return adapter.update(id, updateData as any);
  },

  /**
   * DELETE /tenant-domains/:id
   * Hard delete domain
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /tenant-domains/by-tenant/:tenantId
   * Get all domains for tenant
   */
  getByTenant: async (tenantId: string): Promise<TenantDomain[]> => {
    return tenantDomainsApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-domains/verified/:tenantId
   * Get verified domains for tenant
   */
  getVerifiedDomains: async (tenantId: string): Promise<TenantDomain[]> => {
    return tenantDomainsApi.getAll({
      tenant_id: tenantId,
      verification_status: 'VERIFIED',
    });
  },

  /**
   * GET /tenant-domains/pending/:tenantId
   * Get pending domains for tenant
   */
  getPendingDomains: async (tenantId: string): Promise<TenantDomain[]> => {
    return tenantDomainsApi.getAll({
      tenant_id: tenantId,
      verification_status: 'PENDING',
    });
  },

  /**
   * GET /tenant-domains/by-policy/:policy
   * Get domains by policy
   */
  getByPolicy: async (policy: DomainPolicy, tenantId?: string): Promise<TenantDomain[]> => {
    return tenantDomainsApi.getAll({
      tenant_id: tenantId,
      policy,
    });
  },

  /**
   * POST /tenant-domains/:id/verify
   * Trigger domain verification
   * Note: In production, this should call backend API to perform actual verification
   */
  verifyDomain: async (id: string): Promise<VerifyDomainResult> => {
    const domain = await tenantDomainsApi.getById(id);

    if (domain.verification_status === 'VERIFIED') {
      return {
        success: true,
        message: 'Domain already verified',
        domain,
      };
    }

    // In production, backend should perform actual verification
    // For now, this is a placeholder that returns pending status
    console.log('Domain verification should be performed by backend:', {
      domain: domain.domain,
      method: domain.verification_method,
      token: domain.verification_token,
    });

    return {
      success: false,
      message: 'Verification check initiated. Please wait for backend to verify.',
      domain,
    };
  },

  /**
   * POST /tenant-domains/:id/mark-verified
   * Manually mark domain as verified (admin action)
   */
  markAsVerified: async (id: string): Promise<TenantDomain> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_domains')
      .update({
        verification_status: 'VERIFIED',
        verified_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to mark domain as verified: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-domains/:id/regenerate-token
   * Regenerate verification token
   */
  regenerateToken: async (id: string): Promise<TenantDomain> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const newToken = generateVerificationToken();

    const { data, error } = await supabase
      .from('tenant_domains')
      .update({
        verification_token: newToken,
        verification_status: 'PENDING', // Reset to pending
        verified_at: null,
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to regenerate token: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * PUT /tenant-domains/:id/policy
   * Update domain policy
   */
  updatePolicy: async (id: string, policy: DomainPolicy): Promise<TenantDomain> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_domains')
      .update({ policy })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update policy: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * PUT /tenant-domains/:id/verification-method
   * Update verification method
   */
  updateVerificationMethod: async (id: string, method: VerificationMethod): Promise<TenantDomain> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_domains')
      .update({
        verification_method: method,
        verification_token: generateVerificationToken(), // Generate new token
        verification_status: 'PENDING', // Reset to pending
        verified_at: null,
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update verification method: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * GET /tenant-domains/:id/verification-instructions
   * Get verification instructions for domain
   */
  getVerificationInstructions: (domain: TenantDomain): VerificationInstructions => {
    if (domain.verification_method === 'DNS_TXT' || !domain.verification_method) {
      return {
        method: 'DNS_TXT',
        instructions: 'Add a TXT record to your DNS configuration',
        recordName: `_vhv-verify.${domain.domain}`,
        recordValue: domain.verification_token || '',
      };
    } else {
      // HTML_FILE
      return {
        method: 'HTML_FILE',
        instructions: 'Upload a verification file to your website root',
        filePath: `/.well-known/vhv-verification.txt`,
        fileContent: domain.verification_token || '',
      };
    }
  },

  /**
   * GET /tenant-domains/statistics
   * Get domain statistics
   */
  getStatistics: async (tenantId?: string): Promise<DomainStatistics> => {
    const domains = await tenantDomainsApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(domains);
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateDomainRequest | UpdateDomainRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate domain
    if ('domain' in data && data.domain !== undefined) {
      const domain = data.domain;

      if (!domain || !domain.trim()) {
        errors.push('Tên miền không được để trống');
      } else {
        // Length check
        if (domain.length > 255) {
          errors.push('Tên miền không được vượt quá 255 ký tự');
        }

        // Format check: ^[a-z0-9.-]+$
        if (!isValidDomain(domain)) {
          errors.push('Tên miền chỉ được chứa chữ thường, số, dấu chấm và gạch ngang');
        }

        // Additional checks
        if (domain.startsWith('.') || domain.endsWith('.')) {
          errors.push('Tên miền không được bắt đầu hoặc kết thúc bằng dấu chấm');
        }
        if (domain.includes('..')) {
          errors.push('Tên miền không được chứa hai dấu chấm liên tiếp');
        }
        if (domain.startsWith('-') || domain.endsWith('-')) {
          errors.push('Tên miền không được bắt đầu hoặc kết thúc bằng gạch ngang');
        }
      }
    }

    // Validate verification_token length
    if ('verification_token' in data && data.verification_token) {
      if (data.verification_token.length > 100) {
        errors.push('Verification token không được vượt quá 100 ký tự');
      }
    }

    // Validate tenant_id
    if ('tenant_id' in data && data.tenant_id !== undefined) {
      if (!data.tenant_id || !data.tenant_id.trim()) {
        errors.push('Tenant ID không được để trống');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate random verification token (32 chars hex)
 */
export function generateVerificationToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize domain (lowercase, trim)
 */
export function normalizeDomain(domain: string): string {
  return domain.toLowerCase().trim();
}

/**
 * Validate domain format (^[a-z0-9.-]+$)
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-z0-9.-]+$/;
  return domainRegex.test(domain);
}

/**
 * Calculate statistics from domains array
 */
export function calculateStatistics(domains: TenantDomain[]): DomainStatistics {
  const byPolicy: Record<DomainPolicy, number> = {
    NONE: 0,
    CAPTURE: 0,
    ENFORCE_SSO: 0,
  };

  const byMethod: Record<VerificationMethod, number> = {
    DNS_TXT: 0,
    HTML_FILE: 0,
  };

  let verifiedCount = 0;
  let pendingCount = 0;
  let recentlyVerifiedCount = 0;
  let totalDaysToVerify = 0;
  let verifiedDomainsWithDuration = 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  domains.forEach((domain) => {
    // Count by status
    if (domain.verification_status === 'VERIFIED') {
      verifiedCount++;

      // Check if recently verified
      if (domain.verified_at && new Date(domain.verified_at) >= sevenDaysAgo) {
        recentlyVerifiedCount++;
      }

      // Calculate days to verify
      if (domain.verified_at) {
        const createdDate = new Date(domain.created_at);
        const verifiedDate = new Date(domain.verified_at);
        const daysToVerify = Math.ceil((verifiedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToVerify >= 0) {
          totalDaysToVerify += daysToVerify;
          verifiedDomainsWithDuration++;
        }
      }
    } else {
      pendingCount++;
    }

    // Count by policy
    byPolicy[domain.policy]++;

    // Count by method
    if (domain.verification_method) {
      byMethod[domain.verification_method]++;
    }
  });

  const avgDaysToVerify =
    verifiedDomainsWithDuration > 0 ? Math.round(totalDaysToVerify / verifiedDomainsWithDuration) : null;

  return {
    total_domains: domains.length,
    verified_domains: verifiedCount,
    pending_domains: pendingCount,
    by_policy: byPolicy,
    by_method: byMethod,
    recently_verified: recentlyVerifiedCount,
    avg_days_to_verify: avgDaysToVerify,
  };
}

/**
 * Get verification status label
 */
export function getStatusLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    PENDING: 'Chờ xác minh',
    VERIFIED: 'Đã xác minh',
  };
  return labels[status];
}

/**
 * Get verification status color
 */
export function getStatusColor(status: VerificationStatus): string {
  const colors: Record<VerificationStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    VERIFIED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };
  return colors[status];
}

/**
 * Get verification method label
 */
export function getMethodLabel(method: VerificationMethod): string {
  const labels: Record<VerificationMethod, string> = {
    DNS_TXT: 'DNS TXT Record',
    HTML_FILE: 'HTML File',
  };
  return labels[method];
}

/**
 * Get verification method color
 */
export function getMethodColor(method: VerificationMethod): string {
  const colors: Record<VerificationMethod, string> = {
    DNS_TXT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    HTML_FILE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };
  return colors[method];
}

/**
 * Get domain policy label
 */
export function getPolicyLabel(policy: DomainPolicy): string {
  const labels: Record<DomainPolicy, string> = {
    NONE: 'Không có chính sách',
    CAPTURE: 'Thu thập email',
    ENFORCE_SSO: 'Bắt buộc SSO',
  };
  return labels[policy];
}

/**
 * Get domain policy color
 */
export function getPolicyColor(policy: DomainPolicy): string {
  const colors: Record<DomainPolicy, string> = {
    NONE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    CAPTURE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ENFORCE_SSO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[policy];
}

/**
 * Get days since verified
 */
export function getDaysVerified(domain: TenantDomain): number | null {
  if (!domain.verified_at) return null;

  const verifiedDate = new Date(domain.verified_at);
  const today = new Date();
  const days = Math.ceil((today.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));

  return days;
}

/**
 * Check if domain was recently verified (within 7 days)
 */
export function isRecentlyVerified(domain: TenantDomain): boolean {
  const days = getDaysVerified(domain);
  return days !== null && days <= 7;
}

/**
 * Get days to verify (time from creation to verification)
 */
export function getDaysToVerify(domain: TenantDomain): number | null {
  if (!domain.verified_at) return null;

  const createdDate = new Date(domain.created_at);
  const verifiedDate = new Date(domain.verified_at);
  const days = Math.ceil((verifiedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  return days >= 0 ? days : null;
}

/**
 * Format verification status for display
 */
export function formatVerificationStatus(domain: TenantDomain): string {
  if (domain.verification_status === 'VERIFIED') {
    const days = getDaysVerified(domain);
    if (days !== null) {
      if (days === 0) return 'Đã xác minh hôm nay';
      if (days === 1) return 'Đã xác minh hôm qua';
      if (days <= 7) return `Đã xác minh ${days} ngày trước`;
      return 'Đã xác minh';
    }
    return 'Đã xác minh';
  }
  return 'Chờ xác minh';
}

export default tenantDomainsApi;
