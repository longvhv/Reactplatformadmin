/**
 * useTenant Hook
 * Manages single tenant data fetching and operations
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';
import type { Tenant, TenantStatus } from '@/data/tenants';

/**
 * Hook for managing single tenant operations
 * @param tenantId - The ID of the tenant to manage
 */
export function useTenant(tenantId?: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Fetch tenant by ID from data source
   */
  const fetchTenant = useCallback(async () => {
    // Skip special IDs
    if (!tenantId || tenantId === 'new' || tenantId === 'add') {
      setTenant(null);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useTenant] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useTenant] Fetching tenant:', tenantId);

      // Try cache first
      const cacheKey = `tenant_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 2 minutes old
        if (cacheAge < 2 * 60 * 1000) {
          setTenant(cached.data);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tenant';
      setError(message);
      console.error('[useTenant] Error fetching tenant:', err);
      setLoading(false);
    }
  }, [tenantId, dataClient]);

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
      // Get single tenant using DataClient
      const result = await dataClient.get<Tenant>('tenants', tenantId);

      if (!result) {
        throw new Error('Tenant not found');
      }

      console.log('[useTenant] Loaded tenant:', result._id);

      // Update cache
      const cacheKey = `tenant_${tenantId}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: result,
          timestamp: Date.now(),
        })
      );

      // Update state
      setTenant(result);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTenant] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Update tenant with optimistic locking
   */
  const updateTenant = useCallback(
    async (updates: Partial<Tenant>): Promise<Tenant> => {
      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

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

        console.log('[useTenant] Updating tenant:', tenantId);

        // Update using DataClient (includes optimistic locking)
        const updatedTenant = await dataClient.update<Tenant>(
          'tenants',
          tenantId,
          updateData
        );

        console.log('[useTenant] Updated tenant:', tenantId);

        // Update local state
        setTenant(updatedTenant);

        // Invalidate cache
        const cacheKey = `tenant_${tenantId}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem('tenants_cache'); // Also invalidate list cache

        return updatedTenant;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update tenant';
        setError(message);
        console.error('[useTenant] Error updating tenant:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  /**
   * Update tenant status
   */
  const updateStatus = useCallback(
    async (newStatus: TenantStatus): Promise<void> => {
      if (!tenantId || !tenant) {
        throw new Error('No tenant loaded');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenant] Updating status to:', newStatus);

        // Update using DataClient
        const updatedTenant = await dataClient.update<Tenant>(
          'tenants',
          tenantId,
          { status: newStatus }
        );

        console.log('[useTenant] Updated status for:', tenantId);

        // Update local state
        setTenant(updatedTenant);

        // Invalidate cache
        const cacheKey = `tenant_${tenantId}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem('tenants_cache');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setError(message);
        console.error('[useTenant] Error updating status:', err);
        throw new Error(message);
      }
    },
    [tenantId, tenant, dataClient]
  );

  /**
   * Delete tenant (soft delete)
   */
  const deleteTenant = useCallback(async (): Promise<void> => {
    if (!tenantId) {
      throw new Error('No tenant ID provided');
    }

    if (!dataClient) {
      throw new Error('DataClient not initialized');
    }

    setError(null);

    try {
      console.log('[useTenant] Deleting tenant:', tenantId);

      // Delete using DataClient (soft delete)
      await dataClient.delete('tenants', tenantId);

      console.log('[useTenant] Deleted tenant:', tenantId);

      // Clear local state
      setTenant(null);

      // Invalidate cache
      const cacheKey = `tenant_${tenantId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem('tenants_cache');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tenant';
      setError(message);
      console.error('[useTenant] Error deleting tenant:', err);
      throw new Error(message);
    }
  }, [tenantId, dataClient]);

  /**
   * Reload tenant data from server
   */
  const reload = useCallback(async () => {
    // Clear cache and refetch
    if (tenantId) {
      const cacheKey = `tenant_${tenantId}`;
      localStorage.removeItem(cacheKey);
    }
    await fetchTenant();
  }, [tenantId, fetchTenant]);

  // Auto-fetch on mount and when tenantId/dataClient changes
  useEffect(() => {
    if (tenantId && tenantId !== 'new' && tenantId !== 'add' && dataClient) {
      console.log('[useTenant] Auto-fetching tenant:', tenantId);
      fetchTenant();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  return {
    tenant,
    loading,
    error,
    fetchTenant,
    updateTenant,
    updateStatus,
    deleteTenant,
    reload,
  };
}