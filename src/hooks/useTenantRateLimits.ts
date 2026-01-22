/**
 * useTenantRateLimits Hook
 * React hook for managing tenant rate limits
 * 
 * ✅ UPDATED: Matches strictly typed API
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  tenantRateLimitsApi,
  TenantRateLimit,
  RateLimitFilters,
  CreateRateLimitData,
  UpdateRateLimitData,
} from '../api/tenantRateLimitsApi';

export function useTenantRateLimits(filters?: RateLimitFilters) {
  const [limits, setLimits] = useState<TenantRateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent infinite loop
  const memoizedFilters = useMemo(() => filters, [
    filters?.tenant_id,
    filters?.resource_type,
    filters?.is_enabled,
    filters?.limit_type,
    filters?.limit_scope,
    filters?.alert_enabled,
    filters?.limit,
    filters?.offset,
  ]);

  // Fetch rate limits
  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantRateLimitsApi.getAll(memoizedFilters);
      setLimits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rate limits');
      console.error('Error fetching tenant rate limits:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // Create rate limit
  const createLimit = async (data: CreateRateLimitData): Promise<TenantRateLimit> => {
    try {
      const created = await tenantRateLimitsApi.create(data);
      // Optimistic update
      setLimits(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create rate limit';
      setError(message);
      throw new Error(message);
    }
  };

  // Update rate limit
  const updateLimit = async (id: string, data: UpdateRateLimitData): Promise<TenantRateLimit> => {
    try {
      const updated = await tenantRateLimitsApi.update(id, data);
      // Optimistic update
      setLimits(prev => prev.map(l => l._id === id ? updated : l));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update rate limit';
      setError(message);
      throw new Error(message);
    }
  };

  // Enable rate limit
  const enableLimit = async (id: string): Promise<TenantRateLimit> => {
    try {
      const enabled = await tenantRateLimitsApi.enable(id);
      setLimits(prev => prev.map(l => l._id === id ? enabled : l));
      return enabled;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable rate limit';
      setError(message);
      throw new Error(message);
    }
  };

  // Disable rate limit
  const disableLimit = async (id: string): Promise<TenantRateLimit> => {
    try {
      const disabled = await tenantRateLimitsApi.disable(id);
      setLimits(prev => prev.map(l => l._id === id ? disabled : l));
      return disabled;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable rate limit';
      setError(message);
      throw new Error(message);
    }
  };

  // Reset usage
  const resetUsage = async (id: string): Promise<TenantRateLimit> => {
    try {
      const reset = await tenantRateLimitsApi.resetUsage(id);
      setLimits(prev => prev.map(l => l._id === id ? reset : l));
      return reset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset usage';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete rate limit
  const deleteLimit = async (id: string): Promise<void> => {
    try {
      await tenantRateLimitsApi.delete(id);
      setLimits(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete rate limit';
      setError(message);
      throw new Error(message);
    }
  };

  // Toggle alert
  const toggleAlert = async (id: string, enabled: boolean): Promise<TenantRateLimit> => {
    try {
      const updated = await tenantRateLimitsApi.toggleAlert(id, enabled);
      setLimits(prev => prev.map(l => l._id === id ? updated : l));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle alert';
      setError(message);
      throw new Error(message);
    }
  };

  // Set alert threshold
  const setAlertThreshold = async (id: string, threshold: number | null): Promise<TenantRateLimit> => {
    try {
      const updated = await tenantRateLimitsApi.setAlertThreshold(id, threshold);
      setLimits(prev => prev.map(l => l._id === id ? updated : l));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set alert threshold';
      setError(message);
      throw new Error(message);
    }
  };

  // Set priority
  const setPriority = async (id: string, priority: number): Promise<TenantRateLimit> => {
    try {
      const updated = await tenantRateLimitsApi.setPriority(id, priority);
      setLimits(prev => prev.map(l => l._id === id ? updated : l));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set priority';
      setError(message);
      throw new Error(message);
    }
  };

  // Set override
  const setOverride = async (id: string, until: string | null): Promise<TenantRateLimit> => {
    try {
      const updated = await tenantRateLimitsApi.setOverride(id, until);
      setLimits(prev => prev.map(l => l._id === id ? updated : l));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set override';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats
  const getStats = async () => {
    try {
      return await tenantRateLimitsApi.getStatistics(filters?.tenant_id);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        enabled: 0,
        disabled: 0,
        api: 0,
        storage: 0,
        database: 0,
        email: 0,
        compute: 0,
        network: 0,
        sms: 0,
        alertsEnabled: 0,
        exceeded: 0,
      };
    }
  };

  // Initial load
  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  return {
    limits,
    loading,
    error,
    createLimit,
    updateLimit,
    enableLimit,
    disableLimit,
    resetUsage,
    deleteLimit,
    toggleAlert,
    setAlertThreshold,
    setPriority,
    setOverride,
    getStats,
    refresh: fetchLimits,
  };
}

export default useTenantRateLimits;