/**
 * useTenantStats Hook
 * Manages tenant statistics data (aggregated from multiple tables)
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * 
 * NOTE: Stats require complex aggregation queries from:
 * - tenant_members (members_count, active_members)
 * - departments (departments_count)
 * - tenant_subscriptions (active_subscriptions, monthly_revenue)
 * - audit_logs (api_calls_month, last_activity_at)
 * - etc.
 * 
 * TODO: Implement full aggregation in Golang API for performance
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';

/**
 * Tenant statistics structure
 */
export interface TenantStats {
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  tier: string;
  status: string;
  created_at: string;
  
  // Member stats
  members_count: number;
  active_members: number;
  
  // Organization stats
  departments_count: number;
  user_groups_count: number;
  locations_count: number;
  roles_count: number;
  
  // Subscription stats
  active_subscriptions: number;
  monthly_revenue: number;
  total_orders: number;
  unpaid_invoices: number;
  
  // System stats
  app_routes_count: number;
  webhooks_count: number;
  rate_limits_count: number;
  sso_configs_count: number;
  
  // Usage stats
  storage_used_gb: number;
  api_calls_month: number;
  last_activity_at?: string;
}

/**
 * Hook for fetching tenant statistics
 * @param tenantId - The ID of the tenant
 */
export function useTenantStats(tenantId?: string) {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Fetch tenant stats from data source
   */
  const fetchStats = useCallback(async () => {
    // Skip if no ID
    if (!tenantId) {
      setStats(null);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useTenantStats] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useTenantStats] Fetching stats for tenant:', tenantId);

      // Try cache first
      const cacheKey = `tenant_stats_${tenantId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 1 minute old (stats change frequently)
        if (cacheAge < 1 * 60 * 1000) {
          setStats(cached.data);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats';
      setError(message);
      console.error('[useTenantStats] Error fetching stats:', err);
      setLoading(false);
    }
  }, [tenantId, dataClient]);

  /**
   * Fetch from data source using DataClient
   * 
   * TODO: When Golang API is ready, call dedicated stats endpoint:
   * const stats = await dataClient.execute('GET', '/tenants/:id/stats');
   * 
   * For now, we aggregate from multiple sources (slower but functional)
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !tenantId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Get base tenant info
      const tenant = await dataClient.get<any>('tenants', tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Get members count
      const membersResult = await dataClient.query<any>('tenant_members', {
        filters: { tenant_id: tenantId },
      });
      const membersCount = membersResult.total || 0;
      const activeMembers = membersResult.data.filter((m: any) => m.status === 'ACTIVE').length;

      // Get departments count
      const deptsResult = await dataClient.query<any>('departments', {
        filters: { tenant_id: tenantId },
      });
      const departmentsCount = deptsResult.total || 0;

      // Get subscriptions count
      const subsResult = await dataClient.query<any>('tenant_subscriptions', {
        filters: { 
          tenant_id: tenantId,
          status: 'active',
        },
      });
      const activeSubscriptions = subsResult.total || 0;

      // Get roles count
      const rolesResult = await dataClient.query<any>('roles', {
        filters: { tenant_id: tenantId },
      });
      const rolesCount = rolesResult.total || 0;

      // Aggregate stats
      const calculatedStats: TenantStats = {
        tenant_id: tenantId,
        tenant_name: tenant.name,
        tenant_code: tenant.code,
        tier: tenant.tier,
        status: tenant.status,
        created_at: tenant.created_at,
        
        // Member stats
        members_count: membersCount,
        active_members: activeMembers,
        
        // Organization stats
        departments_count: departmentsCount,
        user_groups_count: 0, // TODO: Query user_groups
        locations_count: 0, // TODO: Query locations
        roles_count: rolesCount,
        
        // Subscription stats
        active_subscriptions: activeSubscriptions,
        monthly_revenue: 0, // TODO: Calculate from invoices
        total_orders: 0, // TODO: Query subscription_orders
        unpaid_invoices: 0, // TODO: Query invoices with unpaid status
        
        // System stats
        app_routes_count: 0, // TODO: Query app_routes
        webhooks_count: 0, // TODO: Query webhooks
        rate_limits_count: 0, // TODO: Query rate_limits
        sso_configs_count: 0, // TODO: Query sso_configs
        
        // Usage stats
        storage_used_gb: 0, // TODO: Calculate from storage_files
        api_calls_month: 0, // TODO: Query api_usage_logs
        last_activity_at: undefined, // TODO: Query audit_logs
      };

      console.log('[useTenantStats] Loaded stats for tenant:', tenantId);

      // Update cache
      const cacheKey = `tenant_stats_${tenantId}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: calculatedStats,
          timestamp: Date.now(),
        })
      );

      // Update state
      setStats(calculatedStats);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTenantStats] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Reload stats from server
   */
  const refetch = useCallback(async () => {
    // Clear cache and refetch
    if (tenantId) {
      const cacheKey = `tenant_stats_${tenantId}`;
      localStorage.removeItem(cacheKey);
    }
    await fetchStats();
  }, [tenantId, fetchStats]);

  // Auto-fetch on mount and when tenantId/dataClient changes
  useEffect(() => {
    if (tenantId && dataClient) {
      console.log('[useTenantStats] Auto-fetching stats for:', tenantId);
      fetchStats();
    }
  }, [tenantId, dataClient]); // Only depend on tenantId and dataClient

  return {
    stats,
    loading,
    error,
    refetch,
  };
}