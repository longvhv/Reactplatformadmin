/**
 * Users API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Type helpers
 * Database: users (16 fields, 4 statuses, MFA support, soft delete)
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
  password_hash?: string; // Should never be returned to client, but included for completeness
  full_name: string;
  avatar_url?: string;
  phone_number?: string; // Changed from phone to match database
  status: 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING'; // Fixed to match database constraints
  is_support_staff: boolean; // Added
  mfa_enabled: boolean; // Added
  mfa_secret?: string; // Should never be returned to client
  is_verified: boolean; // Added - database field
  locale: string; // Added
  metadata: Record<string, any>; // Not optional in database
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Note: database doesn't have version field, removed from interface
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  phone_number?: string; // Changed from phone
  password?: string; // Made optional since password_hash is handled server-side
  avatar_url?: string;
  is_support_staff?: boolean;
  locale?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  phone_number?: string; // Changed from phone
  avatar_url?: string;
  status?: 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING'; // Fixed values
  is_support_staff?: boolean;
  mfa_enabled?: boolean;
  locale?: string;
  metadata?: Record<string, any>;
  // Removed version since database doesn't have it
}

export interface UserFilters extends BaseFilters {
  status?: string;
  is_verified?: boolean; // Changed from email_verified
  is_support_staff?: boolean;
  mfa_enabled?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<User, CreateUserRequest, UpdateUserRequest>(
  'users',
  '/users',
  true  // ✅ FIXED: Enable soft delete (deleted_at field exists)
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
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * PATCH /users/:id/status
   */
  updateStatus: async (id: string, status: User['status']): Promise<User> => {
    return adapter.update(id, { status } as UpdateUserRequest);
  },

  /**
   * POST /users/:id/verify-phone
   * TODO (Golang): Implement verification endpoint
   */
  verifyPhone: async (id: string, code: string): Promise<void> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * Get users by status
   */
  getByStatus: async (status: UserStatus): Promise<User[]> => {
    return adapter.getAll({ status });
  },

  /**
   * Get active users
   */
  getActive: async (): Promise<User[]> => {
    return adapter.getAll({ status: 'ACTIVE' });
  },

  /**
   * Get pending users (need approval)
   */
  getPending: async (): Promise<User[]> => {
    return adapter.getAll({ status: 'PENDING' });
  },

  /**
   * Get banned users
   */
  getBanned: async (): Promise<User[]> => {
    return adapter.getAll({ status: 'BANNED' });
  },

  /**
   * Get disabled users
   */
  getDisabled: async (): Promise<User[]> => {
    return adapter.getAll({ status: 'DISABLED' });
  },

  /**
   * Get verified users
   */
  getVerified: async (): Promise<User[]> => {
    return adapter.getAll({ is_verified: true });
  },

  /**
   * Get unverified users
   */
  getUnverified: async (): Promise<User[]> => {
    return adapter.getAll({ is_verified: false });
  },

  /**
   * Get support staff users
   */
  getSupportStaff: async (): Promise<User[]> => {
    return adapter.getAll({ is_support_staff: true });
  },

  /**
   * Get users with MFA enabled
   */
  getMFAEnabled: async (): Promise<User[]> => {
    return adapter.getAll({ mfa_enabled: true });
  },

  /**
   * Get users with MFA disabled
   */
  getMFADisabled: async (): Promise<User[]> => {
    return adapter.getAll({ mfa_enabled: false });
  },

  /**
   * Activate user
   */
  activate: async (id: string): Promise<User> => {
    return adapter.update(id, { status: 'ACTIVE' });
  },

  /**
   * Ban user
   */
  ban: async (id: string, reason?: string): Promise<User> => {
    const metadata = reason ? { ban_reason: reason, banned_at: new Date().toISOString() } : {};
    return adapter.update(id, { status: 'BANNED', metadata });
  },

  /**
   * Unban user
   */
  unban: async (id: string): Promise<User> => {
    return adapter.update(id, { status: 'ACTIVE' });
  },

  /**
   * Disable user
   */
  disable: async (id: string, reason?: string): Promise<User> => {
    const metadata = reason ? { disable_reason: reason, disabled_at: new Date().toISOString() } : {};
    return adapter.update(id, { status: 'DISABLED', metadata });
  },

  /**
   * Enable user (set to ACTIVE)
   */
  enable: async (id: string): Promise<User> => {
    return adapter.update(id, { status: 'ACTIVE' });
  },

  /**
   * Mark user as verified
   */
  verify: async (id: string): Promise<User> => {
    return adapter.update(id, { is_verified: true });
  },

  /**
   * Mark user as unverified
   */
  unverify: async (id: string): Promise<User> => {
    return adapter.update(id, { is_verified: false });
  },

  /**
   * Enable MFA for user
   */
  enableMFA: async (id: string, secret?: string): Promise<User> => {
    return adapter.update(id, { mfa_enabled: true, mfa_secret: secret } as any);
  },

  /**
   * Disable MFA for user
   */
  disableMFA: async (id: string): Promise<User> => {
    return adapter.update(id, { mfa_enabled: false, mfa_secret: undefined } as any);
  },

  /**
   * Set user as support staff
   */
  setSupportStaff: async (id: string, isSupportStaff: boolean = true): Promise<User> => {
    return adapter.update(id, { is_support_staff: isSupportStaff });
  },

  /**
   * Update user locale
   */
  updateLocale: async (id: string, locale: Locale): Promise<User> => {
    return adapter.update(id, { locale });
  },

  /**
   * Update avatar
   */
  updateAvatar: async (id: string, avatarUrl: string): Promise<User> => {
    return adapter.update(id, { avatar_url: avatarUrl });
  },

  /**
   * Remove avatar
   */
  removeAvatar: async (id: string): Promise<User> => {
    return adapter.update(id, { avatar_url: undefined });
  },

  /**
   * Update phone number
   */
  updatePhone: async (id: string, phoneNumber: string): Promise<User> => {
    return adapter.update(id, { phone_number: phoneNumber });
  },

  /**
   * Remove phone number
   */
  removePhone: async (id: string): Promise<User> => {
    return adapter.update(id, { phone_number: undefined });
  },

  /**
   * Update metadata
   */
  updateMetadata: async (id: string, metadata: Record<string, any>): Promise<User> => {
    return adapter.update(id, { metadata });
  },

  /**
   * Merge metadata (keep existing + add new)
   */
  mergeMetadata: async (id: string, newMetadata: Record<string, any>): Promise<User> => {
    const user = await adapter.getById(id);
    const merged = { ...user.metadata, ...newMetadata };
    return adapter.update(id, { metadata: merged });
  },

  /**
   * Get user by email
   */
  getByEmail: async (email: string): Promise<User | null> => {
    const users = await adapter.getAll({});
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  /**
   * Get user by phone number
   */
  getByPhone: async (phoneNumber: string): Promise<User | null> => {
    const users = await adapter.getAll({});
    return users.find(u => u.phone_number === phoneNumber) || null;
  },

  /**
   * Check if email exists
   */
  emailExists: async (email: string): Promise<boolean> => {
    const user = await usersApi.getByEmail(email);
    return user !== null;
  },

  /**
   * Check if phone exists
   */
  phoneExists: async (phoneNumber: string): Promise<boolean> => {
    const user = await usersApi.getByPhone(phoneNumber);
    return user !== null;
  },

  /**
   * Search users by name or email
   */
  search: async (query: string): Promise<User[]> => {
    const users = await adapter.getAll({});
    const lowerQuery = query.toLowerCase();
    return users.filter(u => 
      u.full_name.toLowerCase().includes(lowerQuery) ||
      u.email.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get user statistics
   */
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
    by_status: Record<UserStatus, number>;
    by_locale: Record<string, number>;
  }> => {
    const users = await adapter.getAll({});

    const byStatus: Record<string, number> = {
      ACTIVE: 0,
      BANNED: 0,
      DISABLED: 0,
      PENDING: 0,
    };

    const byLocale: Record<string, number> = {};

    users.forEach(u => {
      byStatus[u.status] = (byStatus[u.status] || 0) + 1;
      byLocale[u.locale] = (byLocale[u.locale] || 0) + 1;
    });

    return {
      total: users.length,
      active: byStatus.ACTIVE,
      banned: byStatus.BANNED,
      disabled: byStatus.DISABLED,
      pending: byStatus.PENDING,
      verified: users.filter(u => u.is_verified).length,
      unverified: users.filter(u => !u.is_verified).length,
      mfa_enabled: users.filter(u => u.mfa_enabled).length,
      support_staff: users.filter(u => u.is_support_staff).length,
      by_status: byStatus as Record<UserStatus, number>,
      by_locale: byLocale,
    };
  },

  /**
   * Get user info (without sensitive data)
   */
  getUserInfo: async (id: string): Promise<Omit<User, 'password_hash' | 'mfa_secret'>> => {
    const user = await adapter.getById(id);
    const { password_hash, mfa_secret, ...safeUser } = user;
    return safeUser;
  },

  /**
   * Bulk update status
   */
  bulkUpdateStatus: async (userIds: string[], status: UserStatus): Promise<void> => {
    await Promise.all(
      userIds.map(id => adapter.update(id, { status }))
    );
  },

  /**
   * Bulk activate users
   */
  bulkActivate: async (userIds: string[]): Promise<void> => {
    await usersApi.bulkUpdateStatus(userIds, 'ACTIVE');
  },

  /**
   * Bulk ban users
   */
  bulkBan: async (userIds: string[], reason?: string): Promise<void> => {
    await Promise.all(
      userIds.map(id => usersApi.ban(id, reason))
    );
  },

  /**
   * Bulk disable users
   */
  bulkDisable: async (userIds: string[], reason?: string): Promise<void> => {
    await Promise.all(
      userIds.map(id => usersApi.disable(id, reason))
    );
  },

  /**
   * Bulk verify users
   */
  bulkVerify: async (userIds: string[]): Promise<void> => {
    await Promise.all(
      userIds.map(id => adapter.update(id, { is_verified: true }))
    );
  },

  /**
   * Soft delete user (set deleted_at)
   */
  softDelete: async (id: string): Promise<void> => {
    await adapter.update(id, { 
      deleted_at: new Date().toISOString(),
      status: 'DISABLED',
    } as any);
  },

  /**
   * Restore soft-deleted user
   */
  restore: async (id: string): Promise<User> => {
    return adapter.update(id, { 
      deleted_at: undefined,
      status: 'ACTIVE',
    } as any);
  },

  /**
   * Get deleted users
   */
  getDeleted: async (): Promise<User[]> => {
    const users = await adapter.getAll({});
    return users.filter(u => u.deleted_at);
  },

  /**
   * Hard delete user (permanent)
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Check if user can login
   */
  canLogin: async (id: string): Promise<boolean> => {
    const user = await adapter.getById(id);
    return UserStatusHelper.canLogin(user.status) && !user.deleted_at;
  },

  /**
   * Count users by status
   */
  countByStatus: async (status: UserStatus): Promise<number> => {
    const users = await adapter.getAll({ status });
    return users.length;
  },

  /**
   * Get recent users (last N days)
   */
  getRecent: async (days: number = 7): Promise<User[]> => {
    const users = await adapter.getAll({});
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return users.filter(u => new Date(u.created_at) >= cutoff);
  },

  /**
   * Get users by locale
   */
  getByLocale: async (locale: Locale): Promise<User[]> => {
    const users = await adapter.getAll({});
    return users.filter(u => u.locale === locale);
  },

  /**
   * Approve pending user
   */
  approve: async (id: string): Promise<User> => {
    return adapter.update(id, { status: 'ACTIVE', is_verified: true });
  },

  /**
   * Reject pending user
   */
  reject: async (id: string, reason?: string): Promise<User> => {
    const metadata = reason ? { rejection_reason: reason, rejected_at: new Date().toISOString() } : {};
    return adapter.update(id, { status: 'DISABLED', metadata });
  },
};

export default usersApi;