/**
 * useFeatureFlags Hook
 * Hook for managing feature flags with Supabase backend
 */

import { useState, useEffect } from 'react';
import { 
  featureFlagsApi, 
  FeatureFlag,
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

  const loadFlags = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading feature flags...');
      
      const data = await featureFlagsApi.getAll(options.filters);
      
      console.log('✅ Loaded feature flags:', data.length, 'items');
      setFlags(data);
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load feature flags';
      console.error('❌ Error loading feature flags:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Loading feature flags statistics...');
      
      const response = await featureFlagsApi.getStats();
      
      console.log('✅ Loaded stats:', response.data);
      setStats(response.data);
      
    } catch (err: any) {
      console.error('❌ Error loading stats:', err?.message);
    }
  };

  const toggleFlag = async (id: string) => {
    try {
      console.log('🔄 Toggling feature flag:', id);
      
      const response = await featureFlagsApi.toggle(id);
      
      console.log('✅ Flag toggled:', response.message);
      
      // Update local state
      setFlags(prev =>
        prev.map(flag =>
          flag.id === id ? response.data : flag
        )
      );
      
      // Reload stats
      await loadStats();
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to toggle flag';
      console.error('❌ Error toggling flag:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteFlag = async (id: string) => {
    try {
      console.log('🗑️ Deleting feature flag:', id);
      
      await featureFlagsApi.delete(id);
      
      console.log('✅ Feature flag deleted');
      
      // Remove from local state
      setFlags(prev => prev.filter(flag => flag.id !== id));
      
      // Reload stats
      await loadStats();
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete flag';
      console.error('❌ Error deleting flag:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (options.autoLoad) {
      loadFlags();
      loadStats();
    }
  }, [options.autoLoad]);

  return {
    flags,
    stats,
    loading,
    error,
    loadFlags,
    loadStats,
    toggleFlag,
    deleteFlag,
  };
}
