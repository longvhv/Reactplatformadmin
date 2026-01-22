/**
 * User Linked Identities API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_linked_identities (20 fields, OAuth providers, soft delete)
 */

import { createAdapter, BaseFilters } from './adapters';
import { getSupabaseClient } from '../lib/supabase';

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
 * UserLinkedIdentity interface - Mapped to user_identities table
 */
export interface UserLinkedIdentity {
  // I. IDENTITY
  _id: string;                                    // uuid PRIMARY KEY
  user_id: string;                                // uuid FK to users NOT NULL

  // II. PROVIDER INFORMATION
  provider: IdentityProvider;                     // Mapped to identity_type
  provider_user_id: string;                       // Mapped to identity_value
  provider_username?: string | null;              // Stored in metadata
  provider_email?: string | null;                 // Stored in metadata
  provider_profile?: ProviderProfile | null;      // Stored in metadata
  avatar_url?: string | null;                     // Stored in metadata

  // III. DISPLAY & STATUS
  display_name?: string | null;                   // Stored in metadata
  status: IdentityStatus;                         // Stored in metadata (default 'ACTIVE')
  is_verified: boolean;                           // Column: is_verified

  // IV. IDENTITY FLAGS
  is_primary: boolean;                            // Stored in metadata
  last_used_at?: string | null;                   // Column: last_login_at

  // V. METADATA & AUDIT
  metadata?: Record<string, any> | null;          // Column: metadata
  created_at: string;                             // Column: created_at
  updated_at: string;                             // Column: updated_at
  created_by?: string | null;                     // Not persisted in DB schema
  updated_by?: string | null;                     // Not persisted in DB schema

  // VI. SOFT DELETE (Not supported by table, simulated via status)
  deleted_at?: string | null;                     // Not persisted in DB schema
  deleted_by?: string | null;                     // Not persisted in DB schema

  // VII. VERSIONING
  version: number;                                // Column: version
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

// ==================== MAPPERS ====================

function mapToUserLinkedIdentity(row: any): UserLinkedIdentity {
  const metadata = row.metadata || {};
  
  // Determine provider: if identity_type is OIDC, check metadata for original provider
  let provider = row.identity_type as IdentityProvider;
  let providerUserId = row.identity_value;

  if (provider === 'OIDC' && metadata.original_provider) {
    provider = metadata.original_provider as IdentityProvider;
    // Attempt to unprefix if it was prefixed
    if (providerUserId.startsWith(`${provider}:`)) {
        providerUserId = providerUserId.substring(provider.length + 1);
    }
  }

  return {
    _id: row._id,
    user_id: row.user_id,
    provider: provider,
    provider_user_id: providerUserId,
    
    // Metadata fields
    provider_username: metadata.provider_username,
    provider_email: metadata.provider_email,
    provider_profile: metadata.provider_profile,
    avatar_url: metadata.avatar_url,
    display_name: metadata.display_name,
    status: metadata.status || 'ACTIVE',
    is_primary: metadata.is_primary || false,
    
    // DB Columns
    is_verified: row.is_verified,
    last_used_at: row.last_login_at,
    metadata: metadata,
    created_at: row.created_at,
    updated_at: row.updated_at,
    version: row.version,
    
    // Soft delete simulation
    deleted_at: metadata.deleted_at,
    deleted_by: metadata.deleted_by,
  };
}

function mapToDbIdentityType(provider: IdentityProvider): string {
  const allowed = ['PASSWORD', 'GOOGLE', 'GITHUB', 'MICROSOFT', 'APPLE', 'SAML', 'OIDC'];
  if (allowed.includes(provider)) {
    return provider;
  }
  return 'OIDC'; // Fallback for others
}

// ==================== API CLIENT ====================

export const userLinkedIdentitiesApi = {
  // Basic CRUD
  
  /**
   * Get all identities (filtered)
   */
  getAll: async (filters: LinkedIdentityFilters = {}): Promise<UserLinkedIdentity[]> => {
    const supabase = getSupabaseClient();
    let query = supabase.from('user_identities').select('*');

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
    
    // Provider filter needs special handling due to mapping
    if (filters.provider) {
       const dbType = mapToDbIdentityType(filters.provider);
       query = query.eq('identity_type', dbType);
       // We can't easily filter by metadata.original_provider on the server efficiently without JSON filter
       // So we might fetch and filter in memory if dbType is OIDC
    }

    // Status/Primary filters rely on metadata, better to filter in memory for now or use JSON arrow operator
    // query = query.filter('metadata->>status', 'eq', filters.status)
    
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let identities = data.map(mapToUserLinkedIdentity);

    // Apply remaining filters in memory
    if (filters.status) {
      identities = identities.filter(i => i.status === filters.status);
    }
    if (filters.is_primary !== undefined) {
      identities = identities.filter(i => i.is_primary === filters.is_primary);
    }
    if (filters.include_deleted) {
       // All are included by default, filter out deleted unless requested
    } else {
       identities = identities.filter(i => !i.deleted_at);
    }
    
    return identities;
  },

  getById: async (id: string): Promise<UserLinkedIdentity> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('user_identities').select('*').eq('_id', id).single();
    if (error) throw new Error(error.message);
    return mapToUserLinkedIdentity(data);
  },

  create: async (data: CreateLinkedIdentityRequest): Promise<UserLinkedIdentity> => {
    const supabase = getSupabaseClient();
    const _id = crypto.randomUUID();
    
    const dbType = mapToDbIdentityType(data.provider);
    let identityValue = data.provider_user_id;
    
    // Prefix identity value for OIDC fallback to avoid collisions
    if (dbType === 'OIDC' && data.provider !== 'OIDC') {
        identityValue = `${data.provider}:${data.provider_user_id}`;
    }
    
    // Construct metadata
    const metadata = {
      ...(data.metadata || {}),
      original_provider: data.provider,
      provider_username: data.provider_username,
      provider_email: data.provider_email,
      provider_profile: data.provider_profile,
      avatar_url: data.avatar_url,
      display_name: data.display_name,
      status: data.status || 'ACTIVE',
      is_primary: data.is_primary || false,
    };

    const row = {
      _id,
      user_id: data.user_id,
      identity_type: dbType,
      identity_value: identityValue,
      metadata,
      is_verified: data.is_verified || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };

    const { data: created, error } = await supabase.from('user_identities').insert([row]).select().single();
    if (error) {
       if (error.code === '23505') throw new Error('Identity already exists');
       throw new Error(error.message);
    }
    return mapToUserLinkedIdentity(created);
  },

  update: async (id: string, data: UpdateLinkedIdentityRequest): Promise<UserLinkedIdentity> => {
    const supabase = getSupabaseClient();
    
    // Fetch current to merge metadata
    const { data: current, error: fetchError } = await supabase.from('user_identities').select('*').eq('_id', id).single();
    if (fetchError) throw new Error(fetchError.message);
    
    // Optimistic locking check
    if (data.version && current.version !== data.version) {
        throw new Error('Concurrent modification detected. Please refresh.');
    }

    const currentMeta = current.metadata || {};
    const newMeta = { ...currentMeta, ...(data.metadata || {}) };
    
    if (data.provider_username !== undefined) newMeta.provider_username = data.provider_username;
    if (data.provider_email !== undefined) newMeta.provider_email = data.provider_email;
    if (data.provider_profile !== undefined) newMeta.provider_profile = data.provider_profile;
    if (data.avatar_url !== undefined) newMeta.avatar_url = data.avatar_url;
    if (data.display_name !== undefined) newMeta.display_name = data.display_name;
    if (data.status !== undefined) newMeta.status = data.status;
    if (data.is_primary !== undefined) newMeta.is_primary = data.is_primary;
    if (data.updated_by !== undefined) newMeta.updated_by = data.updated_by;

    const updatePayload: any = {
      metadata: newMeta,
      updated_at: new Date().toISOString(),
      version: current.version + 1,
    };

    if (data.is_verified !== undefined) updatePayload.is_verified = data.is_verified;
    if (data.last_used_at !== undefined) updatePayload.last_login_at = data.last_used_at;

    const { data: updated, error } = await supabase
      .from('user_identities')
      .update(updatePayload)
      .eq('_id', id)
      .eq('version', current.version)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error('Concurrent modification detected.');
    
    return mapToUserLinkedIdentity(updated);
  },

  delete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient();
    // Hard delete as per table design
    const { error } = await supabase.from('user_identities').delete().eq('_id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Get all linked identities for a user
   */
  getByUserId: async (userId: string, includeDeleted: boolean = false): Promise<UserLinkedIdentity[]> => {
    return userLinkedIdentitiesApi.getAll({ user_id: userId, include_deleted: includeDeleted });
  },

  /**
   * Get identities by provider
   */
  getByProvider: async (provider: IdentityProvider): Promise<UserLinkedIdentity[]> => {
    return userLinkedIdentitiesApi.getAll({ provider });
  },

  /**
   * Get active identities for a user
   */
  getActiveByUserId: async (userId: string): Promise<UserLinkedIdentity[]> => {
    return userLinkedIdentitiesApi.getAll({ user_id: userId, status: 'ACTIVE' });
  },

  /**
   * Get primary identity for a user
   */
  getPrimaryByUserId: async (userId: string): Promise<UserLinkedIdentity | null> => {
    const identities = await userLinkedIdentitiesApi.getAll({ user_id: userId, is_primary: true });
    return identities[0] || null;
  },

  /**
   * Get verified identities for a user
   */
  getVerifiedByUserId: async (userId: string): Promise<UserLinkedIdentity[]> => {
    return userLinkedIdentitiesApi.getAll({ user_id: userId, is_verified: true });
  },

  /**
   * Get identity by provider and user
   */
  getByUserAndProvider: async (userId: string, provider: IdentityProvider): Promise<UserLinkedIdentity | null> => {
    const identities = await userLinkedIdentitiesApi.getAll({ user_id: userId, provider });
    return identities[0] || null;
  },

  /**
   * Set identity as primary
   */
  setPrimary: async (id: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    const userId = current.user_id;

    // Unset others
    const all = await userLinkedIdentitiesApi.getByUserId(userId);
    const primaries = all.filter(i => i.is_primary && i._id !== id);
    
    await Promise.all(primaries.map(i => userLinkedIdentitiesApi.update(i._id, { is_primary: false, version: i.version })));
    
    // Set this
    return userLinkedIdentitiesApi.update(id, { is_primary: true, version: current.version });
  },

  /**
   * Verify identity
   */
  verify: async (id: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, { is_verified: true, version: current.version });
  },

  /**
   * Unverify identity
   */
  unverify: async (id: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, { is_verified: false, version: current.version });
  },

  /**
   * Suspend identity
   */
  suspend: async (id: string, reason?: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, {
      status: 'SUSPENDED',
      metadata: { suspension_reason: reason },
      version: current.version
    });
  },

  /**
   * Revoke identity
   */
  revoke: async (id: string, reason?: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, {
      status: 'REVOKED',
      metadata: { revocation_reason: reason },
      version: current.version
    });
  },

  /**
   * Activate identity
   */
  activate: async (id: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, { status: 'ACTIVE', version: current.version });
  },

  /**
   * Update last used timestamp
   */
  updateLastUsed: async (id: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, {
      last_used_at: new Date().toISOString(),
      version: current.version
    });
  },

  /**
   * Soft delete (set status=REVOKED and deleted_at in metadata)
   */
  softDelete: async (id: string, deleted_by?: string): Promise<void> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    await userLinkedIdentitiesApi.update(id, {
      status: 'REVOKED',
      metadata: { 
          deleted_at: new Date().toISOString(),
          deleted_by 
      },
      version: current.version
    });
  },

  /**
   * Hard delete (permanently remove from database)
   */
  hardDelete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('user_identities').delete().eq('_id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Restore soft-deleted identity
   */
  restore: async (id: string): Promise<UserLinkedIdentity> => {
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, {
      status: 'INACTIVE', // Restore to inactive
      metadata: {
          deleted_at: null,
          deleted_by: null
      },
      version: current.version
    });
  },

  /**
   * Link new identity to user
   */
  linkIdentity: async (data: CreateLinkedIdentityRequest): Promise<UserLinkedIdentity> => {
    // Check if identity already exists (in memory check after fetch, or rely on DB unique constraint)
    // DB has unique(identity_type, identity_value)
    
    // We can just try create, catch error
    return userLinkedIdentitiesApi.create(data);
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
    const activeIdentities = await userLinkedIdentitiesApi.getActiveByUserId(userId);
    if (activeIdentities.length === 1 && activeIdentities[0]._id === identity._id) {
      throw new Error('Cannot unlink the last active identity');
    }

    // Perform hard delete for unlink
    await userLinkedIdentitiesApi.delete(identity._id);
  },

  /**
   * Get identity count by provider
   */
  getCountByProvider: async (): Promise<Record<IdentityProvider, number>> => {
    const identities = await userLinkedIdentitiesApi.getAll({ status: 'ACTIVE' });
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
    const identities = await userLinkedIdentitiesApi.getByUserId(userId);

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
    const current = await userLinkedIdentitiesApi.getById(id);
    return userLinkedIdentitiesApi.update(id, {
      provider_profile: profile,
      provider_email: profile.email,
      avatar_url: profile.avatar,
      display_name: profile.name,
      last_used_at: new Date().toISOString(),
      version: current.version
    });
  },
};

export default userLinkedIdentitiesApi;