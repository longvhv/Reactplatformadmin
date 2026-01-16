/**
 * User Delegations API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_delegations (20 fields, delegation lifecycle, revocation tracking)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPE HELPERS ====================

export const DelegationScopeHelper = {
  ADMIN: 'admin' as DelegationScope,
  MANAGER: 'manager' as DelegationScope,
  EDITOR: 'editor' as DelegationScope,
  VIEWER: 'viewer' as DelegationScope,
  APPROVER: 'approver' as DelegationScope,
  REVIEWER: 'reviewer' as DelegationScope,
  AUDITOR: 'auditor' as DelegationScope,
  CUSTOM: 'custom' as DelegationScope,

  isAdmin: (scope: DelegationScope) => scope === 'admin',
  isManager: (scope: DelegationScope) => scope === 'manager',
  isEditor: (scope: DelegationScope) => scope === 'editor',
  isViewer: (scope: DelegationScope) => scope === 'viewer',
  isApprover: (scope: DelegationScope) => scope === 'approver',
  isReviewer: (scope: DelegationScope) => scope === 'reviewer',
  isAuditor: (scope: DelegationScope) => scope === 'auditor',
  isCustom: (scope: DelegationScope) => scope === 'custom',
  hasWriteAccess: (scope: DelegationScope) => scope === 'admin' || scope === 'manager' || scope === 'editor',
  hasReadOnlyAccess: (scope: DelegationScope) => scope === 'viewer' || scope === 'reviewer' || scope === 'auditor',
  hasApprovalAccess: (scope: DelegationScope) => scope === 'approver' || scope === 'reviewer',
};

export const DelegationStatusHelper = {
  PENDING: 'pending' as DelegationStatus,
  ACTIVE: 'active' as DelegationStatus,
  EXPIRED: 'expired' as DelegationStatus,
  REVOKED: 'revoked' as DelegationStatus,
  SUSPENDED: 'suspended' as DelegationStatus,

  isPending: (status: DelegationStatus) => status === 'pending',
  isActive: (status: DelegationStatus) => status === 'active',
  isExpired: (status: DelegationStatus) => status === 'expired',
  isRevoked: (status: DelegationStatus) => status === 'revoked',
  isSuspended: (status: DelegationStatus) => status === 'suspended',
  isUsable: (status: DelegationStatus) => status === 'active' || status === 'pending',
  isTerminated: (status: DelegationStatus) => status === 'expired' || status === 'revoked' || status === 'suspended',
  canBeRevoked: (status: DelegationStatus) => status === 'active' || status === 'pending',
  canBeResumed: (status: DelegationStatus) => status === 'suspended',
};

// ==================== TYPES ====================

/**
 * Delegation Scope - 8 enum values from database
 */
export type DelegationScope = 
  | 'admin'
  | 'manager'
  | 'editor'
  | 'viewer'
  | 'approver'
  | 'reviewer'
  | 'auditor'
  | 'custom';

/**
 * Delegation Status - 5 enum values from database
 */
export type DelegationStatus = 
  | 'pending'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'suspended';

/**
 * UserDelegation - 100% matches user_delegations table (20 fields)
 */
export interface UserDelegation {
  // I. IDENTITY (1)
  _id: string;
  
  // II. RELATIONSHIPS (3)
  delegator_id: string;              // Who delegates (FK to users)
  delegate_id: string;               // Who receives delegation (FK to users)
  tenant_id?: string;                // Optional tenant context (FK to tenants)
  
  // III. DELEGATION DETAILS (4)
  scope?: DelegationScope;           // varchar(100) - SINGLE VALUE, NOT array!
  permissions?: string[];            // jsonb default '[]' - Array of permission strings
  reason?: string;                   // text - Why delegation created
  notes?: string;                    // text - Additional notes
  
  // IV. TIME PERIOD (2)
  start_date: string;                // timestamptz not null, default now()
  end_date?: string;                 // timestamptz nullable
  
  // V. STATUS & LIFECYCLE (5)
  status?: DelegationStatus;         // varchar(20) default 'active'
  activated_at?: string;             // timestamptz - When activated
  revoked_at?: string;               // timestamptz - When revoked
  revoked_by?: string;               // uuid - Who revoked (FK to users)
  revoked_reason?: string;           // text - Why revoked
  
  // VI. CONFIGURATION (2)
  auto_expire?: boolean;             // boolean default true - Auto expire at end_date
  notified_before_expiry?: boolean;  // boolean default false - Email notification sent
  
  // VII. METADATA & AUDIT (3)
  metadata?: Record<string, any>;    // jsonb default '{}'
  created_at: string;                // timestamptz not null
  updated_at?: string;               // timestamptz not null
}

/**
 * Create User Delegation Request
 */
export interface CreateDelegationRequest {
  delegator_id: string;
  delegate_id: string;
  tenant_id?: string;
  scope?: DelegationScope;           // Single value!
  permissions?: string[];            // Array of permissions
  reason?: string;
  notes?: string;
  start_date?: string;               // Default now()
  end_date?: string;
  status?: DelegationStatus;         // Default 'active' in DB
  auto_expire?: boolean;             // Default true in DB
  metadata?: Record<string, any>;
}

/**
 * Update User Delegation Request
 */
export interface UpdateDelegationRequest {
  scope?: DelegationScope;
  permissions?: string[];
  reason?: string;
  notes?: string;
  end_date?: string;
  status?: DelegationStatus;
  activated_at?: string;
  revoked_at?: string;
  revoked_by?: string;
  revoked_reason?: string;
  auto_expire?: boolean;
  notified_before_expiry?: boolean;
  metadata?: Record<string, any>;
}

/**
 * User Delegation Filters
 */
export interface DelegationFilters extends BaseFilters {
  delegator_id?: string;
  delegate_id?: string;
  tenant_id?: string;
  scope?: DelegationScope;
  status?: DelegationStatus;
  active_only?: boolean;             // Filter active delegations only
  expired_only?: boolean;            // Filter expired delegations only
  expiring_soon?: boolean;           // Filter delegations expiring within 7 days
  include_revoked?: boolean;         // Include revoked delegations
}

/**
 * UserDelegation with populated user data (for display)
 */
export interface UserDelegationWithUsers extends UserDelegation {
  delegator?: {
    _id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  delegate?: {
    _id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  revoked_by_user?: {
    _id: string;
    email: string;
    full_name?: string;
  };
  computed_status?: 'active' | 'pending' | 'expired' | 'revoked' | 'suspended';
  days_until_expiry?: number;
  is_expiring_soon?: boolean;
}

/**
 * Delegation Statistics
 */
export interface DelegationStats {
  total: number;
  by_status: {
    pending: number;
    active: number;
    expired: number;
    revoked: number;
    suspended: number;
  };
  by_scope: {
    admin: number;
    manager: number;
    editor: number;
    viewer: number;
    approver: number;
    reviewer: number;
    auditor: number;
    custom: number;
  };
  active_now: number;                // Currently active (started, not expired)
  expiring_soon: number;             // Expiring within 7 days
  expiring_today: number;            // Expiring today
  expired_recently: number;          // Expired in last 7 days
  revoked_recently: number;          // Revoked in last 7 days
  auto_expire_enabled: number;       // Count with auto_expire = true
  with_notifications: number;        // Count with notified_before_expiry = true
  avg_duration_days: number;         // Average delegation duration
  longest_active: {
    _id: string;
    delegator_id: string;
    delegate_id: string;
    days_active: number;
  } | null;
}

/**
 * Revoke Delegation Request
 */
export interface RevokeDelegationRequest {
  revoked_by: string;
  revoked_reason?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<UserDelegation, CreateDelegationRequest, UpdateDelegationRequest>(
  'user_delegations',
  '/user-delegations'
);

// ==================== API CLIENT ====================

export const userDelegationsApi = {
  /**
   * GET /user-delegations
   */
  getAll: async (filters?: DelegationFilters): Promise<UserDelegation[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /user-delegations/:id
   */
  getById: async (id: string): Promise<UserDelegation> => {
    return adapter.getById(id);
  },

  /**
   * POST /user-delegations
   */
  create: async (data: CreateDelegationRequest): Promise<UserDelegation> => {
    // Validate delegator != delegate
    if (data.delegator_id === data.delegate_id) {
      throw new Error('Delegator and delegate cannot be the same user');
    }
    
    // Validate dates
    if (data.end_date && data.start_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      if (end <= start) {
        throw new Error('End date must be after start date');
      }
    }
    
    return adapter.create(data);
  },

  /**
   * PATCH /user-delegations/:id
   */
  update: async (id: string, data: UpdateDelegationRequest): Promise<UserDelegation> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /user-delegations/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Activate delegation (set status to active)
   */
  activate: async (id: string): Promise<UserDelegation> => {
    return adapter.update(id, {
      status: 'active',
      activated_at: new Date().toISOString(),
    });
  },

  /**
   * Suspend delegation (set status to suspended)
   */
  suspend: async (id: string, reason?: string): Promise<UserDelegation> => {
    return adapter.update(id, {
      status: 'suspended',
      notes: reason,
    });
  },

  /**
   * Revoke delegation (set status to revoked)
   */
  revoke: async (id: string, request: RevokeDelegationRequest): Promise<UserDelegation> => {
    return adapter.update(id, {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: request.revoked_by,
      revoked_reason: request.revoked_reason,
    });
  },

  /**
   * Resume delegation (reactivate suspended delegation)
   */
  resume: async (id: string): Promise<UserDelegation> => {
    return adapter.update(id, {
      status: 'active',
    });
  },

  /**
   * Extend delegation (update end_date)
   */
  extend: async (id: string, newEndDate: string): Promise<UserDelegation> => {
    const delegation = await adapter.getById(id);
    
    // Validate new end date is after start date
    const start = new Date(delegation.start_date);
    const newEnd = new Date(newEndDate);
    
    if (newEnd <= start) {
      throw new Error('New end date must be after start date');
    }
    
    return adapter.update(id, {
      end_date: newEndDate,
    });
  },

  /**
   * Get active delegations
   */
  getActive: async (filters?: Omit<DelegationFilters, 'status'>): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      status: 'active',
      active_only: true,
    });
  },

  /**
   * Get pending delegations (not yet started)
   */
  getPending: async (filters?: Omit<DelegationFilters, 'status'>): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      status: 'pending',
    });
  },

  /**
   * Get expired delegations
   */
  getExpired: async (filters?: Omit<DelegationFilters, 'status'>): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      status: 'expired',
      expired_only: true,
    });
  },

  /**
   * Get revoked delegations
   */
  getRevoked: async (filters?: Omit<DelegationFilters, 'status'>): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      status: 'revoked',
      include_revoked: true,
    });
  },

  /**
   * Get expiring soon delegations (within 7 days)
   */
  getExpiringSoon: async (filters?: DelegationFilters): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      expiring_soon: true,
    });
  },

  /**
   * Get delegations by delegator
   */
  getByDelegator: async (delegatorId: string, filters?: DelegationFilters): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      delegator_id: delegatorId,
    });
  },

  /**
   * Get delegations by delegate
   */
  getByDelegate: async (delegateId: string, filters?: DelegationFilters): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      delegate_id: delegateId,
    });
  },

  /**
   * Get delegations by tenant
   */
  getByTenant: async (tenantId: string, filters?: DelegationFilters): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      tenant_id: tenantId,
    });
  },

  /**
   * Get delegations by scope
   */
  getByScope: async (scope: DelegationScope, filters?: DelegationFilters): Promise<UserDelegation[]> => {
    return adapter.getAll({
      ...filters,
      scope,
    });
  },

  /**
   * Get delegation statistics
   */
  getStats: async (filters?: DelegationFilters): Promise<DelegationStats> => {
    const delegations = await adapter.getAll(filters);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Count by status
    const byStatus = {
      pending: delegations.filter(d => d.status === 'pending').length,
      active: delegations.filter(d => d.status === 'active').length,
      expired: delegations.filter(d => d.status === 'expired').length,
      revoked: delegations.filter(d => d.status === 'revoked').length,
      suspended: delegations.filter(d => d.status === 'suspended').length,
    };

    // Count by scope
    const byScope = {
      admin: delegations.filter(d => d.scope === 'admin').length,
      manager: delegations.filter(d => d.scope === 'manager').length,
      editor: delegations.filter(d => d.scope === 'editor').length,
      viewer: delegations.filter(d => d.scope === 'viewer').length,
      approver: delegations.filter(d => d.scope === 'approver').length,
      reviewer: delegations.filter(d => d.scope === 'reviewer').length,
      auditor: delegations.filter(d => d.scope === 'auditor').length,
      custom: delegations.filter(d => d.scope === 'custom').length,
    };

    // Active now (started and not expired)
    const activeNow = delegations.filter(d => {
      const started = new Date(d.start_date) <= now;
      const notExpired = !d.end_date || new Date(d.end_date) > now;
      return d.status === 'active' && started && notExpired;
    }).length;

    // Expiring soon (within 7 days)
    const expiringSoon = delegations.filter(d => {
      if (!d.end_date) return false;
      const endDate = new Date(d.end_date);
      return d.status === 'active' && endDate > now && endDate <= sevenDaysFromNow;
    }).length;

    // Expiring today
    const expiringToday = delegations.filter(d => {
      if (!d.end_date) return false;
      const endDate = new Date(d.end_date);
      return d.status === 'active' && endDate > now && endDate <= todayEnd;
    }).length;

    // Expired recently (in last 7 days)
    const expiredRecently = delegations.filter(d => {
      if (!d.end_date) return false;
      const endDate = new Date(d.end_date);
      return d.status === 'expired' && endDate >= sevenDaysAgo && endDate <= now;
    }).length;

    // Revoked recently (in last 7 days)
    const revokedRecently = delegations.filter(d => {
      if (!d.revoked_at) return false;
      const revokedAt = new Date(d.revoked_at);
      return d.status === 'revoked' && revokedAt >= sevenDaysAgo;
    }).length;

    // Auto expire enabled
    const autoExpireEnabled = delegations.filter(d => d.auto_expire === true).length;

    // With notifications
    const withNotifications = delegations.filter(d => d.notified_before_expiry === true).length;

    // Average duration
    let totalDays = 0;
    let countWithDuration = 0;
    delegations.forEach(d => {
      if (d.end_date) {
        const start = new Date(d.start_date);
        const end = new Date(d.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
        countWithDuration++;
      }
    });
    const avgDurationDays = countWithDuration > 0 ? Math.round(totalDays / countWithDuration) : 0;

    // Longest active delegation
    let longestActive: DelegationStats['longest_active'] = null;
    let maxDays = 0;
    delegations
      .filter(d => d.status === 'active')
      .forEach(d => {
        const start = new Date(d.start_date);
        const days = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (days > maxDays) {
          maxDays = days;
          longestActive = {
            _id: d._id,
            delegator_id: d.delegator_id,
            delegate_id: d.delegate_id,
            days_active: days,
          };
        }
      });

    return {
      total: delegations.length,
      by_status: byStatus,
      by_scope: byScope,
      active_now: activeNow,
      expiring_soon: expiringSoon,
      expiring_today: expiringToday,
      expired_recently: expiredRecently,
      revoked_recently: revokedRecently,
      auto_expire_enabled: autoExpireEnabled,
      with_notifications: withNotifications,
      avg_duration_days: avgDurationDays,
      longest_active: longestActive,
    };
  },

  /**
   * Check if delegation exists between two users
   */
  exists: async (delegatorId: string, delegateId: string, tenantId?: string): Promise<boolean> => {
    const delegations = await adapter.getAll({
      delegator_id: delegatorId,
      delegate_id: delegateId,
      tenant_id: tenantId,
    });
    return delegations.length > 0;
  },

  /**
   * Check if user can delegate to another user
   */
  canDelegate: async (delegatorId: string, delegateId: string): Promise<{
    can_delegate: boolean;
    reason?: string;
  }> => {
    // Cannot delegate to self
    if (delegatorId === delegateId) {
      return { can_delegate: false, reason: 'Cannot delegate to yourself' };
    }

    // Check if delegation already exists
    const exists = await userDelegationsApi.exists(delegatorId, delegateId);
    if (exists) {
      return { can_delegate: false, reason: 'Delegation already exists' };
    }

    // TODO: Check in Golang backend if user has permission to delegate
    // SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission = 'delegate'

    return { can_delegate: true };
  },

  /**
   * Bulk activate delegations
   */
  bulkActivate: async (ids: string[]): Promise<void> => {
    const activated_at = new Date().toISOString();
    await Promise.all(
      ids.map(id => adapter.update(id, { status: 'active', activated_at }))
    );
  },

  /**
   * Bulk revoke delegations
   */
  bulkRevoke: async (ids: string[], request: RevokeDelegationRequest): Promise<void> => {
    const revoked_at = new Date().toISOString();
    await Promise.all(
      ids.map(id => adapter.update(id, {
        status: 'revoked',
        revoked_at,
        revoked_by: request.revoked_by,
        revoked_reason: request.revoked_reason,
      }))
    );
  },

  /**
   * Bulk delete delegations
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => adapter.delete(id)));
  },

  /**
   * Clone delegation (create copy with new dates)
   */
  clone: async (id: string, newStartDate: string, newEndDate?: string): Promise<UserDelegation> => {
    const original = await adapter.getById(id);
    
    return adapter.create({
      delegator_id: original.delegator_id,
      delegate_id: original.delegate_id,
      tenant_id: original.tenant_id,
      scope: original.scope,
      permissions: original.permissions,
      reason: original.reason,
      notes: original.notes ? `${original.notes} (Cloned)` : undefined,
      start_date: newStartDate,
      end_date: newEndDate,
      auto_expire: original.auto_expire,
      metadata: original.metadata ? { ...original.metadata, cloned_from: id } : { cloned_from: id },
    });
  },

  /**
   * Get delegations with user data
   */
  getWithUsers: async (filters?: DelegationFilters): Promise<UserDelegationWithUsers[]> => {
    // TODO: Implement in Golang backend with JOINs
    // SELECT d.*, 
    //   delegator.email as delegator_email, delegator.full_name as delegator_name,
    //   delegate.email as delegate_email, delegate.full_name as delegate_name
    // FROM user_delegations d
    // LEFT JOIN users delegator ON d.delegator_id = delegator._id
    // LEFT JOIN users delegate ON d.delegate_id = delegate._id
    
    const delegations = await adapter.getAll(filters);
    return delegations as UserDelegationWithUsers[];
  },

  /**
   * Mark as notified before expiry
   */
  markNotified: async (id: string): Promise<UserDelegation> => {
    return adapter.update(id, {
      notified_before_expiry: true,
    });
  },

  /**
   * Process expired delegations (set status to expired)
   * Should be called by cron job
   */
  processExpired: async (): Promise<number> => {
    const now = new Date().toISOString();
    
    // Get active delegations with end_date in the past
    const delegations = await adapter.getAll({
      status: 'active',
    });
    
    const expired = delegations.filter(d => 
      d.end_date && d.auto_expire && new Date(d.end_date) <= new Date()
    );
    
    // Update status to expired
    await Promise.all(
      expired.map(d => adapter.update(d._id, { status: 'expired' }))
    );
    
    return expired.length;
  },

  /**
   * Send expiry notifications
   * Should be called by cron job
   */
  sendExpiryNotifications: async (daysBeforeExpiry: number = 7): Promise<number> => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);
    
    // Get active delegations expiring soon that haven't been notified
    const delegations = await adapter.getAll({
      status: 'active',
      expiring_soon: true,
    });
    
    const toNotify = delegations.filter(d => 
      !d.notified_before_expiry && 
      d.end_date &&
      new Date(d.end_date) <= futureDate
    );
    
    // TODO: Send email notifications via backend
    // Mark as notified
    await Promise.all(
      toNotify.map(d => userDelegationsApi.markNotified(d._id))
    );
    
    return toNotify.length;
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get status color for UI
 */
export function getStatusColor(status?: DelegationStatus): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    revoked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[status || 'pending'];
}

/**
 * Get scope color for UI
 */
export function getScopeColor(scope?: DelegationScope): string {
  const colors = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    editor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    approver: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    reviewer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    auditor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    custom: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return colors[scope || 'viewer'];
}

/**
 * Format date for display
 */
export function formatDate(date?: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date?: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days until expiry
 */
export function getDaysUntilExpiry(endDate?: string): number | null {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if delegation is expiring soon (within 7 days)
 */
export function isExpiringSoon(endDate?: string): boolean {
  const days = getDaysUntilExpiry(endDate);
  return days !== null && days > 0 && days <= 7;
}

/**
 * Check if delegation is expired
 */
export function isExpired(endDate?: string): boolean {
  const days = getDaysUntilExpiry(endDate);
  return days !== null && days < 0;
}

/**
 * Compute current status based on dates
 */
export function computeStatus(delegation: UserDelegation): DelegationStatus {
  // If explicitly revoked or suspended, use that
  if (delegation.status === 'revoked' || delegation.status === 'suspended') {
    return delegation.status;
  }

  const now = new Date();
  const start = new Date(delegation.start_date);
  
  // Not started yet
  if (start > now) {
    return 'pending';
  }
  
  // Check if expired
  if (delegation.end_date) {
    const end = new Date(delegation.end_date);
    if (end < now) {
      return 'expired';
    }
  }
  
  // Currently active
  return 'active';
}

/**
 * Validate delegation dates
 */
export function validateDates(startDate: string, endDate?: string): {
  valid: boolean;
  error?: string;
} {
  const start = new Date(startDate);
  
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  
  if (endDate) {
    const end = new Date(endDate);
    
    if (isNaN(end.getTime())) {
      return { valid: false, error: 'Invalid end date' };
    }
    
    if (end <= start) {
      return { valid: false, error: 'End date must be after start date' };
    }
  }
  
  return { valid: true };
}

/**
 * Get delegation duration in days
 */
export function getDurationDays(startDate: string, endDate?: string): number | null {
  if (!endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Filter delegations by date range
 */
export function filterByDateRange(
  delegations: UserDelegation[],
  startDate?: string,
  endDate?: string
): UserDelegation[] {
  let result = [...delegations];
  
  if (startDate) {
    const start = new Date(startDate);
    result = result.filter(d => new Date(d.start_date) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    result = result.filter(d => {
      if (!d.end_date) return true;
      return new Date(d.end_date) <= end;
    });
  }
  
  return result;
}

export default userDelegationsApi;