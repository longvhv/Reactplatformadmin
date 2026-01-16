/**
 * Tenant Invitations Service
 * Manages email-based invitations for tenant members
 * Security: Secure token generation, email validation, expiry checking
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';

// Types matching tenant_invitations table
export interface TenantInvitation {
  _id: string; // UUID primary key
  tenant_id: string; // UUID foreign key to tenants
  email: string; // Email address (validated format)
  role_ids: string[]; // Array of role IDs
  department_id?: string; // Optional department UUID
  token: string; // Unique invitation token (varchar 100)
  status: InvitationStatus; // PENDING/ACCEPTED/EXPIRED/REVOKED
  expires_at: string; // Expiry timestamp
  invited_by?: string; // UUID of inviting user
  created_at: string; // Creation timestamp
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface CreateInvitationInput {
  tenant_id: string;
  email: string;
  role_ids?: string[];
  department_id?: string;
  invited_by?: string;
  expires_in_days?: number; // Default: 7 days
}

export interface UpdateInvitationInput {
  role_ids?: string[];
  department_id?: string;
  expires_at?: string;
}

export interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
  byStatus: Record<InvitationStatus, number>;
}

export interface InvitationLink {
  token: string;
  url: string;
  expiresAt: string;
}

class TenantInvitationsService {
  private supabase = supabase;
  private table = 'tenant_invitations';
  private defaultExpiryDays = 7; // Default invitation validity
  private tokenLength = 48; // Characters for secure token

  /**
   * Generate secure random token
   * Format: 48-character hex string
   * @private
   */
  private generateToken(): string {
    const tokenBytes = new Uint8Array(24); // 24 bytes = 48 hex chars
    crypto.getRandomValues(tokenBytes);
    return Array.from(tokenBytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  /**
   * Validate email format
   * @private
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  }

  /**
   * Calculate expiry date
   * @private
   */
  private calculateExpiryDate(days: number = this.defaultExpiryDays): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  /**
   * Check if invitation is expired
   * @private
   */
  private isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Build invitation URL
   * @private
   */
  private buildInvitationUrl(token: string): string {
    // In production, this would use actual domain
    const baseUrl = window.location.origin;
    return `${baseUrl}/core/invitations/accept/${token}`;
  }

  /**
   * Get all invitations for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/invitations
   */
  async getByTenantId(tenantId: string): Promise<TenantInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByTenantId:', error);
      throw error;
    }
  }

  /**
   * Get single invitation by ID
   * Ready for: GET /api/v1/tenants/:tenantId/invitations/:id
   */
  async getById(id: string): Promise<TenantInvitation | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching invitation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Get invitation by token
   * Ready for: GET /api/v1/invitations/token/:token
   */
  async getByToken(token: string): Promise<TenantInvitation | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select('*')
        .eq('token', token)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching invitation by token:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getByToken:', error);
      throw error;
    }
  }

  /**
   * Get invitations by status
   * Ready for: GET /api/v1/tenants/:tenantId/invitations?status=PENDING
   */
  async getByStatus(
    tenantId: string, 
    status: InvitationStatus
  ): Promise<TenantInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations by status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByStatus:', error);
      throw error;
    }
  }

  /**
   * Create new invitation
   * Returns invitation with generated token and URL
   * Ready for: POST /api/v1/tenants/:tenantId/invitations
   */
  async create(input: CreateInvitationInput): Promise<TenantInvitation> {
    try {
      // Validate email
      if (!this.validateEmail(input.email)) {
        throw new Error('Invalid email format');
      }

      // Check if email already has pending invitation
      const existing = await this.getPendingByEmail(input.tenant_id, input.email);
      if (existing) {
        throw new Error('Active invitation already exists for this email');
      }

      // Generate token and expiry
      const token = this.generateToken();
      const expiresAt = this.calculateExpiryDate(input.expires_in_days);

      // Prepare data
      const invitationData = {
        tenant_id: input.tenant_id,
        email: input.email.toLowerCase().trim(),
        role_ids: input.role_ids || [],
        department_id: input.department_id || null,
        token,
        status: 'PENDING' as InvitationStatus,
        expires_at: expiresAt.toISOString(),
        invited_by: input.invited_by || null,
      };

      const { data, error } = await this.supabase
        .from(this.table)
        .insert([invitationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Get pending invitation by email
   * @private
   */
  private async getPendingByEmail(
    tenantId: string, 
    email: string
  ): Promise<TenantInvitation | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('email', email.toLowerCase().trim())
        .eq('status', 'PENDING')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getPendingByEmail:', error);
      return null;
    }
  }

  /**
   * Update invitation
   * Ready for: PUT /api/v1/tenants/:tenantId/invitations/:id
   */
  async update(id: string, input: UpdateInvitationInput): Promise<TenantInvitation> {
    try {
      const updateData: any = {};

      if (input.role_ids !== undefined) {
        updateData.role_ids = input.role_ids;
      }

      if (input.department_id !== undefined) {
        updateData.department_id = input.department_id || null;
      }

      if (input.expires_at !== undefined) {
        updateData.expires_at = input.expires_at;
      }

      const { data, error } = await this.supabase
        .from(this.table)
        .update(updateData)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invitation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete invitation
   * Ready for: DELETE /api/v1/tenants/:tenantId/invitations/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting invitation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Revoke invitation
   * Changes status to REVOKED
   * Ready for: POST /api/v1/tenants/:tenantId/invitations/:id/revoke
   */
  async revoke(id: string): Promise<TenantInvitation> {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .update({ status: 'REVOKED' })
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error revoking invitation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in revoke:', error);
      throw error;
    }
  }

  /**
   * Accept invitation
   * Changes status to ACCEPTED
   * Ready for: POST /api/v1/invitations/accept/:token
   */
  async accept(token: string): Promise<TenantInvitation> {
    try {
      // Get invitation by token
      const invitation = await this.getByToken(token);
      
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Check if already accepted
      if (invitation.status === 'ACCEPTED') {
        throw new Error('Invitation already accepted');
      }

      // Check if revoked
      if (invitation.status === 'REVOKED') {
        throw new Error('Invitation has been revoked');
      }

      // Check if expired
      if (this.isExpired(invitation.expires_at)) {
        // Auto-update to EXPIRED
        await this.supabase
          .from(this.table)
          .update({ status: 'EXPIRED' })
          .eq('_id', invitation._id);
        
        throw new Error('Invitation has expired');
      }

      // Accept invitation
      const { data, error } = await this.supabase
        .from(this.table)
        .update({ status: 'ACCEPTED' })
        .eq('_id', invitation._id)
        .select()
        .single();

      if (error) {
        console.error('Error accepting invitation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in accept:', error);
      throw error;
    }
  }

  /**
   * Resend invitation
   * Generates new token and extends expiry
   * Ready for: POST /api/v1/tenants/:tenantId/invitations/:id/resend
   */
  async resend(id: string, expiresInDays?: number): Promise<TenantInvitation> {
    try {
      // Get current invitation
      const current = await this.getById(id);
      if (!current) {
        throw new Error('Invitation not found');
      }

      // Can only resend PENDING or EXPIRED invitations
      if (current.status !== 'PENDING' && current.status !== 'EXPIRED') {
        throw new Error('Can only resend pending or expired invitations');
      }

      // Generate new token and expiry
      const newToken = this.generateToken();
      const newExpiry = this.calculateExpiryDate(expiresInDays);

      const { data, error } = await this.supabase
        .from(this.table)
        .update({
          token: newToken,
          status: 'PENDING',
          expires_at: newExpiry.toISOString(),
        })
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error resending invitation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in resend:', error);
      throw error;
    }
  }

  /**
   * Get invitation statistics for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/invitations/stats
   */
  async getStats(tenantId: string): Promise<InvitationStats> {
    try {
      const invitations = await this.getByTenantId(tenantId);

      // Auto-update expired invitations
      await this.updateExpiredStatuses(invitations);

      const stats: InvitationStats = {
        total: invitations.length,
        pending: 0,
        accepted: 0,
        expired: 0,
        revoked: 0,
        byStatus: {
          PENDING: 0,
          ACCEPTED: 0,
          EXPIRED: 0,
          REVOKED: 0,
        },
      };

      invitations.forEach(inv => {
        const status = this.isExpired(inv.expires_at) && inv.status === 'PENDING' 
          ? 'EXPIRED' 
          : inv.status;

        stats.byStatus[status]++;
        
        switch (status) {
          case 'PENDING':
            stats.pending++;
            break;
          case 'ACCEPTED':
            stats.accepted++;
            break;
          case 'EXPIRED':
            stats.expired++;
            break;
          case 'REVOKED':
            stats.revoked++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Update expired invitation statuses
   * @private
   */
  private async updateExpiredStatuses(
    invitations: TenantInvitation[]
  ): Promise<void> {
    const expiredIds = invitations
      .filter(inv => inv.status === 'PENDING' && this.isExpired(inv.expires_at))
      .map(inv => inv._id);

    if (expiredIds.length > 0) {
      await this.supabase
        .from(this.table)
        .update({ status: 'EXPIRED' })
        .in('_id', expiredIds);
    }
  }

  /**
   * Get pending invitations
   * Ready for: GET /api/v1/tenants/:tenantId/invitations/pending
   */
  async getPending(tenantId: string): Promise<TenantInvitation[]> {
    return this.getByStatus(tenantId, 'PENDING');
  }

  /**
   * Get accepted invitations
   * Ready for: GET /api/v1/tenants/:tenantId/invitations/accepted
   */
  async getAccepted(tenantId: string): Promise<TenantInvitation[]> {
    return this.getByStatus(tenantId, 'ACCEPTED');
  }

  /**
   * Get expired invitations
   * Ready for: GET /api/v1/tenants/:tenantId/invitations/expired
   */
  async getExpired(tenantId: string): Promise<TenantInvitation[]> {
    return this.getByStatus(tenantId, 'EXPIRED');
  }

  /**
   * Get revoked invitations
   * Ready for: GET /api/v1/tenants/:tenantId/invitations/revoked
   */
  async getRevoked(tenantId: string): Promise<TenantInvitation[]> {
    return this.getByStatus(tenantId, 'REVOKED');
  }

  /**
   * Bulk revoke invitations
   * Ready for: POST /api/v1/tenants/:tenantId/invitations/bulk-revoke
   */
  async bulkRevoke(ids: string[]): Promise<number> {
    try {
      const { error, count } = await this.supabase
        .from(this.table)
        .update({ status: 'REVOKED' })
        .in('_id', ids);

      if (error) {
        console.error('Error in bulk revoke:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in bulkRevoke:', error);
      throw error;
    }
  }

  /**
   * Bulk delete invitations
   * Ready for: POST /api/v1/tenants/:tenantId/invitations/bulk-delete
   */
  async bulkDelete(ids: string[]): Promise<number> {
    try {
      const { error, count } = await this.supabase
        .from(this.table)
        .delete()
        .in('_id', ids);

      if (error) {
        console.error('Error in bulk delete:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in bulkDelete:', error);
      throw error;
    }
  }

  /**
   * Get invitation link with token and URL
   */
  getInvitationLink(invitation: TenantInvitation): InvitationLink {
    return {
      token: invitation.token,
      url: this.buildInvitationUrl(invitation.token),
      expiresAt: invitation.expires_at,
    };
  }

  /**
   * Format status display
   */
  getStatusDisplay(status: InvitationStatus): string {
    const displays: Record<InvitationStatus, string> = {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      EXPIRED: 'Expired',
      REVOKED: 'Revoked',
    };
    return displays[status];
  }

  /**
   * Get status color class
   */
  getStatusColor(status: InvitationStatus): string {
    const colors: Record<InvitationStatus, string> = {
      PENDING: 'yellow',
      ACCEPTED: 'green',
      EXPIRED: 'gray',
      REVOKED: 'red',
    };
    return colors[status];
  }

  /**
   * Get time until expiry
   */
  getTimeUntilExpiry(expiresAt: string): string {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} left`;
    return 'Less than 1 minute';
  }

  /**
   * Get time since creation
   */
  getTimeSinceCreation(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = now.getTime() - created.getTime();

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Validate invitation before accepting
   */
  async validateInvitation(token: string): Promise<{
    valid: boolean;
    reason?: string;
    invitation?: TenantInvitation;
  }> {
    try {
      const invitation = await this.getByToken(token);

      if (!invitation) {
        return { valid: false, reason: 'Invitation not found' };
      }

      if (invitation.status === 'ACCEPTED') {
        return { valid: false, reason: 'Invitation already accepted' };
      }

      if (invitation.status === 'REVOKED') {
        return { valid: false, reason: 'Invitation has been revoked' };
      }

      if (this.isExpired(invitation.expires_at)) {
        return { valid: false, reason: 'Invitation has expired' };
      }

      return { valid: true, invitation };
    } catch (error) {
      console.error('Error in validateInvitation:', error);
      return { valid: false, reason: 'Error validating invitation' };
    }
  }
}

// Export singleton instance
export const tenantInvitationsService = new TenantInvitationsService();