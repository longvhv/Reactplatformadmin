/**
 * useTenants Hook
 * Manages multiple tenants data fetching and operations
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';
import type { Tenant, TenantStatus, TenantTier } from '../data/tenants';

interface UseTenantsParams {
  status?: TenantStatus | 'all';
  tier?: TenantTier | 'all';
  autoLoad?: boolean;
  limit?: number;
  offset?: number;
}

export function useTenants(params: UseTenantsParams = {}) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load tenants from database
   */
  const loadTenants = useCallback(async () => {
    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useTenants] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try localStorage first for offline capability
      const cachedData = localStorage.getItem('tenants_cache');
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setTenants(cached.data);
          setTotal(cached.total);
          setLoading(false);

          // Continue to fetch in background to update cache
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tenants';
      setError(message);
      console.error('[useTenants] Error loading tenants:', err);

      // Try using cached data on error
      const cachedData = localStorage.getItem('tenants_cache');
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setTenants(cached.data);
        setTotal(cached.total);
      }

      setLoading(false);
    }
  }, [dataClient, params.status, params.tier, params.limit, params.offset]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    // Guard: Check if dataClient is ready
    if (!dataClient) {
      console.log('[useTenants] DataClient not ready yet');
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      console.log('[useTenants] Fetching tenants from data source...');

      // Build filters
      const filters: Record<string, any> = {};
      if (params.status && params.status !== 'all') {
        filters.status = params.status;
      }
      if (params.tier && params.tier !== 'all') {
        filters.tier = params.tier;
      }

      // Query using DataClient
      const result = await dataClient.query<Tenant>('tenants', {
        filters,
        orderBy: [{ field: 'created_at', direction: 'desc' }],
        limit: params.limit,
        offset: params.offset,
      });

      console.log('[useTenants] Loaded tenants:', result.data.length);

      // Update cache
      localStorage.setItem(
        'tenants_cache',
        JSON.stringify({
          data: result.data,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setTenants(result.data);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTenants] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        // If DB fails and no cache, try to load from seed data
        const seedData = localStorage.getItem('seed_tenants');
        if (seedData) {
          const parsed = JSON.parse(seedData);
          setTenants(parsed);
          console.log('[useTenants] Using seed data as fallback');
          setLoading(false);
        } else {
          throw err;
        }
      }
    }
  };

  /**
   * Create new tenant
   */
  const createTenant = useCallback(
    async (tenant: Partial<Tenant>): Promise<Tenant> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        // Prepare data according to database schema
        const createData: any = {
          name: tenant.name,
          code: tenant.code,
          tier: tenant.tier || 'FREE',
          status: tenant.status || 'TRIAL',
          data_region: tenant.data_region || 'ap-southeast-1',
          compliance_level: tenant.compliance_level || 'STANDARD',
          billing_type: tenant.billing_type || 'POSTPAID',
          timezone: tenant.timezone || 'UTC',
          profile: tenant.profile || {},
          settings: tenant.settings || {},
          parent_tenant_id: tenant.parent_tenant_id || null,
          partner_tenant_id: tenant.partner_tenant_id || null,
        };

        // Create using DataClient
        const newTenant = await dataClient.create<Tenant>('tenants', createData);

        console.log('[useTenants] Created tenant:', newTenant._id);

        // Optimistic update
        setTenants((prev) => [newTenant, ...prev]);

        // Invalidate cache
        localStorage.removeItem('tenants_cache');

        return newTenant;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create tenant';
        setError(message);
        console.error('[useTenants] Error creating tenant:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Update tenant with optimistic locking
   */
  const updateTenant = useCallback(
    async (id: string, updates: Partial<Tenant>): Promise<Tenant> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        // Prepare update data (remove immutable fields)
        const updateData: any = { ...updates };
        delete updateData._id;
        delete updateData.created_at;
        delete updateData.created_by;
        delete updateData.version;

        // Update using DataClient (includes optimistic locking)
        const updatedTenant = await dataClient.update<Tenant>(
          'tenants',
          id,
          updateData
        );

        console.log('[useTenants] Updated tenant:', id);

        // Optimistic update
        setTenants((prev) => prev.map((t) => (t._id === id ? updatedTenant : t)));

        // Invalidate cache
        localStorage.removeItem('tenants_cache');

        return updatedTenant;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tenant';
        setError(message);
        console.error('[useTenants] Error updating tenant:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Soft delete tenant
   */
  const deleteTenant = useCallback(async (id: string): Promise<void> => {
    if (!dataClient) {
      throw new Error('DataClient not initialized');
    }

    setError(null);

    try {
      // Delete using DataClient (soft delete)
      await dataClient.delete('tenants', id);

      console.log('[useTenants] Deleted tenant:', id);

      // Optimistic update
      setTenants((prev) => prev.filter((t) => t._id !== id));

      // Invalidate cache
      localStorage.removeItem('tenants_cache');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tenant';
      setError(message);
      console.error('[useTenants] Error deleting tenant:', err);
      throw new Error(message);
    }
  }, [dataClient]);

  /**
   * Get tenant by ID
   */
  const getTenant = useCallback(async (id: string): Promise<Tenant | null> => {
    if (!dataClient) {
      throw new Error('DataClient not initialized');
    }

    setError(null);

    try {
      // Get using DataClient
      const tenant = await dataClient.get<Tenant>('tenants', id);

      if (!tenant) {
        console.log('[useTenants] Tenant not found:', id);
        return null;
      }

      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get tenant';
      setError(message);
      console.error('[useTenants] Error getting tenant:', err);
      return null;
    }
  }, [dataClient]);

  /**
   * Refresh single tenant in cache
   */
  const refreshTenant = useCallback(
    async (id: string): Promise<void> => {
      const tenant = await getTenant(id);
      if (tenant) {
        setTenants((prev) => {
          const exists = prev.some((t) => t._id === id);
          if (exists) {
            return prev.map((t) => (t._id === id ? tenant : t));
          }
          return [tenant, ...prev];
        });
      }
    },
    [getTenant]
  );

  // Auto-load on mount if enabled
  useEffect(() => {
    if (params.autoLoad !== false) {
      loadTenants();
    }
  }, [loadTenants, params.autoLoad]);

  // Trigger load when dataClient becomes available
  useEffect(() => {
    if (dataClient && params.autoLoad !== false) {
      console.log('[useTenants] DataClient ready, triggering load');
      loadTenants();
    }
  }, [dataClient]); // Only depend on dataClient, not loadTenants to avoid loop

  return {
    tenants,
    loading,
    error,
    total,
    loadTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    getTenant,
    refreshTenant,
  };
}