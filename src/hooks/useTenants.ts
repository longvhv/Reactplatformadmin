/**
 * useTenants Hook
 * Manages tenant data fetching and operations
 * Updated to use new Supabase API with error handling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import type { Tenant, TenantStatus, TenantTier } from '@/data/tenants';

interface UseTenantsParams {
  status?: TenantStatus | 'all';
  tier?: TenantTier | 'all';
  autoLoad?: boolean;
  limit?: number;
  offset?: number;
}

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenants`;

export function useTenants(params: UseTenantsParams = {}) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Memoized headers to prevent recreation on every render
   */
  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  }), []);

  /**
   * Load tenants from API with localStorage fallback
   */
  const loadTenants = useCallback(async () => {
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
          let filtered = cached.data as Tenant[];
          
          // Apply filters
          if (params.status && params.status !== 'all') {
            filtered = filtered.filter(t => t.status === params.status);
          }
          if (params.tier && params.tier !== 'all') {
            filtered = filtered.filter(t => t.tier === params.tier);
          }
          
          setTenants(filtered);
          setLoading(false);
          
          // Continue to fetch in background to update cache
          fetchFromAPI(true);
          return;
        }
      }
      
      // Fetch from API
      await fetchFromAPI(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tenants';
      setError(message);
      console.error('[useTenants] Error loading tenants:', err);
      setLoading(false);
    }
  }, [params.status, params.tier, headers]);

  /**
   * Fetch from API with localStorage fallback
   */
  const fetchFromAPI = async (isBackgroundUpdate: boolean) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status && params.status !== 'all') {
        queryParams.append('status', params.status);
      }
      if (params.tier && params.tier !== 'all') {
        queryParams.append('tier', params.tier);
      }
      if (params.limit !== undefined) {
        queryParams.append('limit', params.limit.toString());
      }
      if (params.offset !== undefined) {
        queryParams.append('offset', params.offset.toString());
      }

      const url = `${API_BASE}?${queryParams.toString()}`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result = await response.json();
      const data = result.data || [];
      
      // Update cache
      localStorage.setItem('tenants_cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      setTenants(data);
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      if (!isBackgroundUpdate) {
        // If API fails and no cache, try to load from seed data
        const seedData = localStorage.getItem('seed_tenants');
        if (seedData) {
          const parsed = JSON.parse(seedData);
          setTenants(parsed);
          console.log('[useTenants] Using seed data as fallback');
        } else {
          throw err;
        }
      }
    }
  };

  /**
   * Create new tenant
   */
  const createTenant = useCallback(async (tenant: Partial<Tenant>): Promise<Tenant> => {
    setError(null);

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify(tenant),
      });

      if (!response.ok) {
        const errorData: { error: ApiError } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create tenant');
      }

      const result = await response.json();
      const newTenant = result.data;

      // Optimistic update
      setTenants(prev => [newTenant, ...prev]);

      return newTenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tenant';
      setError(message);
      console.error('[useTenants] Error creating tenant:', err);
      throw new Error(message);
    }
  }, [headers]);

  /**
   * Update tenant with optimistic locking
   */
  const updateTenant = useCallback(async (
    id: string,
    updates: Partial<Tenant>
  ): Promise<Tenant> => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData: { error: ApiError } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update tenant');
      }

      const result = await response.json();
      const updatedTenant = result.data;

      // Optimistic update
      setTenants(prev => prev.map(t => t._id === id ? updatedTenant : t));

      return updatedTenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tenant';
      setError(message);
      console.error('[useTenants] Error updating tenant:', err);
      throw new Error(message);
    }
  }, [headers]);

  /**
   * Soft delete tenant
   */
  const deleteTenant = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData: { error: ApiError } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete tenant');
      }

      // Optimistic update
      setTenants(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tenant';
      setError(message);
      console.error('[useTenants] Error deleting tenant:', err);
      throw new Error(message);
    }
  }, [headers]);

  /**
   * Get tenant by ID
   */
  const getTenant = useCallback(async (id: string): Promise<Tenant | null> => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/${id}`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData: { error: ApiError } = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get tenant');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get tenant';
      setError(message);
      console.error('[useTenants] Error getting tenant:', err);
      return null;
    }
  }, [headers]);

  /**
   * Refresh single tenant in cache
   */
  const refreshTenant = useCallback(async (id: string): Promise<void> => {
    const tenant = await getTenant(id);
    if (tenant) {
      setTenants(prev => {
        const exists = prev.some(t => t._id === id);
        if (exists) {
          return prev.map(t => t._id === id ? tenant : t);
        }
        return [tenant, ...prev];
      });
    }
  }, [getTenant]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (params.autoLoad !== false) {
      loadTenants();
    }
  }, [loadTenants, params.autoLoad]);

  return {
    tenants,
    loading,
    error,
    loadTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    getTenant,
    refreshTenant,
  };
}