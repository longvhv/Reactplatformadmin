/**
 * User MFA Methods API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_mfa_methods (30 fields, 9 method types, 5 statuses, security features)
 */

import { createAdapter, BaseFilters } from './adapters';
import { getSupabaseClient } from '../lib/supabase';

// ==================== TYPE HELPERS ====================

export const MfaMethodTypeHelper = {
  TOTP: 'TOTP' as MfaMethodType,
  SMS: 'SMS' as MfaMethodType,
  EMAIL: 'EMAIL' as MfaMethodType,
  WEBAUTHN: 'WEBAUTHN' as MfaMethodType,
  BACKUP_CODES: 'BACKUP_CODES' as MfaMethodType,
  PUSH_NOTIFICATION: 'PUSH_NOTIFICATION' as MfaMethodType,
  BIOMETRIC: 'BIOMETRIC' as MfaMethodType,
  HARDWARE_TOKEN: 'HARDWARE_TOKEN' as MfaMethodType,
  OTHER: 'OTHER' as MfaMethodType,

  isTOTP: (type: MfaMethodType) => type === 'TOTP',
  isSMS: (type: MfaMethodType) => type === 'SMS',
  isEmail: (type: MfaMethodType) => type === 'EMAIL',
  isWebAuthn: (type: MfaMethodType) => type === 'WEBAUTHN',
  isBackupCodes: (type: MfaMethodType) => type === 'BACKUP_CODES',
  isPushNotification: (type: MfaMethodType) => type === 'PUSH_NOTIFICATION',
  isBiometric: (type: MfaMethodType) => type === 'BIOMETRIC',
  isHardwareToken: (type: MfaMethodType) => type === 'HARDWARE_TOKEN',
  isOther: (type: MfaMethodType) => type === 'OTHER',

  // Group checks
  requiresDevice: (type: MfaMethodType) => 
    type === 'TOTP' || type === 'WEBAUTHN' || type === 'PUSH_NOTIFICATION' || type === 'BIOMETRIC' || type === 'HARDWARE_TOKEN',
  requiresPhone: (type: MfaMethodType) => type === 'SMS',
  requiresEmail: (type: MfaMethodType) => type === 'EMAIL',
  requiresSetup: (type: MfaMethodType) => 
    type === 'TOTP' || type === 'WEBAUTHN' || type === 'HARDWARE_TOKEN',
  isFallbackMethod: (type: MfaMethodType) => type === 'BACKUP_CODES' || type === 'EMAIL',
  isModernMethod: (type: MfaMethodType) => 
    type === 'WEBAUTHN' || type === 'PUSH_NOTIFICATION' || type === 'BIOMETRIC',
  isLegacyMethod: (type: MfaMethodType) => type === 'SMS' || type === 'EMAIL',
  supportsBackupCodes: (type: MfaMethodType) => 
    type === 'TOTP' || type === 'WEBAUTHN' || type === 'HARDWARE_TOKEN',
};

export const MfaStatusHelper = {
  ACTIVE: 'ACTIVE' as MfaStatus,
  INACTIVE: 'INACTIVE' as MfaStatus,
  SUSPENDED: 'SUSPENDED' as MfaStatus,
  REVOKED: 'REVOKED' as MfaStatus,
  PENDING: 'PENDING' as MfaStatus,

  isActive: (status: MfaStatus) => status === 'ACTIVE',
  isInactive: (status: MfaStatus) => status === 'INACTIVE',
  isSuspended: (status: MfaStatus) => status === 'SUSPENDED',
  isRevoked: (status: MfaStatus) => status === 'REVOKED',
  isPending: (status: MfaStatus) => status === 'PENDING',
  
  isUsable: (status: MfaStatus) => status === 'ACTIVE',
  isNotUsable: (status: MfaStatus) => status !== 'ACTIVE',
  canBeActivated: (status: MfaStatus) => status === 'PENDING' || status === 'INACTIVE' || status === 'SUSPENDED',
  canBeSuspended: (status: MfaStatus) => status === 'ACTIVE',
  canBeRevoked: (status: MfaStatus) => status !== 'REVOKED',
  needsVerification: (status: MfaStatus) => status === 'PENDING',
};

// ==================== ENUMS - Match database CHECK constraints ====================

/**
 * MFA Method Type Enum - 9 types
 * CHECK constraint: method_type IN ('TOTP', 'SMS', 'EMAIL', ...)
 */
export type MfaMethodType =
  | 'TOTP'
  | 'SMS'
  | 'EMAIL'
  | 'WEBAUTHN'
  | 'BACKUP_CODES'
  | 'PUSH_NOTIFICATION'
  | 'BIOMETRIC'
  | 'HARDWARE_TOKEN'
  | 'OTHER';

export const MFA_METHOD_TYPES: MfaMethodType[] = [
  'TOTP', 'SMS', 'EMAIL', 'WEBAUTHN', 'BACKUP_CODES',
  'PUSH_NOTIFICATION', 'BIOMETRIC', 'HARDWARE_TOKEN', 'OTHER',
];

/**
 * MFA Status Enum - 5 statuses
 * CHECK constraint: status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING')
 */
export type MfaStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'PENDING';

export const MFA_STATUSES: MfaStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING'];

// ==================== MAIN INTERFACE - MATCHES DATABASE 100% ====================

/**
 * UserMfaMethod interface - MATCHES database schema 100% (30 fields)
 */
export interface UserMfaMethod {
  // I. IDENTITY (2)
  _id: string;                                    // uuid PRIMARY KEY
  user_id: string;                                // uuid FK to users NOT NULL

  // II. METHOD INFORMATION (2)
  method_type: MfaMethodType;                     // varchar(50) NOT NULL with CHECK
  method_name?: string | null;                    // varchar(255)

  // III. SMS CONFIGURATION (2)
  sms_phone_number?: string | null;               // varchar(20) - required if method_type = 'SMS'
  sms_phone_verified?: boolean | null;            // boolean DEFAULT false

  // IV. EMAIL CONFIGURATION (2)
  email_address?: string | null;                  // varchar(255) - required if method_type = 'EMAIL'
  email_verified?: boolean | null;                // boolean DEFAULT false

  // V. STATUS & FLAGS (4)
  status: MfaStatus;                              // varchar(20) NOT NULL DEFAULT 'PENDING' with CHECK
  is_verified: boolean;                           // boolean NOT NULL DEFAULT false
  is_primary: boolean;                            // boolean NOT NULL DEFAULT false
  is_enforced: boolean;                           // boolean NOT NULL DEFAULT false

  // VI. USAGE TRACKING (4)
  last_used_at?: string | null;                   // timestamptz
  last_verified_at?: string | null;               // timestamptz
  success_count: number;                          // integer NOT NULL DEFAULT 0
  failure_count: number;                          // integer NOT NULL DEFAULT 0

  // VII. DEVICE INFORMATION (2)
  device_name?: string | null;                    // varchar(255)
  device_type?: string | null;                    // varchar(50)

  // VIII. BACKUP CODES (2)
  backup_codes_used?: number | null;              // integer DEFAULT 0
  backup_codes_total?: number | null;             // integer DEFAULT 10

  // IX. ENCRYPTED SECRETS (3)
  totp_secret_encrypted?: string | null;          // text
  totp_backup_codes_encrypted?: string | null;    // text
  backup_codes_encrypted?: string | null;         // text

  // X. METADATA & AUDIT (7)
  metadata?: Record<string, any> | null;          // jsonb DEFAULT '{}'
  created_at: string;                             // timestamptz NOT NULL DEFAULT now()
  updated_at: string;                             // timestamptz NOT NULL DEFAULT now()
  created_by?: string | null;                     // uuid
  updated_by?: string | null;                     // uuid
  deleted_at?: string | null;                     // timestamptz - SOFT DELETE!
  deleted_by?: string | null;                     // uuid

  // XI. VERSIONING (1)
  version: number;                                // integer NOT NULL DEFAULT 1
}

// ==================== CREATE/UPDATE REQUEST INTERFACES ====================

export interface CreateMfaMethodRequest {
  user_id: string;                                // Required
  method_type: MfaMethodType;                     // Required
  method_name?: string;
  sms_phone_number?: string;                      // Required if method_type = 'SMS'
  sms_phone_verified?: boolean;                   // Default false
  email_address?: string;                         // Required if method_type = 'EMAIL'
  email_verified?: boolean;                       // Default false
  status?: MfaStatus;                             // Default 'PENDING'
  is_verified?: boolean;                          // Default false
  is_primary?: boolean;                           // Default false
  is_enforced?: boolean;                          // Default false
  device_name?: string;
  device_type?: string;
  backup_codes_total?: number;                    // Default 10
  totp_secret_encrypted?: string;
  totp_backup_codes_encrypted?: string;
  backup_codes_encrypted?: string;
  metadata?: Record<string, any>;                 // Default '{}'
  created_by?: string;
}

export interface UpdateMfaMethodRequest {
  method_name?: string;
  sms_phone_number?: string;
  sms_phone_verified?: boolean;
  email_address?: string;
  email_verified?: boolean;
  status?: MfaStatus;
  is_verified?: boolean;
  is_primary?: boolean;
  is_enforced?: boolean;
  last_used_at?: string;
  last_verified_at?: string;
  success_count?: number;
  failure_count?: number;
  device_name?: string;
  device_type?: string;
  backup_codes_used?: number;
  backup_codes_total?: number;
  totp_secret_encrypted?: string;
  totp_backup_codes_encrypted?: string;
  backup_codes_encrypted?: string;
  metadata?: Record<string, any>;
  updated_by?: string;
  version?: number;
}

// ==================== FILTERS ====================

export interface MfaMethodFilters extends BaseFilters {
  user_id?: string;
  method_type?: MfaMethodType;
  status?: MfaStatus;
  is_verified?: boolean;
  is_primary?: boolean;
  is_enforced?: boolean;
  include_deleted?: boolean;
}

// ==================== ADAPTER & API ====================

export const userMfaMethodsApi = {
  // Basic CRUD
  
  getAll: async (filters: MfaMethodFilters = {}): Promise<UserMfaMethod[]> => {
    const supabase = getSupabaseClient();
    let query = supabase.from('user_mfa_methods').select('*');

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.method_type) query = query.eq('method_type', filters.method_type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
    if (filters.is_primary !== undefined) query = query.eq('is_primary', filters.is_primary);
    if (filters.is_enforced !== undefined) query = query.eq('is_enforced', filters.is_enforced);
    
    if (!filters.include_deleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    
    return data as UserMfaMethod[];
  },

  getById: async (id: string): Promise<UserMfaMethod> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('user_mfa_methods').select('*').eq('_id', id).single();
    if (error) throw new Error(error.message);
    return data as UserMfaMethod;
  },

  create: async (data: CreateMfaMethodRequest): Promise<UserMfaMethod> => {
    const supabase = getSupabaseClient();
    const _id = crypto.randomUUID();
    
    const row = {
      _id,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

    const { data: created, error } = await supabase.from('user_mfa_methods').insert([row]).select().single();
    if (error) throw new Error(error.message);
    return created as UserMfaMethod;
  },

  update: async (id: string, data: UpdateMfaMethodRequest): Promise<UserMfaMethod> => {
    const supabase = getSupabaseClient();
    
    // Get current version if not provided
    let currentVersion = data.version;
    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('user_mfa_methods')
            .select('version')
            .eq('_id', id)
            .single();
            
        if (fetchError || !current) {
            throw new Error(`MFA method not found: ${fetchError?.message || 'Unknown error'}`);
        }
        currentVersion = current.version;
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
      version: currentVersion + 1,
    };
    
    // Remove version from data to avoid updating it twice or incorrectly
    delete (updateData as any).version; 

    const { data: updated, error } = await supabase
      .from('user_mfa_methods')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error('Concurrent modification detected. Please refresh and try again.');

    return updated as UserMfaMethod;
  },

  delete: async (id: string, deleted_by?: string): Promise<void> => {
    await userMfaMethodsApi.softDelete(id, deleted_by);
  },
  
  // ... Rest of the methods will use these base methods or need overrides


  /**
   * Get all MFA methods for a user
   */
  getByUserId: async (userId: string, includeDeleted: boolean = false): Promise<UserMfaMethod[]> => {
    return userMfaMethodsApi.getAll({ user_id: userId, include_deleted: includeDeleted });
  },

  /**
   * Get active MFA methods for a user
   */
  getActiveByUserId: async (userId: string): Promise<UserMfaMethod[]> => {
    return userMfaMethodsApi.getAll({ user_id: userId, status: 'ACTIVE' });
  },

  /**
   * Get verified MFA methods for a user
   */
  getVerifiedByUserId: async (userId: string): Promise<UserMfaMethod[]> => {
    return userMfaMethodsApi.getAll({ user_id: userId, is_verified: true });
  },

  /**
   * Get primary MFA method for a user
   */
  getPrimaryByUserId: async (userId: string): Promise<UserMfaMethod | null> => {
    const methods = await userMfaMethodsApi.getAll({ user_id: userId, is_primary: true, status: 'ACTIVE' });
    return methods[0] || null;
  },

  /**
   * Get enforced MFA methods for a user
   */
  getEnforcedByUserId: async (userId: string): Promise<UserMfaMethod[]> => {
    return userMfaMethodsApi.getAll({ user_id: userId, is_enforced: true });
  },

  /**
   * Get methods by type
   */
  getByType: async (userId: string, methodType: MfaMethodType): Promise<UserMfaMethod[]> => {
    return userMfaMethodsApi.getAll({ user_id: userId, method_type: methodType });
  },

  /**
   * Set method as primary
   */
  setPrimary: async (id: string): Promise<UserMfaMethod> => {
    // First, unset all other primary methods for this user
    const method = await userMfaMethodsApi.getById(id);
    const otherMethods = await userMfaMethodsApi.getAll({ 
      user_id: method.user_id,
      is_primary: true,
    });
    
    // Unset other primary methods
    await Promise.all(
      otherMethods
        .filter(m => m._id !== id)
        .map(m => userMfaMethodsApi.update(m._id, { is_primary: false }))
    );
    
    // Set this method as primary
    return userMfaMethodsApi.update(id, { is_primary: true });
  },

  /**
   * Verify method
   */
  verify: async (id: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, {
      is_verified: true,
      status: 'ACTIVE',
      last_verified_at: new Date().toISOString(),
    });
  },

  /**
   * Suspend method
   */
  suspend: async (id: string, reason?: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, {
      status: 'SUSPENDED',
      metadata: { suspension_reason: reason },
    });
  },

  /**
   * Revoke method
   */
  revoke: async (id: string, reason?: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, {
      status: 'REVOKED',
      metadata: { revocation_reason: reason },
    });
  },

  /**
   * Activate method
   */
  activate: async (id: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, { status: 'ACTIVE' });
  },

  /**
   * Enforce method (require for login)
   */
  enforce: async (id: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, { is_enforced: true });
  },

  /**
   * Unenforce method
   */
  unenforce: async (id: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, { is_enforced: false });
  },

  /**
   * Record successful verification
   */
  recordSuccess: async (id: string): Promise<UserMfaMethod> => {
    const method = await userMfaMethodsApi.getById(id);
    return userMfaMethodsApi.update(id, {
      last_used_at: new Date().toISOString(),
      success_count: (method.success_count || 0) + 1,
    });
  },

  /**
   * Record failed verification
   */
  recordFailure: async (id: string): Promise<UserMfaMethod> => {
    const method = await userMfaMethodsApi.getById(id);
    return userMfaMethodsApi.update(id, {
      failure_count: (method.failure_count || 0) + 1,
    });
  },

  /**
   * Use backup code
   */
  useBackupCode: async (id: string): Promise<UserMfaMethod> => {
    const method = await userMfaMethodsApi.getById(id);
    const used = (method.backup_codes_used || 0) + 1;
    
    return userMfaMethodsApi.update(id, {
      backup_codes_used: used,
      last_used_at: new Date().toISOString(),
      success_count: (method.success_count || 0) + 1,
    });
  },

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes: async (id: string, encryptedCodes: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, {
      backup_codes_encrypted: encryptedCodes,
      backup_codes_used: 0,
      backup_codes_total: 10,
    });
  },

  /**
   * Soft delete (set deleted_at)
   */
  softDelete: async (id: string, deleted_by?: string): Promise<void> => {
    await userMfaMethodsApi.update(id, {
      deleted_at: new Date().toISOString(),
      deleted_by,
      status: 'REVOKED',
    } as any);
  },

  /**
   * Hard delete (permanently remove from database)
   */
  hardDelete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('user_mfa_methods').delete().eq('_id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Restore soft-deleted method
   */
  restore: async (id: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, {
      deleted_at: undefined,
      deleted_by: undefined,
      status: 'INACTIVE',
    } as any);
  },

  /**
   * Setup TOTP method
   */
  setupTOTP: async (userId: string, data: {
    method_name?: string;
    totp_secret_encrypted: string;
    backup_codes_encrypted: string;
    device_name?: string;
  }): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.create({
      user_id: userId,
      method_type: 'TOTP',
      method_name: data.method_name || 'Authenticator App',
      totp_secret_encrypted: data.totp_secret_encrypted,
      backup_codes_encrypted: data.backup_codes_encrypted,
      device_name: data.device_name,
      status: 'PENDING',
      is_verified: false,
      backup_codes_total: 10,
    });
  },

  /**
   * Setup SMS method
   */
  setupSMS: async (userId: string, phoneNumber: string, methodName?: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.create({
      user_id: userId,
      method_type: 'SMS',
      method_name: methodName || 'SMS Authentication',
      sms_phone_number: phoneNumber,
      sms_phone_verified: false,
      status: 'PENDING',
      is_verified: false,
    });
  },

  /**
   * Verify SMS phone number
   */
  verifySMSPhone: async (id: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, {
      sms_phone_verified: true,
      is_verified: true,
      status: 'ACTIVE',
      last_verified_at: new Date().toISOString(),
    });
  },

  /**
   * Setup Email method
   */
  setupEmail: async (userId: string, email: string, methodName?: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.create({
      user_id: userId,
      method_type: 'EMAIL',
      method_name: methodName || 'Email Authentication',
      email_address: email,
      email_verified: false,
      status: 'PENDING',
      is_verified: false,
    });
  },

  /**
   * Verify email address
   */
  verifyEmail: async (id: string): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.update(id, {
      email_verified: true,
      is_verified: true,
      status: 'ACTIVE',
      last_verified_at: new Date().toISOString(),
    });
  },

  /**
   * Setup WebAuthn method
   */
  setupWebAuthn: async (userId: string, data: {
    method_name?: string;
    device_name?: string;
    device_type?: string;
    backup_codes_encrypted?: string;
  }): Promise<UserMfaMethod> => {
    return userMfaMethodsApi.create({
      user_id: userId,
      method_type: 'WEBAUTHN',
      method_name: data.method_name || 'Security Key',
      device_name: data.device_name,
      device_type: data.device_type,
      backup_codes_encrypted: data.backup_codes_encrypted,
      status: 'PENDING',
      is_verified: false,
      backup_codes_total: data.backup_codes_encrypted ? 10 : 0,
    });
  },

  /**
   * Get user MFA statistics
   */
  getUserStats: async (userId: string): Promise<{
    total: number;
    active: number;
    verified: number;
    primary: number;
    enforced: number;
    by_type: Record<string, number>;
    total_success: number;
    total_failures: number;
    last_used?: string;
  }> => {
    const methods = await userMfaMethodsApi.getAll({ user_id: userId });

    const byType: Record<string, number> = {};
    methods.forEach(m => {
      byType[m.method_type] = (byType[m.method_type] || 0) + 1;
    });

    const totalSuccess = methods.reduce((sum, m) => sum + (m.success_count || 0), 0);
    const totalFailures = methods.reduce((sum, m) => sum + (m.failure_count || 0), 0);

    const lastUsedDates = methods
      .map(m => m.last_used_at)
      .filter(Boolean) as string[];
    const lastUsed = lastUsedDates.length > 0
      ? lastUsedDates.sort().reverse()[0]
      : undefined;

    return {
      total: methods.length,
      active: methods.filter(m => m.status === 'ACTIVE').length,
      verified: methods.filter(m => m.is_verified).length,
      primary: methods.filter(m => m.is_primary).length,
      enforced: methods.filter(m => m.is_enforced).length,
      by_type: byType,
      total_success: totalSuccess,
      total_failures: totalFailures,
      last_used: lastUsed,
    };
  },

  /**
   * Check if user has MFA enabled
   */
  hasMfaEnabled: async (userId: string): Promise<boolean> => {
    const methods = await userMfaMethodsApi.getAll({ 
      user_id: userId, 
      status: 'ACTIVE',
      is_verified: true,
    });
    return methods.length > 0;
  },

  /**
   * Check if user has enforced MFA
   */
  hasEnforcedMfa: async (userId: string): Promise<boolean> => {
    const methods = await userMfaMethodsApi.getAll({ 
      user_id: userId,
      is_enforced: true,
      status: 'ACTIVE',
    });
    return methods.length > 0;
  },

  /**
   * Get available backup codes count
   */
  getBackupCodesAvailable: async (id: string): Promise<number> => {
    const method = await userMfaMethodsApi.getById(id);
    const total = method.backup_codes_total || 0;
    const used = method.backup_codes_used || 0;
    return total - used;
  },

  /**
   * Bulk revoke methods
   */
  bulkRevoke: async (ids: string[], reason?: string): Promise<void> => {
    await Promise.all(
      ids.map(id => userMfaMethodsApi.revoke(id, reason))
    );
  },

  /**
   * Remove method (prevent last method removal)
   */
  removeMethod: async (userId: string, methodId: string): Promise<void> => {
    const activeMethods = await userMfaMethodsApi.getAll({
      user_id: userId,
      status: 'ACTIVE',
      is_verified: true,
    });

    // Allow removal if not the last active method or if not enforced
    const method = await userMfaMethodsApi.getById(methodId);
    const hasOtherActiveMethods = activeMethods.filter(m => m._id !== methodId).length > 0;
    
    if (!hasOtherActiveMethods && method.is_enforced) {
      throw new Error('Cannot remove the last enforced MFA method');
    }

    await userMfaMethodsApi.softDelete(methodId);
  },
};

export default userMfaMethodsApi;