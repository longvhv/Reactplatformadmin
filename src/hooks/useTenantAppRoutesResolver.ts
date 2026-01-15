/**
 * useTenantAppRoutesResolver Hook
 * React hook for resolving tenant app routes với Inherited Routing
 */

import { useState, useEffect, useCallback } from 'react';
import {
  tenantAppRoutesResolverApi,
  ResolvedRoute,
  ResolvedDomain,
} from '../api/tenantAppRoutesResolverApi';
import { RouteScope } from '../api/tenantAppRoutesApi';

export function useTenantAppRoutesResolver(tenantId?: string) {
  const [resolvedRoutes, setResolvedRoutes] = useState<ResolvedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch resolved routes
  const fetchResolvedRoutes = useCallback(async () => {
    if (!tenantId) {
      setResolvedRoutes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await tenantAppRoutesResolverApi.getResolvedRoutesByTenant(tenantId);
      setResolvedRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resolved routes');
      console.error('Error fetching resolved routes:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Get resolved route by ID
  const getResolvedRoute = async (routeId: string): Promise<ResolvedRoute | null> => {
    try {
      return await tenantAppRoutesResolverApi.getResolvedRoute(routeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get resolved route';
      setError(message);
      throw new Error(message);
    }
  };

  // Resolve domains for a specific route
  const resolveRouteDomains = async (routeId: string): Promise<ResolvedDomain[]> => {
    try {
      return await tenantAppRoutesResolverApi.resolveRouteDomains(routeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve route domains';
      setError(message);
      throw new Error(message);
    }
  };

  // Check routing conflicts
  const checkConflicts = async () => {
    if (!tenantId) return { hasConflict: false, conflicts: [] };

    try {
      return await tenantAppRoutesResolverApi.checkRoutingConflicts(tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check conflicts';
      setError(message);
      throw new Error(message);
    }
  };

  // Validate route data
  const validateRoute = async (data: {
    tenant_id: string;
    route_scope: RouteScope;
    domain: string | null;
    path_prefix: string;
    app_code: string;
    route_id?: string;
  }): Promise<{ valid: boolean; errors: string[] }> => {
    try {
      return await tenantAppRoutesResolverApi.validateRoute(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate route';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats about resolved routes
  const getResolvedStats = useCallback(() => {
    const stats = {
      total: resolvedRoutes.length,
      specific_domain: resolvedRoutes.filter(r => r.route_scope === 'SPECIFIC_DOMAIN').length,
      all_my_domains: resolvedRoutes.filter(r => r.route_scope === 'ALL_MY_DOMAINS').length,
      inherited: resolvedRoutes.filter(r => r.route_scope === 'INHERITED').length,
      total_effective_urls: resolvedRoutes.reduce((sum, r) => sum + r.effective_urls.length, 0),
      routes_with_multiple_domains: resolvedRoutes.filter(r => r.resolved_domains.length > 1).length,
    };

    return stats;
  }, [resolvedRoutes]);

  // Initial load
  useEffect(() => {
    fetchResolvedRoutes();
  }, [fetchResolvedRoutes]);

  return {
    resolvedRoutes,
    loading,
    error,
    getResolvedRoute,
    resolveRouteDomains,
    checkConflicts,
    validateRoute,
    getResolvedStats,
    refresh: fetchResolvedRoutes,
  };
}

export default useTenantAppRoutesResolver;
