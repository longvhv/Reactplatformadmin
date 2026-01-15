/**
 * useTenantAppRoutes Hook
 * React hook for managing tenant app routes
 */

import { useState, useEffect, useCallback } from 'react';
import {
  tenantAppRoutesApi,
  TenantAppRoute,
  RouteFilters,
  CreateRouteData,
  UpdateRouteData,
} from '../api/tenantAppRoutesApi';

export function useTenantAppRoutes(filters?: RouteFilters) {
  const [routes, setRoutes] = useState<TenantAppRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantAppRoutesApi.getAll(filters);
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routes');
      console.error('Error fetching tenant app routes:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create route
  const createRoute = async (data: CreateRouteData): Promise<TenantAppRoute> => {
    try {
      const created = await tenantAppRoutesApi.create(data);
      await fetchRoutes();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create route';
      setError(message);
      throw new Error(message);
    }
  };

  // Update route
  const updateRoute = async (id: string, data: UpdateRouteData): Promise<TenantAppRoute> => {
    try {
      const updated = await tenantAppRoutesApi.update(id, data);
      await fetchRoutes();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update route';
      setError(message);
      throw new Error(message);
    }
  };

  // Set SSL status
  const setSSLStatus = async (id: string, status: 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED'): Promise<TenantAppRoute> => {
    try {
      const updated = await tenantAppRoutesApi.setSSLStatus(id, status);
      await fetchRoutes();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set SSL status';
      setError(message);
      throw new Error(message);
    }
  };

  // Set as primary
  const setPrimary = async (id: string, tenantId: string): Promise<TenantAppRoute> => {
    try {
      const updated = await tenantAppRoutesApi.setPrimary(id, tenantId);
      await fetchRoutes();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set primary';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete route
  const deleteRoute = async (id: string): Promise<void> => {
    try {
      await tenantAppRoutesApi.delete(id);
      await fetchRoutes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete route';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats
  const getStats = async () => {
    try {
      return await tenantAppRoutesApi.getStats(filters);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        active: 0,
        disabled: 0,
        maintenance: 0,
        pages: 0,
        apis: 0,
        public: 0,
        authenticated: 0,
        rateLimited: 0,
        cached: 0,
      };
    }
  };

  // Initial load
  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return {
    routes,
    loading,
    error,
    createRoute,
    updateRoute,
    setSSLStatus,
    setPrimary,
    deleteRoute,
    getStats,
    refresh: fetchRoutes,
  };
}

export default useTenantAppRoutes;