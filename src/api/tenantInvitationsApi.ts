/**
 * Tenant Invitations API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Manages email-based invitations for tenant members
 * 
 * CRITICAL: Fully aligned with tenant_invitations database schema
 * Security: Secure token generation, email validation, expiry checking
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export const InvitationStatusHelper = {
  PENDING: 'PENDING' as InvitationStatus,
  ACCEPTED: 'ACCEPTED' as InvitationStatus,
  EXPIRED: 'EXPIRED' as InvitationStatus,
  REVOKED: 'REVOKED' as InvitationStatus,

  isPending: (status: InvitationStatus) => status === 'PENDING',
  isAccepted: (status: InvitationStatus) => status === 'ACCEPTED',
  isExpired: (status: InvitationStatus) => status === 'EXPIRED',
  isRevoked: (status: InvitationStatus) => status === 'REVOKED',
  isActive: (status: InvitationStatus) => status === 'PENDING',
  canResend: (status: InvitationStatus) => status === 'PENDING' || status === 'EXPIRED',
  canRevoke: (status: InvitationStatus) => status === 'PENDING',
};

// ==================== MAIN INTERFACE ====================

export interface TenantInvitation {
  // I. IDENTITY & RELATIONSHIPS
  _id: string;
  tenant_id: string;
  invited_by: string | null;
  department_id: string | null;

  // II. INVITATION DETAILS
  email: string; // varchar(255), validated format
  role_ids: string[]; // text[], default []
  token: string; // varchar(100), unique

  // III. STATUS & LIFECYCLE
  status: InvitationStatus;
  expires_at: string; // NOT NULL, must be > created_at
  created_at: string;
}

export interface InvitationWithDetails extends TenantInvitation {
  tenant_name?: string;
  inviter_name?: string;
  department_name?: string;
  days_until_expiry?: number | null;
  is_expiring_soon?: boolean; // Within 24 hours
  time_since_creation?: number; // In hours
}

// ==================== REQUEST INTERFACES ====================

export interface CreateInvitationRequest {
  // Required
  tenant_id: string;
  email: string;

  // Optional with defaults
  role_ids?: string[]; // default: []
  status?: InvitationStatus; // default: 'PENDING'
  expires_in_days?: number; // default: 7

  // Optional
  department_id?: string | null;
  invited_by?: string | null;
  token?: string; // Auto-generated if not provided
}

export interface UpdateInvitationRequest {
  email?: string;
  role_ids?: string[];
  department_id?: string | null;
  expires_at?: string;
}

export interface InvitationFilters extends BaseFilters {
  tenant_id?: string;
  status?: InvitationStatus;
  department_id?: string;
  invited_by?: string;
  email?: string; // Exact match
  search?: string; // Search in email
  expiring_soon?: boolean; // Client-side filter
  expired?: boolean; // Client-side filter
}

// ==================== INVITATION LINK ====================

export interface InvitationLink {
  token: string;
  url: string;
  expires_at: string;
}

// ==================== VALIDATION ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InvitationValidation {
  valid: boolean;
  reason?: string;
  invitation?: TenantInvitation;
}

// ==================== STATISTICS ====================

export interface InvitationStatistics {
  total_invitations: number;
  pending_invitations: number;
  accepted_invitations: number;
  expired_invitations: number;
  revoked_invitations: number;
  by_status: Record<InvitationStatus, number>;
  expiring_soon: number; // Within 24 hours
  avg_acceptance_time_hours: number | null; // Time from creation to acceptance
}

// ==================== ADAPTER ====================

const adapter = createAdapter<TenantInvitation, CreateInvitationRequest, UpdateInvitationRequest>(
  'tenant_invitations',
  '/tenant-invitations',
  false // No soft delete
);

// ==================== API CLIENT ====================

export const tenantInvitationsApi = {
  /**
   * GET /tenant-invitations
   * Fetch invitations with filters
   */
  getAll: async (filters?: InvitationFilters): Promise<TenantInvitation[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.invited_by) {
      query = query.eq('invited_by', filters.invited_by);
    }
    if (filters?.email) {
      query = query.eq('email', filters.email.toLowerCase().trim());
    }
    if (filters?.search) {
      query = query.ilike('email', `%${filters.search}%`);
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
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    let invitations = data || [];

    // Client-side filters
    if (filters?.expiring_soon) {
      invitations = invitations.filter((inv) => isExpiringSoon(inv));
    }
    if (filters?.expired) {
      invitations = invitations.filter((inv) => isExpired(inv.expires_at));
    }

    return invitations;
  },

  /**
   * GET /tenant-invitations/:id
   */
  getById: async (id: string): Promise<TenantInvitation> => {
    return adapter.getById(id);
  },

  /**
   * GET /tenant-invitations/:id/details
   * Get invitation with additional details
   */
  getByIdWithDetails: async (id: string): Promise<InvitationWithDetails> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get invitation
    const { data: invitation, error: invError } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('_id', id)
      .single();

    if (invError || !invitation) {
      throw new Error(`Invitation not found: ${invError?.message || 'Unknown error'}`);
    }

    // Get tenant name
    let tenant_name: string | undefined;
    if (invitation.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('_id', invitation.tenant_id)
        .single();
      tenant_name = tenant?.name;
    }

    // Get inviter name (if exists)
    let inviter_name: string | undefined;
    if (invitation.invited_by) {
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('_id', invitation.invited_by)
        .single();
      inviter_name = user?.name;
    }

    // Get department name (if exists)
    let department_name: string | undefined;
    if (invitation.department_id) {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('_id', invitation.department_id)
        .single();
      department_name = dept?.name;
    }

    const days_until_expiry = getDaysUntilExpiry(invitation.expires_at);
    const is_expiring_soon = isExpiringSoon(invitation);
    const time_since_creation = getHoursSinceCreation(invitation.created_at);

    return {
      ...invitation,
      tenant_name,
      inviter_name,
      department_name,
      days_until_expiry,
      is_expiring_soon,
      time_since_creation,
    } as InvitationWithDetails;
  },

  /**
   * GET /tenant-invitations/by-token/:token
   * Get invitation by token
   */
  getByToken: async (token: string): Promise<TenantInvitation | null> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get invitation: ${error.message}`);
    }

    return data || null;
  },

  /**
   * POST /tenant-invitations
   * Create new invitation with validation
   */
  create: async (data: CreateInvitationRequest): Promise<TenantInvitation> => {
    // Normalize email
    const normalizedEmail = normalizeEmail(data.email);

    // Validate
    const validation = tenantInvitationsApi.validate({
      ...data,
      email: normalizedEmail,
    });
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for existing pending invitation
    const existing = await tenantInvitationsApi.getPendingByEmail(data.tenant_id, normalizedEmail);
    if (existing) {
      throw new Error(`Active invitation already exists for ${normalizedEmail}`);
    }

    // Generate token if not provided
    const token = data.token || generateInvitationToken();

    // Calculate expiry
    const expiresInDays = data.expires_in_days || 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);

    // Apply defaults
    const requestData = {
      ...data,
      email: normalizedEmail,
      role_ids: data.role_ids || [], // default
      status: 'PENDING' as InvitationStatus, // default
      token,
      expires_at: expiryDate.toISOString(),
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /tenant-invitations/:id
   * Update invitation with validation
   */
  update: async (id: string, data: UpdateInvitationRequest): Promise<TenantInvitation> => {
    // Normalize email if provided
    let updateData = { ...data };
    if (data.email) {
      const normalizedEmail = normalizeEmail(data.email);

      // Validate email
      const validation = tenantInvitationsApi.validate({ email: normalizedEmail });
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      updateData.email = normalizedEmail;
    }

    // Validate expiry if provided
    if (data.expires_at) {
      const current = await tenantInvitationsApi.getById(id);
      if (new Date(data.expires_at) <= new Date(current.created_at)) {
        throw new Error('Expiry date must be after creation date');
      }
    }

    return adapter.update(id, updateData);
  },

  /**
   * DELETE /tenant-invitations/:id
   * Hard delete invitation
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /tenant-invitations/by-tenant/:tenantId
   * Get all invitations for tenant
   */
  getByTenant: async (tenantId: string): Promise<TenantInvitation[]> => {
    return tenantInvitationsApi.getAll({ tenant_id: tenantId });
  },

  /**
   * GET /tenant-invitations/by-status/:status
   * Get invitations by status
   */
  getByStatus: async (status: InvitationStatus, tenantId?: string): Promise<TenantInvitation[]> => {
    return tenantInvitationsApi.getAll({
      tenant_id: tenantId,
      status,
    });
  },

  /**
   * GET /tenant-invitations/pending
   * Get pending invitations
   */
  getPending: async (tenantId?: string): Promise<TenantInvitation[]> => {
    return tenantInvitationsApi.getByStatus('PENDING', tenantId);
  },

  /**
   * GET /tenant-invitations/accepted
   * Get accepted invitations
   */
  getAccepted: async (tenantId?: string): Promise<TenantInvitation[]> => {
    return tenantInvitationsApi.getByStatus('ACCEPTED', tenantId);
  },

  /**
   * GET /tenant-invitations/expired
   * Get expired invitations
   */
  getExpired: async (tenantId?: string): Promise<TenantInvitation[]> => {
    return tenantInvitationsApi.getByStatus('EXPIRED', tenantId);
  },

  /**
   * GET /tenant-invitations/revoked
   * Get revoked invitations
   */
  getRevoked: async (tenantId?: string): Promise<TenantInvitation[]> => {
    return tenantInvitationsApi.getByStatus('REVOKED', tenantId);
  },

  /**
   * GET /tenant-invitations/by-email/:email
   * Get pending invitation by email
   */
  getPendingByEmail: async (tenantId: string, email: string): Promise<TenantInvitation | null> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const normalizedEmail = normalizeEmail(email);

    const { data, error } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', normalizedEmail)
      .eq('status', 'PENDING')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get invitation: ${error.message}`);
    }

    return data || null;
  },

  /**
   * GET /tenant-invitations/expiring-soon
   * Get invitations expiring within 24 hours
   */
  getExpiringSoon: async (tenantId?: string): Promise<TenantInvitation[]> => {
    return tenantInvitationsApi.getAll({
      tenant_id: tenantId,
      status: 'PENDING',
      expiring_soon: true,
    });
  },

  /**
   * POST /tenant-invitations/:id/revoke
   * Revoke invitation (change status to REVOKED)
   */
  revoke: async (id: string): Promise<TenantInvitation> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tenant_invitations')
      .update({ status: 'REVOKED' })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to revoke invitation: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-invitations/accept/:token
   * Accept invitation by token
   */
  accept: async (token: string): Promise<TenantInvitation> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get invitation
    const invitation = await tenantInvitationsApi.getByToken(token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Validate
    const validation = await tenantInvitationsApi.validateInvitation(token);
    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid invitation');
    }

    // Accept
    const { data, error } = await supabase
      .from('tenant_invitations')
      .update({ status: 'ACCEPTED' })
      .eq('_id', invitation._id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to accept invitation: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-invitations/:id/resend
   * Resend invitation (regenerate token, extend expiry)
   */
  resend: async (id: string, expiresInDays: number = 7): Promise<TenantInvitation> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current invitation
    const current = await tenantInvitationsApi.getById(id);

    // Can only resend PENDING or EXPIRED
    if (!InvitationStatusHelper.canResend(current.status)) {
      throw new Error('Can only resend pending or expired invitations');
    }

    // Generate new token and expiry
    const newToken = generateInvitationToken();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + expiresInDays);

    const { data, error } = await supabase
      .from('tenant_invitations')
      .update({
        token: newToken,
        status: 'PENDING',
        expires_at: newExpiry.toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to resend invitation: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * PUT /tenant-invitations/:id/extend
   * Extend invitation expiry
   */
  extendExpiry: async (id: string, additionalDays: number): Promise<TenantInvitation> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const current = await tenantInvitationsApi.getById(id);
    const currentExpiry = new Date(current.expires_at);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);

    const { data, error } = await supabase
      .from('tenant_invitations')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to extend expiry: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /tenant-invitations/bulk-revoke
   * Bulk revoke invitations
   */
  bulkRevoke: async (ids: string[]): Promise<number> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { error, count } = await supabase
      .from('tenant_invitations')
      .update({ status: 'REVOKED' })
      .in('_id', ids);

    if (error) {
      throw new Error(`Failed to bulk revoke: ${error.message}`);
    }

    return count || 0;
  },

  /**
   * POST /tenant-invitations/bulk-delete
   * Bulk delete invitations
   */
  bulkDelete: async (ids: string[]): Promise<number> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { error, count } = await supabase
      .from('tenant_invitations')
      .delete()
      .in('_id', ids);

    if (error) {
      throw new Error(`Failed to bulk delete: ${error.message}`);
    }

    return count || 0;
  },

  /**
   * POST /tenant-invitations/mark-expired
   * Auto-update expired invitations
   */
  markExpired: async (tenantId?: string): Promise<number> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('tenant_invitations')
      .update({ status: 'EXPIRED' })
      .eq('status', 'PENDING')
      .lt('expires_at', new Date().toISOString());

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { error, count } = await query;

    if (error) {
      throw new Error(`Failed to mark expired: ${error.message}`);
    }

    return count || 0;
  },

  /**
   * GET /tenant-invitations/statistics
   * Get invitation statistics
   */
  getStatistics: async (tenantId?: string): Promise<InvitationStatistics> => {
    const invitations = await tenantInvitationsApi.getAll(tenantId ? { tenant_id: tenantId } : {});
    return calculateStatistics(invitations);
  },

  /**
   * GET /tenant-invitations/:id/link
   * Get invitation link
   */
  getInvitationLink: (invitation: TenantInvitation): InvitationLink => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/core/invitations/accept/${invitation.token}`;

    return {
      token: invitation.token,
      url,
      expires_at: invitation.expires_at,
    };
  },

  /**
   * POST /tenant-invitations/validate/:token
   * Validate invitation before accepting
   */
  validateInvitation: async (token: string): Promise<InvitationValidation> => {
    const invitation = await tenantInvitationsApi.getByToken(token);

    if (!invitation) {
      return { valid: false, reason: 'Invitation not found' };
    }

    if (invitation.status === 'ACCEPTED') {
      return { valid: false, reason: 'Invitation already accepted' };
    }

    if (invitation.status === 'REVOKED') {
      return { valid: false, reason: 'Invitation has been revoked' };
    }

    if (isExpired(invitation.expires_at)) {
      return { valid: false, reason: 'Invitation has expired' };
    }

    return { valid: true, invitation };
  },

  /**
   * Client-side validation
   */
  validate: (data: Partial<CreateInvitationRequest | UpdateInvitationRequest>): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate email
    if ('email' in data && data.email !== undefined) {
      if (!data.email || !data.email.trim()) {
        errors.push('Email không được để trống');
      } else if (!isValidEmail(data.email)) {
        errors.push('Email không đúng định dạng');
      }
    }

    // Validate tenant_id
    if ('tenant_id' in data && data.tenant_id !== undefined) {
      if (!data.tenant_id || !data.tenant_id.trim()) {
        errors.push('Tenant ID không được để trống');
      }
    }

    // Validate token length
    if ('token' in data && (data as any).token) {
      if ((data as any).token.length > 100) {
        errors.push('Token không được vượt quá 100 ký tự');
      }
    }

    // Validate expires_in_days
    if ('expires_in_days' in data && (data as any).expires_in_days !== undefined) {
      const days = (data as any).expires_in_days;
      if (days < 1) {
        errors.push('Thời hạn phải ít nhất 1 ngày');
      }
      if (days > 365) {
        warnings.push('Thời hạn vượt quá 1 năm');
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
 * Generate secure invitation token (48 chars hex)
 */
export function generateInvitationToken(): string {
  const tokenBytes = new Uint8Array(24); // 24 bytes = 48 hex chars
  crypto.getRandomValues(tokenBytes);
  return Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
}

/**
 * Check if invitation is expired
 */
export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Check if invitation is expiring soon (within 24 hours)
 */
export function isExpiringSoon(invitation: TenantInvitation): boolean {
  if (invitation.status !== 'PENDING') return false;

  const expiry = new Date(invitation.expires_at);
  const now = new Date();
  const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
}

/**
 * Calculate statistics from invitations array
 */
export function calculateStatistics(invitations: TenantInvitation[]): InvitationStatistics {
  const byStatus: Record<InvitationStatus, number> = {
    PENDING: 0,
    ACCEPTED: 0,
    EXPIRED: 0,
    REVOKED: 0,
  };

  let pendingCount = 0;
  let acceptedCount = 0;
  let expiredCount = 0;
  let revokedCount = 0;
  let expiringSoonCount = 0;
  let totalAcceptanceTime = 0;
  let acceptedWithTime = 0;

  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  invitations.forEach((invitation) => {
    // Count by status (check expiry for PENDING)
    let effectiveStatus = invitation.status;
    if (invitation.status === 'PENDING' && isExpired(invitation.expires_at)) {
      effectiveStatus = 'EXPIRED';
    }

    byStatus[effectiveStatus]++;

    switch (effectiveStatus) {
      case 'PENDING':
        pendingCount++;
        // Check if expiring soon
        if (new Date(invitation.expires_at) <= twentyFourHoursFromNow) {
          expiringSoonCount++;
        }
        break;
      case 'ACCEPTED':
        acceptedCount++;
        // Calculate acceptance time (placeholder - would need accepted_at timestamp)
        break;
      case 'EXPIRED':
        expiredCount++;
        break;
      case 'REVOKED':
        revokedCount++;
        break;
    }
  });

  const avgAcceptanceTime = acceptedWithTime > 0 ? totalAcceptanceTime / acceptedWithTime : null;

  return {
    total_invitations: invitations.length,
    pending_invitations: pendingCount,
    accepted_invitations: acceptedCount,
    expired_invitations: expiredCount,
    revoked_invitations: revokedCount,
    by_status: byStatus,
    expiring_soon: expiringSoonCount,
    avg_acceptance_time_hours: avgAcceptanceTime,
  };
}

/**
 * Get invitation status label
 */
export function getStatusLabel(status: InvitationStatus): string {
  const labels: Record<InvitationStatus, string> = {
    PENDING: 'Chờ xác nhận',
    ACCEPTED: 'Đã chấp nhận',
    EXPIRED: 'Đã hết hạn',
    REVOKED: 'Đã thu hồi',
  };
  return labels[status];
}

/**
 * Get invitation status color
 */
export function getStatusColor(status: InvitationStatus): string {
  const colors: Record<InvitationStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    REVOKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status];
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(expiresAt: string): number | null {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return days;
}

/**
 * Get hours since creation
 */
export function getHoursSinceCreation(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const hours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));

  return hours;
}

/**
 * Format time until expiry
 */
export function formatTimeUntilExpiry(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Đã hết hạn';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `Còn ${days} ngày`;
  if (hours > 0) return `Còn ${hours} giờ`;
  if (minutes > 0) return `Còn ${minutes} phút`;
  return 'Sắp hết hạn';
}

/**
 * Format time since creation
 */
export function formatTimeSinceCreation(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - created.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return 'Vừa xong';
}

export default tenantInvitationsApi;
