/**
 * useFeatureFlags Hook
 * Hook for managing feature flags with Supabase backend
 * 
 * ✅ ENHANCED 2026-01-20: Added Create/Update support and strict typing
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  featureFlagsApi, 
  FeatureFlag,
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
  FeatureFlagFilters,
  FeatureFlagStats 
} from '../api/featureFlagsApi';

interface UseFeatureFlagsOptions {
  autoLoad?: boolean;
  filters?: FeatureFlagFilters;
}

export function useFeatureFlags(options: UseFeatureFlagsOptions = {}) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [stats, setStats] = useState<FeatureFlagStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await featureFlagsApi.getAll(options.filters);
      setFlags(data);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load feature flags';
      console.error('Error loading feature flags:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options.filters)]);

  const loadStats = useCallback(async () => {
    try {
      const response = await featureFlagsApi.getStats();
      setStats(response.data);
    } catch (err: any) {
      console.error('Error loading stats:', err?.message);
    }
  }, []);

  useEffect(() => {
    if (options.autoLoad) {
      loadFlags();
      loadStats();
    }
  }, [loadFlags, loadStats, options.autoLoad]);

  const createFeatureFlag = async (data: CreateFeatureFlagRequest): Promise<FeatureFlag> => {
    try {
      const created = await featureFlagsApi.create(data);
      setFlags(prev => [created, ...prev]);
      await loadStats(); // Refresh stats
      return created;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create feature flag';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const updateFeatureFlag = async (
    id: string, 
    data: UpdateFeatureFlagRequest
  ): Promise<FeatureFlag> => {
    try {
      const updated = await featureFlagsApi.update(id, data);
      setFlags(prev => prev.map(f => f.id === id ? updated : f));
      
      // If enabled status changed, refresh stats
      if (data.is_enabled !== undefined) {
        await loadStats();
      }
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update feature flag';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const deleteFeatureFlag = async (id: string): Promise<void> => {
    try {
      await featureFlagsApi.delete(id);
      setFlags(prev => prev.filter(f => f.id !== id));
      await loadStats(); // Refresh stats
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete feature flag';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const toggleFlag = async (id: string): Promise<void> => {
    try {
      const response = await featureFlagsApi.toggle(id);
      setFlags(prev => prev.map(f => f.id === id ? response.data : f));
      await loadStats(); // Refresh stats
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to toggle flag';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const getFeatureFlagById = useCallback((id: string): FeatureFlag | undefined => {
    return flags.find(f => f.id === id);
  }, [flags]);

  return {
    flags,
    stats,
    loading,
    error,
    loadFlags,
    loadStats,
    createFeatureFlag,
    updateFeatureFlag,
    deleteFeatureFlag,
    toggleFlag,
    getFeatureFlagById,
    refresh: loadFlags
  };
}

export function useFeatureFlag(id: string | undefined) {
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await featureFlagsApi.getById(id);
      setFlag(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch feature flag');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { flag, loading, error, refresh };
}

export default useFeatureFlags;
