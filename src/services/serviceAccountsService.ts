/**
 * Service Accounts Service
 * Manages OAuth2-style service accounts with client credentials
 * Security: Client secrets are hashed before storage, shown only once
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';

// Types matching service_accounts table
export interface ServiceAccount {
  _id: string; // UUID primary key
  tenant_id: string; // UUID foreign key to tenants
  member_id: string; // UUID foreign key to tenant_members
  name: string; // Account name/description
  description?: string; // Optional detailed description
  client_id: string; // varchar(64) - unique client identifier
  client_secret_hash: string; // Hashed client secret
  is_active: boolean; // Active/inactive status
  created_at: string; // Creation timestamp
  updated_at: string; // Last update timestamp
  version: number; // Version number (default 1)
}

export interface CreateServiceAccountInput {
  tenant_id: string;
  member_id: string;
  name: string;
  description?: string;
}

export interface UpdateServiceAccountInput {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface GeneratedServiceAccount {
  serviceAccount: ServiceAccount;
  clientSecret: string; // Full secret shown only once
}

export interface ServiceAccountStats {
  total: number;
  active: number;
  inactive: number;
  byMember: Record<string, number>;
}

class ServiceAccountsService {
  private table = 'service_accounts';
  private clientIdPrefix = 'sa'; // Prefix for client IDs

  /**
   * Generate random client ID
   * Format: sa_[random]
   * Example: sa_abc123xyz789def456
   * @private
   */
  private generateClientId(): string {
    // Generate random string (40 chars to fit in varchar(64) with prefix)
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    const randomStr = Array.from(randomBytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    return `${this.clientIdPrefix}_${randomStr}`;
  }

  /**
   * Generate random client secret
   * Format: 64-character hex string
   * Example: abc123def456...
   * @private
   */
  private generateClientSecret(): string {
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    return Array.from(secretBytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  /**
   * Hash client secret using SHA-256
   * @private
   */
  private async hashClientSecret(secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get all service accounts for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/service-accounts
   */
  async getByTenantId(tenantId: string): Promise<ServiceAccount[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service accounts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByTenantId:', error);
      throw error;
    }
  }

  /**
   * Get single service account by ID
   * Ready for: GET /api/v1/tenants/:tenantId/service-accounts/:id
   */
  async getById(id: string): Promise<ServiceAccount | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching service account:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Get service accounts by member ID
   * Ready for: GET /api/v1/tenants/:tenantId/members/:memberId/service-accounts
   */
  async getByMemberId(memberId: string): Promise<ServiceAccount[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching service accounts by member:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByMemberId:', error);
      throw error;
    }
  }

  /**
   * Create new service account
   * Returns both the account record and the plain client secret (shown only once)
   * Ready for: POST /api/v1/tenants/:tenantId/service-accounts
   */
  async create(input: CreateServiceAccountInput): Promise<GeneratedServiceAccount> {
    try {
      // Validate name
      if (!input.name || input.name.trim().length === 0) {
        throw new Error('Service account name is required');
      }

      // Generate client credentials
      const clientId = this.generateClientId();
      const clientSecret = this.generateClientSecret();
      const clientSecretHash = await this.hashClientSecret(clientSecret);

      // Prepare data
      const accountData = {
        tenant_id: input.tenant_id,
        member_id: input.member_id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        is_active: true,
        version: 1,
      };

      const { data, error } = await supabase
        .from(this.table)
        .insert([accountData])
        .select()
        .single();

      if (error) {
        console.error('Error creating service account:', error);
        throw error;
      }

      return {
        serviceAccount: data,
        clientSecret, // Return plain secret only this once
      };
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update service account metadata
   * Ready for: PUT /api/v1/tenants/:tenantId/service-accounts/:id
   */
  async update(id: string, input: UpdateServiceAccountInput): Promise<ServiceAccount> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.name !== undefined) {
        if (input.name.trim().length === 0) {
          throw new Error('Service account name cannot be empty');
        }
        updateData.name = input.name.trim();
      }

      if (input.description !== undefined) {
        updateData.description = input.description?.trim() || null;
      }

      if (input.is_active !== undefined) {
        updateData.is_active = input.is_active;
      }

      // Increment version and implement Optimistic Locking
      const current = await this.getById(id);
      if (!current) {
        throw new Error('Service account not found');
      }
      updateData.version = current.version + 1;

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('_id', id)
        .eq('version', current.version) // Optimistic locking
        .select()
        .single();

      if (error) {
        console.error('Error updating service account:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
      }

      return data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete service account
   * Ready for: DELETE /api/v1/tenants/:tenantId/service-accounts/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting service account:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Activate service account
   * Ready for: POST /api/v1/tenants/:tenantId/service-accounts/:id/activate
   */
  async activate(id: string): Promise<ServiceAccount> {
    return this.update(id, { is_active: true });
  }

  /**
   * Deactivate service account
   * Ready for: POST /api/v1/tenants/:tenantId/service-accounts/:id/deactivate
   */
  async deactivate(id: string): Promise<ServiceAccount> {
    return this.update(id, { is_active: false });
  }

  /**
   * Reset client secret (generate new secret)
   * Deletes old credentials and creates new ones
   * Ready for: POST /api/v1/tenants/:tenantId/service-accounts/:id/reset-secret
   */
  async resetClientSecret(id: string): Promise<GeneratedServiceAccount> {
    try {
      // Get existing account
      const oldAccount = await this.getById(id);
      if (!oldAccount) {
        throw new Error('Service account not found');
      }

      // Generate new credentials
      const clientId = this.generateClientId();
      const clientSecret = this.generateClientSecret();
      const clientSecretHash = await this.hashClientSecret(clientSecret);

      // Update account with new credentials
      const updateData = {
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        updated_at: new Date().toISOString(),
        version: oldAccount.version + 1,
      };

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error resetting client secret:', error);
        throw error;
      }

      return {
        serviceAccount: data,
        clientSecret, // Return new plain secret only this once
      };
    } catch (error) {
      console.error('Error in resetClientSecret:', error);
      throw error;
    }
  }

  /**
   * Verify client credentials (authentication)
   * Used for OAuth2-style authentication
   * Ready for: POST /api/v1/auth/token (OAuth2 client_credentials grant)
   */
  async verifyCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<ServiceAccount | null> {
    try {
      // Hash the provided secret
      const secretHash = await this.hashClientSecret(clientSecret);

      // Find account by client_id and secret_hash
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('client_id', clientId)
        .eq('client_secret_hash', secretHash)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error verifying credentials:', error);
        throw error;
      }

      if (!data) return null;

      // Check if active
      if (!data.is_active) {
        console.warn('Service account is inactive:', clientId);
        return null;
      }

      // Update last access timestamp (in background)
      this.updateLastAccessed(data._id).catch(err =>
        console.error('Error updating last accessed:', err)
      );

      return data;
    } catch (error) {
      console.error('Error in verifyCredentials:', error);
      throw error;
    }
  }

  /**
   * Update last accessed timestamp
   * @private
   */
  private async updateLastAccessed(id: string): Promise<void> {
    await supabase
      .from(this.table)
      .update({ updated_at: new Date().toISOString() })
      .eq('_id', id);
  }

  /**
   * Get service account statistics for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/service-accounts/stats
   */
  async getStats(tenantId: string): Promise<ServiceAccountStats> {
    try {
      const accounts = await this.getByTenantId(tenantId);

      const stats: ServiceAccountStats = {
        total: accounts.length,
        active: accounts.filter(a => a.is_active).length,
        inactive: accounts.filter(a => !a.is_active).length,
        byMember: {},
      };

      // Count by member
      accounts.forEach(account => {
        stats.byMember[account.member_id] = 
          (stats.byMember[account.member_id] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get active service accounts
   * Ready for: GET /api/v1/tenants/:tenantId/service-accounts/active
   */
  async getActiveAccounts(tenantId: string): Promise<ServiceAccount[]> {
    try {
      const accounts = await this.getByTenantId(tenantId);
      return accounts.filter(a => a.is_active);
    } catch (error) {
      console.error('Error in getActiveAccounts:', error);
      throw error;
    }
  }

  /**
   * Get inactive service accounts
   * Ready for: GET /api/v1/tenants/:tenantId/service-accounts/inactive
   */
  async getInactiveAccounts(tenantId: string): Promise<ServiceAccount[]> {
    try {
      const accounts = await this.getByTenantId(tenantId);
      return accounts.filter(a => !a.is_active);
    } catch (error) {
      console.error('Error in getInactiveAccounts:', error);
      throw error;
    }
  }

  /**
   * Bulk activate service accounts
   * Ready for: POST /api/v1/tenants/:tenantId/service-accounts/bulk-activate
   */
  async bulkActivate(ids: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
        .from(this.table)
        .update({ 
          is_active: true, 
          updated_at: new Date().toISOString() 
        })
        .in('_id', ids);

      if (error) {
        console.error('Error in bulk activate:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in bulkActivate:', error);
      throw error;
    }
  }

  /**
   * Bulk deactivate service accounts
   * Ready for: POST /api/v1/tenants/:tenantId/service-accounts/bulk-deactivate
   */
  async bulkDeactivate(ids: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
        .from(this.table)
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .in('_id', ids);

      if (error) {
        console.error('Error in bulk deactivate:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in bulkDeactivate:', error);
      throw error;
    }
  }

  /**
   * Bulk delete service accounts
   * Ready for: POST /api/v1/tenants/:tenantId/service-accounts/bulk-delete
   */
  async bulkDelete(ids: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
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
   * Format client ID for display (partial masking)
   */
  formatClientIdDisplay(clientId: string): string {
    if (clientId.length <= 10) return clientId;
    const prefix = clientId.slice(0, 8);
    return `${prefix}••••••••`;
  }

  /**
   * Get display text for active status
   */
  getStatusDisplay(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  /**
   * Get time since last update
   */
  getTimeSinceUpdate(updatedAt: string): string {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diff = now.getTime() - updated.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Generate OAuth2 token format (for documentation)
   * This would typically be done by the backend OAuth2 server
   */
  generateTokenExample(clientId: string): string {
    return `Bearer ${clientId}_token_example`;
  }
}

// Export singleton instance
export const serviceAccountsService = new ServiceAccountsService();