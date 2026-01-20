/**
 * useApiKeys Hook
 * Manages API keys for tenant authentication
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: Replaces "useIntegrations" since there's no integrations table
 * 
 * Schema:
 * - api_keys: key_hash, scopes, allowed_ips, expires_at
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * API Key type (from api_keys table)
 */
export interface ApiKey {
  _id: string;
  tenant_id: string;
  name: string;
  key_prefix: string; // First 8 chars of key (for display)
  key_hash: string; // Hashed key (never expose raw key)
  scopes: string[]; // Permissions ['read:users', 'write:tenants']
  allowed_ips?: string[]; // IP whitelist
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  created_by?: string;
  version: number;
}

/**
 * API Key with raw key (only returned on creation)
 */
export interface ApiKeyWithRaw extends ApiKey {
  raw_key: string; // Full key (only available once!)
}

/**
 * API Key filters
 */
export interface ApiKeyFilters {
  active?: boolean; // Not expired
  scope?: string; // Has specific scope
}

/**
 * API Key usage log (from telemetry.api_usage_logs)
 */
export interface ApiKeyUsage {
  _id: string;
  tenant_id?: string;
  app_code?: string;
  api_endpoint?: string;
  api_method?: string;
  status_code?: number;
  request_size?: number;
  response_size?: number;
  latency_ms?: number;
  api_key_id?: string;
  created_at: string;
}

/**
 * Hook for API key management
 * @param tenantId - The ID of the tenant
 * @param filters - Optional filters
 */
export function useApiKeys(tenantId?: string, filters?: ApiKeyFilters) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load API keys
   */
  const loadApiKeys = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setApiKeys([]);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useApiKeys] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useApiKeys] Loading API keys for tenant:', tenantId);

      // Try cache first
      const cacheKey = `api_keys_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 3 minutes old
        if (cacheAge < 3 * 60 * 1000) {
          setApiKeys(cached.data);
          setTotal(cached.total);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load API keys';
      setError(message);
      console.error('[useApiKeys] Error loading API keys:', err);
      setLoading(false);
    }
  }, [tenantId, filters, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Query using DataClient
      const result = await dataClient.query<ApiKey>('api_keys', {
        filters: { tenant_id: tenantId },
        orderBy: [{ field: 'created_at', direction: 'desc' }],
      });

      console.log('[useApiKeys] Loaded API keys:', result.data.length);

      // Apply filters
      let filteredData = result.data;

      // Filter active (not expired)
      if (filters?.active) {
        const now = new Date();
        filteredData = filteredData.filter((key) => {
          if (!key.expires_at) return true; // No expiry = always active
          return new Date(key.expires_at) > now;
        });
      }

      // Filter by scope
      if (filters?.scope) {
        filteredData = filteredData.filter((key) => key.scopes.includes(filters.scope!));
      }

      // Update cache
      localStorage.setItem(
        `api_keys_${tenantId}`,
        JSON.stringify({
          data: filteredData,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setApiKeys(filteredData);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useApiKeys] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Create new API key
   * 
   * IMPORTANT: Returns raw key only ONCE!
   * Store it securely, it cannot be retrieved again.
   */
  const createApiKey = useCallback(
    async (data: {
      name: string;
      scopes: string[];
      allowed_ips?: string[];
      expires_at?: string;
    }): Promise<ApiKeyWithRaw> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useApiKeys] Creating API key');

        // Generate API key
        const rawKey = generateApiKey();
        const keyHash = await hashKey(rawKey);
        const keyPrefix = rawKey.substring(0, 8);

        const newApiKey = await dataClient.create<ApiKey>('api_keys', {
          tenant_id: tenantId,
          name: data.name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          scopes: data.scopes,
          allowed_ips: data.allowed_ips,
          expires_at: data.expires_at,
          version: 1,
        });

        console.log('[useApiKeys] API key created:', newApiKey._id);

        // Optimistic update
        setApiKeys((prev) => [newApiKey, ...prev]);

        // Invalidate cache
        localStorage.removeItem(`api_keys_${tenantId}`);

        // Return with raw key (only available now!)
        return {
          ...newApiKey,
          raw_key: rawKey,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create API key';
        setError(message);
        console.error('[useApiKeys] Error creating API key:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update API key
   * Cannot update key_hash - must create new key
   */
  const updateApiKey = useCallback(
    async (
      id: string,
      updates: {
        name?: string;
        scopes?: string[];
        allowed_ips?: string[];
        expires_at?: string;
      }
    ): Promise<ApiKey> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useApiKeys] Updating API key:', id);

        const updatedKey = await dataClient.update<ApiKey>('api_keys', id, updates);

        console.log('[useApiKeys] API key updated');

        // Optimistic update
        setApiKeys((prev) => prev.map((k) => (k._id === id ? updatedKey : k)));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`api_keys_${tenantId}`);
        }

        return updatedKey;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update API key';
        setError(message);
        console.error('[useApiKeys] Error updating API key:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Delete API key (revoke)
   */
  const deleteApiKey = useCallback(
    async (id: string): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useApiKeys] Deleting API key:', id);

        await dataClient.delete('api_keys', id);

        console.log('[useApiKeys] API key deleted');

        // Optimistic update
        setApiKeys((prev) => prev.filter((k) => k._id !== id));

        // Invalidate cache
        if (tenantId) {
          localStorage.removeItem(`api_keys_${tenantId}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete API key';
        setError(message);
        console.error('[useApiKeys] Error deleting API key:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Get API key usage logs
   */
  const getUsageLogs = useCallback(
    async (apiKeyId: string, limit: number = 100): Promise<ApiKeyUsage[]> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      try {
        const result = await dataClient.query<ApiKeyUsage>('api_usage_logs', {
          filters: { api_key_id: apiKeyId },
          orderBy: [{ field: 'created_at', direction: 'desc' }],
          limit,
        });

        return result.data;
      } catch (err) {
        console.error('[useApiKeys] Error fetching usage logs:', err);
        return [];
      }
    },
    [dataClient]
  );

  /**
   * Check if API key is expired
   */
  const isExpired = useCallback((apiKey: ApiKey): boolean => {
    if (!apiKey.expires_at) return false;
    return new Date(apiKey.expires_at) < new Date();
  }, []);

  /**
   * Get API key by ID
   */
  const getApiKey = useCallback(
    (id: string): ApiKey | undefined => {
      return apiKeys.find((k) => k._id === id);
    },
    [apiKeys]
  );

  /**
   * Get active API keys (not expired)
   */
  const getActiveKeys = useCallback((): ApiKey[] => {
    const now = new Date();
    return apiKeys.filter((key) => {
      if (!key.expires_at) return true;
      return new Date(key.expires_at) > now;
    });
  }, [apiKeys]);

  /**
   * Reload API keys from server
   */
  const refresh = useCallback(async () => {
    if (tenantId) {
      localStorage.removeItem(`api_keys_${tenantId}`);
    }
    await loadApiKeys();
  }, [tenantId, loadApiKeys]);

  // Auto-load on mount and when tenantId/dataClient change
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useApiKeys] Auto-loading API keys for:', tenantId);
      loadApiKeys();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  // Reload when filters change
  useEffect(() => {
    if (tenantId && dataClient) {
      loadApiKeys();
    }
  }, [filters?.active, filters?.scope]);

  return {
    apiKeys,
    loading,
    error,
    total,
    loadApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    getUsageLogs,
    isExpired,
    getApiKey,
    getActiveKeys,
    refresh,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate API key
 * Format: sk_live_[32 random hex chars]
 */
function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `sk_live_${randomHex}`;
}

/**
 * Hash API key for storage
 * In production, use a proper server-side hashing algorithm
 */
async function hashKey(key: string): Promise<string> {
  // TODO: This should be done server-side with a proper algorithm (bcrypt, argon2)
  // Client-side hashing is NOT secure for production!
  
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
