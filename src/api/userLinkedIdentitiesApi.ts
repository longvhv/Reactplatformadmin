/**
 * User Linked Identities API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_linked_identities (20 fields, OAuth providers, soft delete)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPE HELPERS ====================

export const IdentityProviderHelper = {
  GOOGLE: 'GOOGLE' as IdentityProvider,
  FACEBOOK: 'FACEBOOK' as IdentityProvider,
  GITHUB: 'GITHUB' as IdentityProvider,
  GITLAB: 'GITLAB' as IdentityProvider,
  BITBUCKET: 'BITBUCKET' as IdentityProvider,
  LINKEDIN: 'LINKEDIN' as IdentityProvider,
  TWITTER: 'TWITTER' as IdentityProvider,
  MICROSOFT: 'MICROSOFT' as IdentityProvider,
  APPLE: 'APPLE' as IdentityProvider,
  SLACK: 'SLACK' as IdentityProvider,
  DISCORD: 'DISCORD' as IdentityProvider,
  OKTA: 'OKTA' as IdentityProvider,
  AUTH0: 'AUTH0' as IdentityProvider,
  SAML: 'SAML' as IdentityProvider,
  LDAP: 'LDAP' as IdentityProvider,
  OTHER: 'OTHER' as IdentityProvider,

  isGoogle: (provider: IdentityProvider) => provider === 'GOOGLE',
  isFacebook: (provider: IdentityProvider) => provider === 'FACEBOOK',
  isGitHub: (provider: IdentityProvider) => provider === 'GITHUB',
  isGitLab: (provider: IdentityProvider) => provider === 'GITLAB',
  isBitbucket: (provider: IdentityProvider) => provider === 'BITBUCKET',
  isLinkedIn: (provider: IdentityProvider) => provider === 'LINKEDIN',
  isTwitter: (provider: IdentityProvider) => provider === 'TWITTER',
  isMicrosoft: (provider: IdentityProvider) => provider === 'MICROSOFT',
  isApple: (provider: IdentityProvider) => provider === 'APPLE',
  isSlack: (provider: IdentityProvider) => provider === 'SLACK',
  isDiscord: (provider: IdentityProvider) => provider === 'DISCORD',
  isOkta: (provider: IdentityProvider) => provider === 'OKTA',
  isAuth0: (provider: IdentityProvider) => provider === 'AUTH0',
  isSAML: (provider: IdentityProvider) => provider === 'SAML',
  isLDAP: (provider: IdentityProvider) => provider === 'LDAP',
  isOther: (provider: IdentityProvider) => provider === 'OTHER',
  
  isSocialProvider: (provider: IdentityProvider) => 
    provider === 'GOOGLE' || provider === 'FACEBOOK' || provider === 'TWITTER' || 
    provider === 'LINKEDIN' || provider === 'APPLE',
  isDevProvider: (provider: IdentityProvider) => 
    provider === 'GITHUB' || provider === 'GITLAB' || provider === 'BITBUCKET',
  isEnterpriseProvider: (provider: IdentityProvider) => 
    provider === 'OKTA' || provider === 'AUTH0' || provider === 'SAML' || provider === 'LDAP',
  isCommunicationProvider: (provider: IdentityProvider) => 
    provider === 'SLACK' || provider === 'DISCORD',
  isOAuthProvider: (provider: IdentityProvider) => 
    provider !== 'SAML' && provider !== 'LDAP' && provider !== 'OTHER',
};

export const IdentityStatusHelper = {
  ACTIVE: 'ACTIVE' as IdentityStatus,
  INACTIVE: 'INACTIVE' as IdentityStatus,
  SUSPENDED: 'SUSPENDED' as IdentityStatus,
  REVOKED: 'REVOKED' as IdentityStatus,

  isActive: (status: IdentityStatus) => status === 'ACTIVE',
  isInactive: (status: IdentityStatus) => status === 'INACTIVE',
  isSuspended: (status: IdentityStatus) => status === 'SUSPENDED',
  isRevoked: (status: IdentityStatus) => status === 'REVOKED',
  isUsable: (status: IdentityStatus) => status === 'ACTIVE',
  isNotUsable: (status: IdentityStatus) => status !== 'ACTIVE',
  canBeActivated: (status: IdentityStatus) => status === 'INACTIVE' || status === 'SUSPENDED',
  canBeSuspended: (status: IdentityStatus) => status === 'ACTIVE',
  canBeRevoked: (status: IdentityStatus) => status !== 'REVOKED',
};

// ==================== ENUMS - Match database CHECK constraints ====================

/**
 * Identity Provider Enum - 16 providers
 * CHECK constraint: provider IN ('GOOGLE', 'FACEBOOK', 'GITHUB', ...)
 */
export type IdentityProvider =
  | 'GOOGLE'
  | 'FACEBOOK'
  | 'GITHUB'
  | 'GITLAB'
  | 'BITBUCKET'
  | 'LINKEDIN'
  | 'TWITTER'
  | 'MICROSOFT'
  | 'APPLE'
  | 'SLACK'
  | 'DISCORD'
  | 'OKTA'
  | 'AUTH0'
  | 'SAML'
  | 'LDAP'
  | 'OTHER';

export const IDENTITY_PROVIDERS: IdentityProvider[] = [
  'GOOGLE', 'FACEBOOK', 'GITHUB', 'GITLAB', 'BITBUCKET', 'LINKEDIN',
  'TWITTER', 'MICROSOFT', 'APPLE', 'SLACK', 'DISCORD', 'OKTA',
  'AUTH0', 'SAML', 'LDAP', 'OTHER',
];

/**
 * Identity Status Enum - 4 statuses
 * CHECK constraint: status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED')
 */
export type IdentityStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'REVOKED';

export const IDENTITY_STATUSES: IdentityStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED'];

// ==================== PROVIDER PROFILE TYPE (JSONB) ====================

export interface ProviderProfile {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  locale?: string;
  verified?: boolean;
  raw?: Record<string, any>;
}

// ==================== MAIN INTERFACE - MATCHES DATABASE 100% ====================

/**
 * UserLinkedIdentity interface - MATCHES database schema 100% (20 fields)
 */
export interface UserLinkedIdentity {
  // I. IDENTITY (2)
  _id: string;                                    // uuid PRIMARY KEY
  user_id: string;                                // uuid FK to users NOT NULL

  // II. PROVIDER INFORMATION (6)
  provider: IdentityProvider;                     // varchar(50) NOT NULL with CHECK
  provider_user_id: string;                       // varchar(255) NOT NULL - unique with provider
  provider_username?: string | null;              // varchar(255)
  provider_email?: string | null;                 // varchar(255)
  provider_profile?: ProviderProfile | null;      // jsonb DEFAULT '{}'
  avatar_url?: string | null;                     // text

  // III. DISPLAY & STATUS (3)
  display_name?: string | null;                   // varchar(255)
  status: IdentityStatus;                         // varchar(20) NOT NULL DEFAULT 'ACTIVE' with CHECK
  is_verified: boolean;                           // boolean NOT NULL DEFAULT false

  // IV. IDENTITY FLAGS (2)
  is_primary: boolean;                            // boolean NOT NULL DEFAULT false
  last_used_at?: string | null;                   // timestamptz

  // V. METADATA & AUDIT (7)
  metadata?: Record<string, any> | null;          // jsonb DEFAULT '{}'
  created_at: string;                             // timestamptz NOT NULL DEFAULT now()
  updated_at: string;                             // timestamptz NOT NULL DEFAULT now()
  created_by?: string | null;                     // uuid
  updated_by?: string | null;                     // uuid

  // VI. SOFT DELETE (2)
  deleted_at?: string | null;                     // timestamptz - SOFT DELETE!
  deleted_by?: string | null;                     // uuid

  // VII. VERSIONING (1)
  version: number;                                // integer NOT NULL DEFAULT 1
}

// ==================== CREATE/UPDATE REQUEST INTERFACES ====================

export interface CreateLinkedIdentityRequest {
  user_id: string;                                // Required
  provider: IdentityProvider;                     // Required
  provider_user_id: string;                       // Required
  provider_username?: string;
  provider_email?: string;
  provider_profile?: ProviderProfile;
  avatar_url?: string;
  display_name?: string;
  status?: IdentityStatus;                        // Default 'ACTIVE' in database
  is_verified?: boolean;                          // Default false in database
  is_primary?: boolean;                           // Default false in database
  metadata?: Record<string, any>;                 // Default '{}' in database
  created_by?: string;
}

export interface UpdateLinkedIdentityRequest {
  provider_username?: string;
  provider_email?: string;
  provider_profile?: ProviderProfile;
  avatar_url?: string;
  display_name?: string;
  status?: IdentityStatus;
  is_verified?: boolean;
  is_primary?: boolean;
  last_used_at?: string;
  metadata?: Record<string, any>;
  updated_by?: string;
  version?: number;
}

// ==================== FILTERS ====================

export interface LinkedIdentityFilters extends BaseFilters {
  user_id?: string;
  provider?: IdentityProvider;
  status?: IdentityStatus;
  is_verified?: boolean;
  is_primary?: boolean;
  include_deleted?: boolean;
}

// ==================== ADAPTER & API ====================

const adapter = createAdapter<UserLinkedIdentity, CreateLinkedIdentityRequest, UpdateLinkedIdentityRequest>(
  'user_linked_identities',
  '/user-linked-identities',
  true  // ✅ FIX: Enable soft delete filtering
);

export const userLinkedIdentitiesApi = {
  // Basic CRUD
  getAll: (filters?: LinkedIdentityFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateLinkedIdentityRequest) => adapter.create(data),
  update: (id: string, data: UpdateLinkedIdentityRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),

  /**
   * Get all linked identities for a user
   */
  getByUserId: async (userId: string, includeDeleted: boolean = false): Promise<UserLinkedIdentity[]> => {
    return adapter.getAll({ user_id: userId, include_deleted: includeDeleted });
  },

  /**
   * Get identities by provider
   */
  getByProvider: async (provider: IdentityProvider): Promise<UserLinkedIdentity[]> => {
    return adapter.getAll({ provider });
  },

  /**
   * Get active identities for a user
   */
  getActiveByUserId: async (userId: string): Promise<UserLinkedIdentity[]> => {
    return adapter.getAll({ user_id: userId, status: 'ACTIVE' });
  },

  /**
   * Get primary identity for a user
   */
  getPrimaryByUserId: async (userId: string): Promise<UserLinkedIdentity | null> => {
    const identities = await adapter.getAll({ user_id: userId, is_primary: true });
    return identities[0] || null;
  },

  /**
   * Get verified identities for a user
   */
  getVerifiedByUserId: async (userId: string): Promise<UserLinkedIdentity[]> => {
    return adapter.getAll({ user_id: userId, is_verified: true });
  },

  /**
   * Get identity by provider and user
   */
  getByUserAndProvider: async (userId: string, provider: IdentityProvider): Promise<UserLinkedIdentity | null> => {
    const identities = await adapter.getAll({ user_id: userId, provider });
    return identities[0] || null;
  },

  /**
   * Set identity as primary
   */
  setPrimary: async (id: string): Promise<UserLinkedIdentity> => {
    // First, unset all other primary identities for this user
    const identity = await adapter.getById(id);
    const otherIdentities = await adapter.getAll({ 
      user_id: identity.user_id,
      is_primary: true,
    });
    
    // Unset other primary identities
    await Promise.all(
      otherIdentities
        .filter(i => i._id !== id)
        .map(i => adapter.update(i._id, { is_primary: false }))
    );
    
    // Set this identity as primary
    return adapter.update(id, { is_primary: true });
  },

  /**
   * Verify identity
   */
  verify: async (id: string): Promise<UserLinkedIdentity> => {
    return adapter.update(id, { is_verified: true });
  },

  /**
   * Unverify identity
   */
  unverify: async (id: string): Promise<UserLinkedIdentity> => {
    return adapter.update(id, { is_verified: false });
  },

  /**
   * Suspend identity
   */
  suspend: async (id: string, reason?: string): Promise<UserLinkedIdentity> => {
    return adapter.update(id, {
      status: 'SUSPENDED',
      metadata: { suspension_reason: reason },
    });
  },

  /**
   * Revoke identity
   */
  revoke: async (id: string, reason?: string): Promise<UserLinkedIdentity> => {
    return adapter.update(id, {
      status: 'REVOKED',
      metadata: { revocation_reason: reason },
    });
  },

  /**
   * Activate identity
   */
  activate: async (id: string): Promise<UserLinkedIdentity> => {
    return adapter.update(id, { status: 'ACTIVE' });
  },

  /**
   * Update last used timestamp
   */
  updateLastUsed: async (id: string): Promise<UserLinkedIdentity> => {
    return adapter.update(id, {
      last_used_at: new Date().toISOString(),
    });
  },

  /**
   * Soft delete (set deleted_at)
   */
  softDelete: async (id: string, deleted_by?: string): Promise<void> => {
    await adapter.update(id, {
      deleted_at: new Date().toISOString(),
      deleted_by,
      status: 'REVOKED',
    } as any);
  },

  /**
   * Hard delete (permanently remove from database)
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Restore soft-deleted identity
   */
  restore: async (id: string): Promise<UserLinkedIdentity> => {
    return adapter.update(id, {
      deleted_at: undefined,
      deleted_by: undefined,
      status: 'INACTIVE',
    } as any);
  },

  /**
   * Link new identity to user
   */
  linkIdentity: async (data: CreateLinkedIdentityRequest): Promise<UserLinkedIdentity> => {
    // Check if identity already exists
    const existing = await adapter.getAll({
      user_id: data.user_id,
      provider: data.provider,
    });

    if (existing.length > 0 && !existing[0].deleted_at) {
      throw new Error(`User already has a ${data.provider} identity linked`);
    }

    return adapter.create(data);
  },

  /**
   * Unlink identity from user
   */
  unlinkIdentity: async (userId: string, provider: IdentityProvider): Promise<void> => {
    const identity = await userLinkedIdentitiesApi.getByUserAndProvider(userId, provider);
    if (!identity) {
      throw new Error(`No ${provider} identity found for user`);
    }

    // Check if this is the last active identity
    const activeIdentities = await adapter.getAll({
      user_id: userId,
      status: 'ACTIVE',
    });

    if (activeIdentities.length === 1 && activeIdentities[0]._id === identity._id) {
      throw new Error('Cannot unlink the last active identity');
    }

    await userLinkedIdentitiesApi.softDelete(identity._id);
  },

  /**
   * Get identity count by provider
   */
  getCountByProvider: async (): Promise<Record<IdentityProvider, number>> => {
    const identities = await adapter.getAll({ status: 'ACTIVE' });
    const counts: Record<string, number> = {};

    IDENTITY_PROVIDERS.forEach(provider => {
      counts[provider] = identities.filter(i => i.provider === provider).length;
    });

    return counts as Record<IdentityProvider, number>;
  },

  /**
   * Get statistics for a user's identities
   */
  getUserStats: async (userId: string): Promise<{
    total: number;
    active: number;
    verified: number;
    primary: number;
    by_provider: Record<string, number>;
    last_used?: string;
  }> => {
    const identities = await adapter.getAll({ user_id: userId });

    const byProvider: Record<string, number> = {};
    identities.forEach(i => {
      byProvider[i.provider] = (byProvider[i.provider] || 0) + 1;
    });

    const lastUsedDates = identities
      .map(i => i.last_used_at)
      .filter(Boolean) as string[];
    const lastUsed = lastUsedDates.length > 0
      ? lastUsedDates.sort().reverse()[0]
      : undefined;

    return {
      total: identities.length,
      active: identities.filter(i => i.status === 'ACTIVE').length,
      verified: identities.filter(i => i.is_verified).length,
      primary: identities.filter(i => i.is_primary).length,
      by_provider: byProvider,
      last_used: lastUsed,
    };
  },

  /**
   * Bulk revoke identities
   */
  bulkRevoke: async (ids: string[], reason?: string): Promise<void> => {
    await Promise.all(
      ids.map(id => userLinkedIdentitiesApi.revoke(id, reason))
    );
  },

  /**
   * Sync provider profile
   */
  syncProviderProfile: async (id: string, profile: ProviderProfile): Promise<UserLinkedIdentity> => {
    return adapter.update(id, {
      provider_profile: profile,
      provider_email: profile.email,
      avatar_url: profile.avatar,
      display_name: profile.name,
      last_used_at: new Date().toISOString(),
    });
  },
};

export default userLinkedIdentitiesApi;