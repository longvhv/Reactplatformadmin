/**
 * User Consents API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * 🔴 REFACTORED 2026-01-16: 100% database alignment (was 73% - critical mismatch!)
 * Database: user_consents (22 fields, GDPR/CCPA compliance, withdrawal tracking)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type ConsentMethod = 'web' | 'mobile' | 'api' | 'email' | 'signup' | 'profile' | 'checkout' | 'other';
export type DocumentType = 'TERMS' | 'PRIVACY' | 'COOKIES' | 'GDPR' | 'CCPA' | 'MARKETING' | 'DATA_PROCESSING' | 'OTHER';

export const ConsentMethodHelper = {
  WEB: 'web' as ConsentMethod,
  MOBILE: 'mobile' as ConsentMethod,
  API: 'api' as ConsentMethod,
  EMAIL: 'email' as ConsentMethod,
  SIGNUP: 'signup' as ConsentMethod,
  PROFILE: 'profile' as ConsentMethod,
  CHECKOUT: 'checkout' as ConsentMethod,
  OTHER: 'other' as ConsentMethod,

  isWeb: (method: ConsentMethod) => method === 'web',
  isMobile: (method: ConsentMethod) => method === 'mobile',
  isAPI: (method: ConsentMethod) => method === 'api',
  isEmail: (method: ConsentMethod) => method === 'email',
  isSignup: (method: ConsentMethod) => method === 'signup',
  isProfile: (method: ConsentMethod) => method === 'profile',
  isCheckout: (method: ConsentMethod) => method === 'checkout',
  isOther: (method: ConsentMethod) => method === 'other',
  isInteractive: (method: ConsentMethod) => method === 'web' || method === 'mobile' || method === 'email',
  isAutomated: (method: ConsentMethod) => method === 'api' || method === 'signup',
};

export const DocumentTypeHelper = {
  TERMS: 'TERMS' as DocumentType,
  PRIVACY: 'PRIVACY' as DocumentType,
  COOKIES: 'COOKIES' as DocumentType,
  GDPR: 'GDPR' as DocumentType,
  CCPA: 'CCPA' as DocumentType,
  MARKETING: 'MARKETING' as DocumentType,
  DATA_PROCESSING: 'DATA_PROCESSING' as DocumentType,
  OTHER: 'OTHER' as DocumentType,

  isTerms: (type: DocumentType) => type === 'TERMS',
  isPrivacy: (type: DocumentType) => type === 'PRIVACY',
  isCookies: (type: DocumentType) => type === 'COOKIES',
  isGDPR: (type: DocumentType) => type === 'GDPR',
  isCCPA: (type: DocumentType) => type === 'CCPA',
  isMarketing: (type: DocumentType) => type === 'MARKETING',
  isDataProcessing: (type: DocumentType) => type === 'DATA_PROCESSING',
  isOther: (type: DocumentType) => type === 'OTHER',
  isLegal: (type: DocumentType) => type === 'TERMS' || type === 'PRIVACY' || type === 'GDPR' || type === 'CCPA',
  isOptional: (type: DocumentType) => type === 'MARKETING' || type === 'COOKIES',
};

// ==================== MAIN INTERFACE ====================

/**
 * UserConsent - 100% matches user_consents table (22 fields)
 */
export interface UserConsent {
  // I. IDENTITY (3)
  _id: string;
  user_id: string; // FK to users, CASCADE, NOT NULL
  legal_document_id: string; // FK to legal_documents, NOT NULL

  // II. CONSENT INFO (4)
  consent_given: boolean; // default true
  consent_date: string; // timestamptz, default now()
  consent_ip: string | null; // varchar(45)
  consent_user_agent: string | null; // text
  consent_method: ConsentMethod | null; // varchar(50), 8 values

  // III. DOCUMENT INFO (3)
  document_version: string | null; // varchar(50)
  document_title: string | null; // varchar(255)
  document_type: string | null; // varchar(50) - stored as string in DB

  // IV. WITHDRAWAL INFO (3)
  withdrawn: boolean; // default false
  withdrawn_date: string | null; // timestamptz
  withdrawn_reason: string | null; // text

  // V. RENEWAL INFO (3)
  expires_at: string | null; // timestamptz
  renewal_required: boolean; // default false
  last_renewed_at: string | null; // timestamptz

  // VI. SOURCE TRACKING (2)
  source_application: string | null; // varchar(100)
  source_page: string | null; // varchar(255)

  // VII. METADATA & AUDIT (3)
  metadata: Record<string, any>; // jsonb, default '{}'
  created_at: string; // timestamptz, default now()
  updated_at: string; // timestamptz, default now()
}

export interface UserConsentWithDetails extends UserConsent {
  // Joined data
  user_email?: string;
  user_name?: string;
  document_name?: string;

  // Computed fields
  is_active?: boolean; // consent_given and not withdrawn
  is_expired?: boolean; // expires_at < now
  is_valid?: boolean; // active and not expired
  days_until_expiry?: number | null;
  days_since_consent?: number;
  needs_renewal?: boolean; // renewal_required and expired
  can_withdraw?: boolean; // consent_given and not withdrawn
}

// ==================== REQUEST INTERFACES ====================

export interface CreateConsentRequest {
  // Required
  user_id: string;
  legal_document_id: string;

  // Optional with defaults
  consent_given?: boolean; // default: true
  consent_date?: string; // default: now()
  withdrawn?: boolean; // default: false
  renewal_required?: boolean; // default: false
  metadata?: Record<string, any>; // default: {}

  // Optional
  consent_ip?: string | null;
  consent_user_agent?: string | null;
  consent_method?: ConsentMethod | null;
  document_version?: string | null;
  document_title?: string | null;
  document_type?: string | null;
  withdrawn_date?: string | null;
  withdrawn_reason?: string | null;
  expires_at?: string | null;
  last_renewed_at?: string | null;
  source_application?: string | null;
  source_page?: string | null;
}

export interface UpdateConsentRequest {
  consent_given?: boolean;
  consent_date?: string;
  consent_ip?: string | null;
  consent_user_agent?: string | null;
  consent_method?: ConsentMethod | null;
  document_version?: string | null;
  document_title?: string | null;
  document_type?: string | null;
  withdrawn?: boolean;
  withdrawn_date?: string | null;
  withdrawn_reason?: string | null;
  expires_at?: string | null;
  renewal_required?: boolean;
  last_renewed_at?: string | null;
  source_application?: string | null;
  source_page?: string | null;
  metadata?: Record<string, any>;
}

export interface ConsentFilters extends BaseFilters {
  user_id?: string;
  legal_document_id?: string;
  consent_given?: boolean;
  consent_method?: ConsentMethod;
  document_type?: string;
  withdrawn?: boolean;
  renewal_required?: boolean;
  expired?: boolean; // expires_at < now
  needs_renewal?: boolean;
  source_application?: string;
}

// ==================== STATISTICS ====================

export interface ConsentStatistics {
  total_consents: number;
  active_consents: number; // consent_given and not withdrawn
  withdrawn_consents: number;
  expired_consents: number;
  needs_renewal_count: number;
  by_method: Record<ConsentMethod, number>;
  by_document_type: Record<string, number>;
  by_source_application: Record<string, number>;
  average_days_until_expiry: number | null;
  withdrawal_rate: number; // withdrawn / total * 100
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<UserConsent, CreateConsentRequest, UpdateConsentRequest>(
  'user_consents',
  '/user-consents',
  false // No soft delete - uses withdrawn instead
);

// ==================== API CLIENT ====================

export const userConsentsApi = {
  /**
   * GET /user-consents
   */
  getAll: async (filters?: ConsentFilters): Promise<UserConsent[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('user_consents')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.legal_document_id) query = query.eq('legal_document_id', filters.legal_document_id);
    if (filters?.consent_given !== undefined) query = query.eq('consent_given', filters.consent_given);
    if (filters?.consent_method) query = query.eq('consent_method', filters.consent_method);
    if (filters?.document_type) query = query.eq('document_type', filters.document_type);
    if (filters?.withdrawn !== undefined) query = query.eq('withdrawn', filters.withdrawn);
    if (filters?.renewal_required !== undefined) query = query.eq('renewal_required', filters.renewal_required);
    if (filters?.source_application) query = query.eq('source_application', filters.source_application);

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch consents: ${error.message}`);
    }

    let consents = data || [];

    // Client-side filters
    const now = new Date();

    if (filters?.expired) {
      consents = consents.filter((c) => c.expires_at && new Date(c.expires_at) < now);
    }

    if (filters?.needs_renewal) {
      consents = consents.filter((c) => c.renewal_required && c.expires_at && new Date(c.expires_at) < now);
    }

    return consents;
  },

  /**
   * GET /user-consents/:id
   */
  getById: async (id: string): Promise<UserConsent> => {
    return adapter.getById(id);
  },

  /**
   * GET /user-consents/:id/details
   */
  getByIdWithDetails: async (id: string): Promise<UserConsentWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const consent = await userConsentsApi.getById(id);

    // Get user info
    let user_email: string | undefined;
    let user_name: string | undefined;
    if (consent.user_id) {
      const { data: user } = await supabase.from('users').select('email, full_name').eq('_id', consent.user_id).single();
      user_email = user?.email;
      user_name = user?.full_name;
    }

    // Get document name
    let document_name: string | undefined;
    if (consent.legal_document_id) {
      const { data: doc } = await supabase
        .from('legal_documents')
        .select('title')
        .eq('_id', consent.legal_document_id)
        .single();
      document_name = doc?.title;
    }

    // Compute fields
    const is_active = consent.consent_given && !consent.withdrawn;
    const now = new Date();
    const is_expired = consent.expires_at ? new Date(consent.expires_at) < now : false;
    const is_valid = is_active && !is_expired;

    let days_until_expiry: number | null = null;
    if (consent.expires_at) {
      const expiryDate = new Date(consent.expires_at);
      days_until_expiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const consentDate = new Date(consent.consent_date);
    const days_since_consent = Math.floor((now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24));

    const needs_renewal = consent.renewal_required && is_expired;
    const can_withdraw = is_active;

    return {
      ...consent,
      user_email,
      user_name,
      document_name,
      is_active,
      is_expired,
      is_valid,
      days_until_expiry,
      days_since_consent,
      needs_renewal,
      can_withdraw,
    } as UserConsentWithDetails;
  },

  /**
   * POST /user-consents
   */
  create: async (data: CreateConsentRequest): Promise<UserConsent> => {
    // Validate
    const validation = userConsentsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Apply defaults
    const requestData = {
      ...data,
      consent_given: data.consent_given !== undefined ? data.consent_given : true,
      consent_date: data.consent_date || new Date().toISOString(),
      withdrawn: data.withdrawn !== undefined ? data.withdrawn : false,
      renewal_required: data.renewal_required !== undefined ? data.renewal_required : false,
      metadata: data.metadata || {},
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /user-consents/:id
   */
  update: async (id: string, data: UpdateConsentRequest): Promise<UserConsent> => {
    // Validate
    const validation = userConsentsApi.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return adapter.update(id, data);
  },

  /**
   * DELETE /user-consents/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /user-consents/by-user/:userId
   */
  getByUser: async (userId: string): Promise<UserConsent[]> => {
    return userConsentsApi.getAll({ user_id: userId });
  },

  /**
   * GET /user-consents/by-document/:documentId
   */
  getByDocument: async (documentId: string): Promise<UserConsent[]> => {
    return userConsentsApi.getAll({ legal_document_id: documentId });
  },

  /**
   * GET /user-consents/active
   */
  getActive: async (userId?: string): Promise<UserConsent[]> => {
    return userConsentsApi.getAll({
      user_id: userId,
      consent_given: true,
      withdrawn: false,
    });
  },

  /**
   * GET /user-consents/withdrawn
   */
  getWithdrawn: async (userId?: string): Promise<UserConsent[]> => {
    return userConsentsApi.getAll({
      user_id: userId,
      withdrawn: true,
    });
  },

  /**
   * GET /user-consents/expired
   */
  getExpired: async (userId?: string): Promise<UserConsent[]> => {
    return userConsentsApi.getAll({
      user_id: userId,
      expired: true,
    });
  },

  /**
   * GET /user-consents/needs-renewal
   */
  getNeedsRenewal: async (userId?: string): Promise<UserConsent[]> => {
    return userConsentsApi.getAll({
      user_id: userId,
      needs_renewal: true,
    });
  },

  /**
   * PUT /user-consents/:id/withdraw
   */
  withdraw: async (id: string, reason?: string): Promise<UserConsent> => {
    return userConsentsApi.update(id, {
      withdrawn: true,
      withdrawn_date: new Date().toISOString(),
      withdrawn_reason: reason || null,
    });
  },

  /**
   * PUT /user-consents/:id/renew
   */
  renew: async (id: string, newExpiresAt?: string): Promise<UserConsent> => {
    const consent = await userConsentsApi.getById(id);

    return userConsentsApi.update(id, {
      consent_given: true,
      withdrawn: false,
      withdrawn_date: null,
      withdrawn_reason: null,
      last_renewed_at: new Date().toISOString(),
      expires_at: newExpiresAt || consent.expires_at,
    });
  },

  /**
   * PUT /user-consents/:id/grant
   */
  grant: async (id: string): Promise<UserConsent> => {
    return userConsentsApi.update(id, {
      consent_given: true,
      consent_date: new Date().toISOString(),
      withdrawn: false,
      withdrawn_date: null,
      withdrawn_reason: null,
    });
  },

  /**
   * PUT /user-consents/:id/revoke
   */
  revoke: async (id: string, reason?: string): Promise<UserConsent> => {
    return userConsentsApi.update(id, {
      consent_given: false,
      withdrawn: true,
      withdrawn_date: new Date().toISOString(),
      withdrawn_reason: reason || null,
    });
  },

  /**
   * GET /user-consents/statistics
   */
  getStatistics: async (userId?: string): Promise<ConsentStatistics> => {
    const consents = await userConsentsApi.getAll(userId ? { user_id: userId } : {});
    return calculateStatistics(consents);
  },

  /**
   * Bulk operations
   */
  bulkWithdraw: async (ids: string[], reason?: string): Promise<void> => {
    await Promise.all(ids.map((id) => userConsentsApi.withdraw(id, reason)));
  },

  bulkRenew: async (ids: string[], newExpiresAt?: string): Promise<void> => {
    await Promise.all(ids.map((id) => userConsentsApi.renew(id, newExpiresAt)));
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateConsentRequest | UpdateConsentRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields (create only)
    if ('user_id' in data && !data.user_id) {
      errors.push('User ID không được để trống');
    }
    if ('legal_document_id' in data && !data.legal_document_id) {
      errors.push('Legal document ID không được để trống');
    }

    // Validate dates
    if ('consent_date' in data && 'expires_at' in data && data.consent_date && data.expires_at) {
      if (new Date(data.expires_at) < new Date(data.consent_date)) {
        errors.push('Ngày hết hạn phải >= ngày đồng ý');
      }
    }

    if ('consent_date' in data && 'withdrawn_date' in data && data.consent_date && data.withdrawn_date) {
      if (new Date(data.withdrawn_date) < new Date(data.consent_date)) {
        errors.push('Ngày rút lại phải >= ngày đồng ý');
      }
    }

    // Validate withdrawn logic
    if ('withdrawn' in data && data.withdrawn === true && !('withdrawn_date' in data)) {
      warnings.push('Nên cung cấp ngày rút lại khi withdrawn = true');
    }

    // Validate IP format
    if ('consent_ip' in data && data.consent_ip) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
      if (!ipRegex.test(data.consent_ip)) {
        errors.push('Định dạng IP không hợp lệ');
      }
    }

    // Warnings
    if ('consent_given' in data && data.consent_given === false) {
      warnings.push('Consent không được cấp');
    }

    if ('renewal_required' in data && data.renewal_required === true && !('expires_at' in data)) {
      warnings.push('Nên cung cấp expires_at khi renewal_required = true');
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
 * Calculate statistics
 */
export function calculateStatistics(consents: UserConsent[]): ConsentStatistics {
  const byMethod: Record<ConsentMethod, number> = {
    web: 0,
    mobile: 0,
    api: 0,
    email: 0,
    signup: 0,
    profile: 0,
    checkout: 0,
    other: 0,
  };

  const byDocumentType: Record<string, number> = {};
  const bySourceApplication: Record<string, number> = {};

  let activeCount = 0;
  let withdrawnCount = 0;
  let expiredCount = 0;
  let needsRenewalCount = 0;
  let totalDaysUntilExpiry = 0;
  let expiryCount = 0;

  const now = new Date();

  consents.forEach((consent) => {
    // Count by method
    if (consent.consent_method) {
      byMethod[consent.consent_method]++;
    }

    // Count by document type
    if (consent.document_type) {
      byDocumentType[consent.document_type] = (byDocumentType[consent.document_type] || 0) + 1;
    }

    // Count by source application
    if (consent.source_application) {
      bySourceApplication[consent.source_application] = (bySourceApplication[consent.source_application] || 0) + 1;
    }

    // Count active
    if (consent.consent_given && !consent.withdrawn) {
      activeCount++;
    }

    // Count withdrawn
    if (consent.withdrawn) {
      withdrawnCount++;
    }

    // Count expired
    if (consent.expires_at && new Date(consent.expires_at) < now) {
      expiredCount++;
    }

    // Count needs renewal
    if (consent.renewal_required && consent.expires_at && new Date(consent.expires_at) < now) {
      needsRenewalCount++;
    }

    // Calculate average days until expiry
    if (consent.expires_at) {
      const expiryDate = new Date(consent.expires_at);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry > 0) {
        totalDaysUntilExpiry += daysUntilExpiry;
        expiryCount++;
      }
    }
  });

  const avgDaysUntilExpiry = expiryCount > 0 ? totalDaysUntilExpiry / expiryCount : null;
  const withdrawalRate = consents.length > 0 ? (withdrawnCount / consents.length) * 100 : 0;

  return {
    total_consents: consents.length,
    active_consents: activeCount,
    withdrawn_consents: withdrawnCount,
    expired_consents: expiredCount,
    needs_renewal_count: needsRenewalCount,
    by_method: byMethod,
    by_document_type: byDocumentType,
    by_source_application: bySourceApplication,
    average_days_until_expiry: avgDaysUntilExpiry,
    withdrawal_rate: withdrawalRate,
  };
}

/**
 * Check if consent is active
 */
export function isConsentActive(consent: UserConsent): boolean {
  return consent.consent_given && !consent.withdrawn;
}

/**
 * Check if consent is expired
 */
export function isConsentExpired(consent: UserConsent): boolean {
  if (!consent.expires_at) return false;
  return new Date(consent.expires_at) < new Date();
}

/**
 * Check if consent is valid (active and not expired)
 */
export function isConsentValid(consent: UserConsent): boolean {
  return isConsentActive(consent) && !isConsentExpired(consent);
}

/**
 * Check if consent needs renewal
 */
export function needsRenewal(consent: UserConsent): boolean {
  return consent.renewal_required && isConsentExpired(consent);
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(consent: UserConsent): number | null {
  if (!consent.expires_at) return null;
  const now = new Date();
  const expiryDate = new Date(consent.expires_at);
  return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get consent method label
 */
export function getConsentMethodLabel(method: ConsentMethod): string {
  const labels: Record<ConsentMethod, string> = {
    web: 'Web',
    mobile: 'Mobile App',
    api: 'API',
    email: 'Email',
    signup: 'Sign Up',
    profile: 'Profile Settings',
    checkout: 'Checkout',
    other: 'Khác',
  };
  return labels[method];
}

/**
 * Get consent method color
 */
export function getConsentMethodColor(method: ConsentMethod): string {
  const colors: Record<ConsentMethod, string> = {
    web: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    mobile: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    api: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    email: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    signup: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    profile: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    checkout: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[method];
}

/**
 * Format consent status for display
 */
export function formatConsentStatus(consent: UserConsent): {
  label: string;
  color: string;
  icon: string;
} {
  if (consent.withdrawn) {
    return {
      label: 'Đã rút lại',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      icon: '🚫',
    };
  }

  if (!consent.consent_given) {
    return {
      label: 'Từ chối',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      icon: '❌',
    };
  }

  if (isConsentExpired(consent)) {
    return {
      label: 'Hết hạn',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      icon: '⏰',
    };
  }

  return {
    label: 'Đang hoạt động',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: '✅',
  };
}

export default userConsentsApi;
