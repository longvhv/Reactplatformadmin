/**
 * useTenantActivities Hook
 * Manages tenant activity logs with pagination (from telemetry.audit_logs)
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: Activities come from telemetry.audit_logs table
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Tenant Activity (from telemetry.audit_logs)
 */
export interface TenantActivity {
  _id: string;
  tenant_id: string;
  user_id?: string;
  impersonator_id?: string;
  event_time: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  status?: string;
  error_message?: string;
}

/**
 * Hook for fetching tenant activities with pagination
 * @param tenantId - The ID of the tenant
 * @param pageSize - Number of activities per page (default: 50)
 */
export function useTenantActivities(tenantId?: string, pageSize: number = 50) {
  const [activities, setActivities] = useState<TenantActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load initial activities
   */
  const loadActivities = useCallback(async () => {
    // Skip if no tenant ID
    if (!tenantId) {
      setActivities([]);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useTenantActivities] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useTenantActivities] Loading activities for tenant:', tenantId);

      // Try cache first
      const cacheKey = `tenant_activities_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 30 seconds old (activities change frequently)
        if (cacheAge < 30 * 1000) {
          setActivities(cached.data);
          setTotal(cached.total);
          setHasMore(cached.hasMore);
          setOffset(cached.data.length);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(0, pageSize, true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(0, pageSize, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activities';
      setError(message);
      console.error('[useTenantActivities] Error loading activities:', err);
      setLoading(false);
    }
  }, [tenantId, pageSize, dataClient]);

  /**
   * Fetch from data source using DataClient (query telemetry.audit_logs)
   */
  const fetchFromDataSource = async (
    fetchOffset: number,
    fetchLimit: number,
    isBackgroundUpdate: boolean
  ) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Query audit_logs using DataClient
      // NOTE: audit_logs is in telemetry schema
      const result = await dataClient.query<TenantActivity>('audit_logs', {
        filters: { tenant_id: tenantId },
        orderBy: [{ field: 'event_time', direction: 'desc' }],
        limit: fetchLimit,
        offset: fetchOffset,
      });

      console.log('[useTenantActivities] Loaded activities:', result.data.length);

      // Update cache (only for initial load)
      if (fetchOffset === 0) {
        const cacheKey = `tenant_activities_${tenantId}`;
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: result.data,
            total: result.total,
            hasMore: result.hasMore || false,
            timestamp: Date.now(),
          })
        );
      }

      // Update state
      if (fetchOffset === 0) {
        // Initial load
        setActivities(result.data);
        setOffset(result.data.length);
      } else {
        // Load more
        setActivities((prev) => [...prev, ...result.data]);
        setOffset((prev) => prev + result.data.length);
      }

      setTotal(result.total);
      setHasMore(result.hasMore || false);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTenantActivities] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Load more activities (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!tenantId || !hasMore || loading) {
      return;
    }

    if (!dataClient) {
      console.log('[useTenantActivities] DataClient not ready');
      return;
    }

    setError(null);

    try {
      console.log('[useTenantActivities] Loading more from offset:', offset);
      await fetchFromDataSource(offset, pageSize, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more activities';
      setError(message);
      console.error('[useTenantActivities] Error loading more:', err);
    }
  }, [tenantId, hasMore, loading, offset, pageSize, dataClient]);

  /**
   * Reload activities from server
   */
  const refresh = useCallback(async () => {
    // Clear cache and reload
    if (tenantId) {
      const cacheKey = `tenant_activities_${tenantId}`;
      localStorage.removeItem(cacheKey);
    }
    setOffset(0);
    setHasMore(true);
    await loadActivities();
  }, [tenantId, loadActivities]);

  /**
   * Log new activity
   * NOTE: This creates a record in audit_logs
   */
  const logActivity = useCallback(
    async (activity: {
      action: string;
      resource: string;
      resource_id?: string;
      details?: any;
      user_id?: string;
    }): Promise<TenantActivity> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      if (!tenantId) {
        throw new Error('No tenant ID provided');
      }

      setError(null);

      try {
        console.log('[useTenantActivities] Logging activity');

        // Create using DataClient
        const newActivity = await dataClient.create<TenantActivity>('audit_logs', {
          tenant_id: tenantId,
          event_time: new Date().toISOString(),
          ...activity,
        });

        console.log('[useTenantActivities] Activity logged:', newActivity._id);

        // Optimistic update - prepend to list
        setActivities((prev) => [newActivity, ...prev]);

        // Invalidate cache
        if (tenantId) {
          const cacheKey = `tenant_activities_${tenantId}`;
          localStorage.removeItem(cacheKey);
        }

        return newActivity;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to log activity';
        setError(message);
        console.error('[useTenantActivities] Error logging activity:', err);
        throw new Error(message);
      }
    },
    [tenantId, dataClient]
  );

  // Auto-load on mount and when tenantId/dataClient changes
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useTenantActivities] Auto-loading activities for:', tenantId);
      loadActivities();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  return {
    activities,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
    logActivity,
  };
}