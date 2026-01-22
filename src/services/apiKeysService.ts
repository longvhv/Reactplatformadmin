/**
 * API Keys Service
 * Manages API key generation, hashing, and lifecycle for tenants
 * Security: Keys are hashed before storage, shown only once on creation
 * Ready for migration to Golang microservice backend
 */

import { supabase } from '../utils/supabase/client';

// Types matching api_keys table
export interface ApiKey {
  _id: string; // UUID primary key
  tenant_id: string; // UUID foreign key to tenants
  name: string; // Key name/description
  key_prefix: string; // varchar(10) - visible prefix (e.g., "vhv_abc...")
  key_hash: string; // Hashed key for verification
  scopes: string[]; // Array of permission scopes
  allowed_ips: string[]; // Array of CIDR notation IPs
  expires_at?: string; // Optional expiration timestamp
  last_used_at?: string; // Last usage timestamp
  created_at: string; // Creation timestamp
  created_by?: string; // UUID of creator
  version: number; // Version number (default 1)
}

export interface CreateApiKeyInput {
  tenant_id: string;
  name: string;
  scopes?: string[];
  allowed_ips?: string[];
  expires_at?: string; // ISO date string
  created_by?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  scopes?: string[];
  allowed_ips?: string[];
  expires_at?: string;
}

export interface GeneratedApiKey {
  apiKey: ApiKey;
  plainKey: string; // Full key shown only once
}

export interface ApiKeyStats {
  total: number;
  active: number;
  expired: number;
  neverUsed: number;
  byScope: Record<string, number>;
}

// Available scopes for API keys
export const AVAILABLE_SCOPES = [
  'read:tenants',
  'write:tenants',
  'read:users',
  'write:users',
  'read:roles',
  'write:roles',
  'read:domains',
  'write:domains',
  'read:webhooks',
  'write:webhooks',
  'read:analytics',
  'admin:all',
] as const;

export type ApiKeyScope = typeof AVAILABLE_SCOPES[number];

class ApiKeysService {
  private table = 'api_keys';
  private keyPrefix = 'vhv'; // Prefix for all keys

  /**
   * Generate random API key
   * Format: vhv_[prefix]_[secret]
   * Example: vhv_abc123_xyz789abc...
   * @private
   */
  private generateApiKey(): { fullKey: string; prefix: string; secret: string } {
    // Generate prefix (6 chars)
    const prefixBytes = new Uint8Array(3);
    crypto.getRandomValues(prefixBytes);
    const prefix = Array.from(prefixBytes, byte => byte.toString(36)).join('').slice(0, 6);

    // Generate secret (32 chars)
    const secretBytes = new Uint8Array(24);
    crypto.getRandomValues(secretBytes);
    const secret = Array.from(secretBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    const fullKey = `${this.keyPrefix}_${prefix}_${secret}`;
    
    return { fullKey, prefix: `${this.keyPrefix}_${prefix}`, secret };
  }

  /**
   * Hash API key using SHA-256
   * @private
   */
  private async hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate IP address format (CIDR notation)
   * @private
   */
  private validateIpAddress(ip: string): boolean {
    // Simple CIDR validation
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    return cidrRegex.test(ip);
  }

  /**
   * Validate scopes
   * @private
   */
  private validateScopes(scopes: string[]): boolean {
    return scopes.every(scope => AVAILABLE_SCOPES.includes(scope as ApiKeyScope));
  }

  /**
   * Check if API key is expired
   * @private
   */
  private isExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  /**
   * Get all API keys for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/api-keys
   */
  async getByTenantId(tenantId: string): Promise<ApiKey[]> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByTenantId:', error);
      throw error;
    }
  }

  /**
   * Get single API key by ID
   * Ready for: GET /api/v1/tenants/:tenantId/api-keys/:id
   */
  async getById(id: string): Promise<ApiKey | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('_id', id)
        .single();

      if (error) {
        console.error('Error fetching API key:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  /**
   * Create new API key
   * Returns both the key record and the plain key (shown only once)
   * Ready for: POST /api/v1/tenants/:tenantId/api-keys
   */
  async create(input: CreateApiKeyInput): Promise<GeneratedApiKey> {
    try {
      // Validate name
      if (!input.name || input.name.trim().length === 0) {
        throw new Error('API key name is required');
      }

      // Validate scopes
      if (input.scopes && !this.validateScopes(input.scopes)) {
        throw new Error('Invalid scopes provided');
      }

      // Validate IPs
      if (input.allowed_ips) {
        const invalidIps = input.allowed_ips.filter(ip => !this.validateIpAddress(ip));
        if (invalidIps.length > 0) {
          throw new Error(`Invalid IP addresses: ${invalidIps.join(', ')}`);
        }
      }

      // Generate API key
      const { fullKey, prefix } = this.generateApiKey();
      const keyHash = await this.hashApiKey(fullKey);

      // Generate UUID for _id (browser-compatible)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Prepare data
      const keyData = {
        _id: generateUUID(), // ✅ FIX: Generate UUID for _id (browser-compatible)
        tenant_id: input.tenant_id,
        name: input.name.trim(),
        key_prefix: prefix,
        key_hash: keyHash,
        scopes: input.scopes || [],
        allowed_ips: input.allowed_ips || [],
        expires_at: input.expires_at || null,
        created_by: input.created_by || null,
        version: 1,
      };

      const { data, error } = await supabase
        .from(this.table)
        .insert([keyData])
        .select()
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        throw error;
      }

      return {
        apiKey: data,
        plainKey: fullKey, // Return plain key only this once
      };
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Update API key metadata (not the key itself)
   * Ready for: PUT /api/v1/tenants/:tenantId/api-keys/:id
   */
  async update(id: string, input: UpdateApiKeyInput): Promise<ApiKey> {
    try {
      const updateData: any = {};

      if (input.name !== undefined) {
        if (input.name.trim().length === 0) {
          throw new Error('API key name cannot be empty');
        }
        updateData.name = input.name.trim();
      }

      if (input.scopes !== undefined) {
        if (!this.validateScopes(input.scopes)) {
          throw new Error('Invalid scopes provided');
        }
        updateData.scopes = input.scopes;
      }

      if (input.allowed_ips !== undefined) {
        const invalidIps = input.allowed_ips.filter(ip => !this.validateIpAddress(ip));
        if (invalidIps.length > 0) {
          throw new Error(`Invalid IP addresses: ${invalidIps.join(', ')}`);
        }
        updateData.allowed_ips = input.allowed_ips;
      }

      if (input.expires_at !== undefined) {
        updateData.expires_at = input.expires_at;
      }

      // Increment version and implement Optimistic Locking
      const current = await this.getById(id);
      if (!current) {
        throw new Error('API key not found');
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
        console.error('Error updating API key:', error);
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
   * Delete (revoke) API key
   * Ready for: DELETE /api/v1/tenants/:tenantId/api-keys/:id
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('_id', id);

      if (error) {
        console.error('Error deleting API key:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Verify API key (check hash)
   * Used for authentication
   * Ready for: POST /api/v1/auth/verify-key
   */
  async verifyKey(plainKey: string): Promise<ApiKey | null> {
    try {
      const keyHash = await this.hashApiKey(plainKey);

      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('key_hash', keyHash)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error verifying API key:', error);
        throw error;
      }

      if (!data) return null;

      // Check if expired
      if (this.isExpired(data.expires_at)) {
        return null;
      }

      // Update last_used_at (in background, don't wait)
      this.updateLastUsed(data._id).catch(err => 
        console.error('Error updating last_used_at:', err)
      );

      return data;
    } catch (error) {
      console.error('Error in verifyKey:', error);
      throw error;
    }
  }

  /**
   * Update last_used_at timestamp
   * @private
   */
  private async updateLastUsed(id: string): Promise<void> {
    await supabase
      .from(this.table)
      .update({ last_used_at: new Date().toISOString() })
      .eq('_id', id);
  }

  /**
   * Get API key statistics for a tenant
   * Ready for: GET /api/v1/tenants/:tenantId/api-keys/stats
   */
  async getStats(tenantId: string): Promise<ApiKeyStats> {
    try {
      const keys = await this.getByTenantId(tenantId);
      const now = new Date();

      const stats: ApiKeyStats = {
        total: keys.length,
        active: keys.filter(k => !this.isExpired(k.expires_at)).length,
        expired: keys.filter(k => this.isExpired(k.expires_at)).length,
        neverUsed: keys.filter(k => !k.last_used_at).length,
        byScope: {},
      };

      // Count by scope
      keys.forEach(key => {
        key.scopes.forEach(scope => {
          stats.byScope[scope] = (stats.byScope[scope] || 0) + 1;
        });
      });

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  /**
   * Get active (non-expired) API keys
   * Ready for: GET /api/v1/tenants/:tenantId/api-keys/active
   */
  async getActiveKeys(tenantId: string): Promise<ApiKey[]> {
    try {
      const keys = await this.getByTenantId(tenantId);
      return keys.filter(k => !this.isExpired(k.expires_at));
    } catch (error) {
      console.error('Error in getActiveKeys:', error);
      throw error;
    }
  }

  /**
   * Get expired API keys
   * Ready for: GET /api/v1/tenants/:tenantId/api-keys/expired
   */
  async getExpiredKeys(tenantId: string): Promise<ApiKey[]> {
    try {
      const keys = await this.getByTenantId(tenantId);
      return keys.filter(k => this.isExpired(k.expires_at));
    } catch (error) {
      console.error('Error in getExpiredKeys:', error);
      throw error;
    }
  }

  /**
   * Rotate API key (create new version)
   * Deletes old key and creates new one with same metadata
   * Ready for: POST /api/v1/tenants/:tenantId/api-keys/:id/rotate
   */
  async rotateKey(id: string): Promise<GeneratedApiKey> {
    try {
      // Get existing key
      const oldKey = await this.getById(id);
      if (!oldKey) {
        throw new Error('API key not found');
      }

      // Create new key with same metadata
      const newKey = await this.create({
        tenant_id: oldKey.tenant_id,
        name: oldKey.name,
        scopes: oldKey.scopes,
        allowed_ips: oldKey.allowed_ips,
        expires_at: oldKey.expires_at,
        created_by: oldKey.created_by,
      });

      // Delete old key
      await this.delete(id);

      return newKey;
    } catch (error) {
      console.error('Error in rotateKey:', error);
      throw error;
    }
  }

  /**
   * Bulk revoke (delete) API keys
   * Ready for: POST /api/v1/tenants/:tenantId/api-keys/bulk-revoke
   */
  async bulkRevoke(ids: string[]): Promise<number> {
    try {
      const { error, count } = await supabase
        .from(this.table)
        .delete()
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
   * Check if scope is valid
   */
  isScopeValid(scope: string): boolean {
    return AVAILABLE_SCOPES.includes(scope as ApiKeyScope);
  }

  /**
   * Get scope display name
   */
  getScopeDisplayName(scope: string): string {
    const scopeNames: Record<string, string> = {
      'read:tenants': 'Read Tenants',
      'write:tenants': 'Write Tenants',
      'read:users': 'Read Users',
      'write:users': 'Write Users',
      'read:roles': 'Read Roles',
      'write:roles': 'Write Roles',
      'read:domains': 'Read Domains',
      'write:domains': 'Write Domains',
      'read:webhooks': 'Read Webhooks',
      'write:webhooks': 'Write Webhooks',
      'read:analytics': 'Read Analytics',
      'admin:all': 'Admin (All Permissions)',
    };
    return scopeNames[scope] || scope;
  }

  /**
   * Format key prefix for display
   */
  formatKeyDisplay(keyPrefix: string): string {
    return `${keyPrefix}••••••••`;
  }

  /**
   * Calculate days until expiration
   */
  getDaysUntilExpiration(expiresAt?: string): number | null {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const apiKeysService = new ApiKeysService();