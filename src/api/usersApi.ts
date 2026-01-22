/**
 * Users API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ COMPLIANT with public.users schema (docs/Tables.md)
 * Database: users (16 fields, 4 statuses, MFA support, soft delete)
 * Note: Users table is global (no tenant_id) and does not use optimistic locking (no version field).
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPE HELPERS ====================

export const UserStatusHelper = {
  ACTIVE: 'ACTIVE' as UserStatus,
  BANNED: 'BANNED' as UserStatus,
  DISABLED: 'DISABLED' as UserStatus,
  PENDING: 'PENDING' as UserStatus,

  isActive: (status: UserStatus) => status === 'ACTIVE',
  isBanned: (status: UserStatus) => status === 'BANNED',
  isDisabled: (status: UserStatus) => status === 'DISABLED',
  isPending: (status: UserStatus) => status === 'PENDING',

  // Group checks
  canLogin: (status: UserStatus) => status === 'ACTIVE',
  isRestricted: (status: UserStatus) => status === 'BANNED' || status === 'DISABLED',
  needsApproval: (status: UserStatus) => status === 'PENDING',
  isUsable: (status: UserStatus) => status === 'ACTIVE',
};

export const LocaleHelper = {
  VI_VN: 'vi-VN' as Locale,
  EN_US: 'en-US' as Locale,
  EN_GB: 'en-GB' as Locale,
  JA_JP: 'ja-JP' as Locale,
  KO_KR: 'ko-KR' as Locale,
  ZH_CN: 'zh-CN' as Locale,

  isVietnamese: (locale: Locale) => locale === 'vi-VN',
  isEnglish: (locale: Locale) => locale === 'en-US' || locale === 'en-GB',
  isAsian: (locale: Locale) => locale === 'ja-JP' || locale === 'ko-KR' || locale === 'zh-CN' || locale === 'vi-VN',
  getLanguageCode: (locale: Locale) => locale.split('-')[0],
  getCountryCode: (locale: Locale) => locale.split('-')[1],
};

// ==================== ENUMS ====================

export type UserStatus = 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING';
export type Locale = 'vi-VN' | 'en-US' | 'en-GB' | 'ja-JP' | 'ko-KR' | 'zh-CN';

export const USER_STATUSES: UserStatus[] = ['ACTIVE', 'BANNED', 'DISABLED', 'PENDING'];
export const LOCALES: Locale[] = ['vi-VN', 'en-US', 'en-GB', 'ja-JP', 'ko-KR', 'zh-CN'];

// ==================== TYPES ====================

export interface User {
  _id: string;
  email: string;
  password_hash?: string; // Internal use only
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  status: UserStatus;
  is_support_staff: boolean;
  mfa_enabled: boolean;
  mfa_secret?: string; // Internal use only
  is_verified: boolean;
  locale: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // No version field in users table (unlike roles)
  // No tenant_id field in users table (users are global)
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  phone_number?: string;
  password?: string; // For initial creation (backend will hash it)
  avatar_url?: string;
  is_support_staff?: boolean;
  mfa_enabled?: boolean;
  is_verified?: boolean;
  locale?: string;
  metadata?: Record<string, any>;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
  status?: UserStatus;
  is_support_staff?: boolean;
  mfa_enabled?: boolean;
  is_verified?: boolean;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface UserFilters extends BaseFilters {
  status?: string;
  is_verified?: boolean;
  is_support_staff?: boolean;
  mfa_enabled?: boolean;
  search?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<User, CreateUserRequest, UpdateUserRequest>(
  'users',
  '/users',
  { supportsSoftDelete: true } // ✅ Enable soft delete (deleted_at field exists)
);

// ==================== API CLIENT ====================

export const usersApi = {
  /**
   * GET /users
   */
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /users/:id
   */
  getById: async (id: string): Promise<User> => {
    return adapter.getById(id);
  },

  /**
   * POST /users
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    return adapter.create(data);
  },

  /**
   * PATCH /users/:id
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /users/:id
   * Performs soft delete via adapter
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Restore soft-deleted user
   */
  restore: async (id: string): Promise<User> => {
    // We can't use simple update if the adapter filters out deleted items by default
    // This assumes the backend supports restoring via specific endpoint or update
    // For now, mapping to update with deleted_at = null
    return adapter.update(id, { 
      // @ts-ignore - deleted_at is not in UpdateUserRequest but backend might accept it for restore
      deleted_at: null, 
      status: 'ACTIVE',
    } as any);
  },

  // --- Convenience Methods ---

  updateStatus: async (id: string, status: UserStatus): Promise<User> => {
    return adapter.update(id, { status });
  },

  ban: async (id: string, reason?: string): Promise<User> => {
    const metadataUpdate = reason ? { ban_reason: reason, banned_at: new Date().toISOString() } : {};
    
    // Fetch current metadata to merge if needed, but optimally backend handles partial JSONB update.
    // Assuming backend performs deep merge or we need to send full object.
    // For safety in this environment, we'll fetch first.
    try {
      const user = await adapter.getById(id);
      const metadata = { ...(user.metadata || {}), ...metadataUpdate };
      return adapter.update(id, { status: 'BANNED', metadata });
    } catch (e) {
      // Fallback if fetch fails (e.g. permission), try direct update
      return adapter.update(id, { status: 'BANNED', metadata: metadataUpdate });
    }
  },

  activate: async (id: string): Promise<User> => {
    return adapter.update(id, { status: 'ACTIVE' });
  },

  verify: async (id: string): Promise<User> => {
    return adapter.update(id, { is_verified: true });
  },

  // --- Statistics ---

  getStats: async (): Promise<{
    total: number;
    active: number;
    banned: number;
    disabled: number;
    pending: number;
    verified: number;
    unverified: number;
    mfa_enabled: number;
    support_staff: number;
  }> => {
    const users = await adapter.getAll({});
    
    return {
      total: users.length,
      active: users.filter(u => u.status === 'ACTIVE').length,
      banned: users.filter(u => u.status === 'BANNED').length,
      disabled: users.filter(u => u.status === 'DISABLED').length,
      pending: users.filter(u => u.status === 'PENDING').length,
      verified: users.filter(u => u.is_verified).length,
      unverified: users.filter(u => !u.is_verified).length,
      mfa_enabled: users.filter(u => u.mfa_enabled).length,
      support_staff: users.filter(u => u.is_support_staff).length,
    };
  }
};

export default usersApi;
