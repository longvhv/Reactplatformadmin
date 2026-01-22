/**
 * useTenantSettings Hook
 * Manages tenant settings operations
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';
import type { Tenant } from '../data/tenants';

// Settings type extracted from Tenant
type TenantSettings = NonNullable<Tenant['settings']>;

/**
 * Hook for managing tenant settings
 * @param id - The ID of the tenant
 */
export function useTenantSettings(id?: string) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Fetch tenant settings from data source
   */
  const fetchSettings = useCallback(async () => {
    // Skip if no ID
    if (!id) {
      setSettings(null);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useTenantSettings] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useTenantSettings] Fetching settings for tenant:', id);

      // Try cache first
      const cacheKey = `tenant_settings_${id}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 2 minutes old
        if (cacheAge < 2 * 60 * 1000) {
          setSettings(cached.data);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch settings';
      setError(message);
      console.error('[useTenantSettings] Error fetching settings:', err);
      setLoading(false);
    }
  }, [id, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !id) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Get tenant and extract settings
      const tenant = await dataClient.get<Tenant>('tenants', id);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const tenantSettings = tenant.settings || null;

      console.log('[useTenantSettings] Loaded settings for tenant:', id);

      // Update cache
      const cacheKey = `tenant_settings_${id}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: tenantSettings,
          timestamp: Date.now(),
        })
      );

      // Update state
      setSettings(tenantSettings);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useTenantSettings] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Update tenant settings
   */
  const updateSettings = useCallback(
    async (updates: Partial<TenantSettings>): Promise<TenantSettings> => {
      if (!id) {
        throw new Error('No tenant ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useTenantSettings] Updating settings for tenant:', id);

        // Get current tenant to preserve version
        const tenant = await dataClient.get<Tenant>('tenants', id);
        
        if (!tenant) {
          throw new Error('Tenant not found');
        }

        // Merge settings
        const newSettings = {
          ...tenant.settings,
          ...updates,
        };

        // Update tenant with new settings
        const updatedTenant = await dataClient.update<Tenant>('tenants', id, {
          settings: newSettings,
          version: tenant.version,
        });

        console.log('[useTenantSettings] Settings updated for tenant:', id);

        // Update local state
        setSettings(updatedTenant.settings || null);

        // Invalidate caches
        const cacheKey = `tenant_settings_${id}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`tenant_${id}`);
        localStorage.removeItem('tenants_cache');

        return updatedTenant.settings || newSettings;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setError(message);
        console.error('[useTenantSettings] Error updating settings:', err);
        throw new Error(message);
      }
    },
    [id, dataClient]
  );

  /**
   * Update a specific setting field
   */
  const updateSetting = useCallback(
    async <K extends keyof TenantSettings>(
      key: K,
      value: TenantSettings[K]
    ): Promise<void> => {
      await updateSettings({ [key]: value } as Partial<TenantSettings>);
    },
    [updateSettings]
  );

  /**
   * Reset settings to defaults
   */
  const resetSettings = useCallback(async (): Promise<void> => {
    if (!id || !dataClient) {
      throw new Error('DataClient not initialized or no tenant ID');
    }

    setError(null);

    try {
      console.log('[useTenantSettings] Resetting settings for tenant:', id);

      // Default settings
      const defaultSettings: TenantSettings = {
        max_users: 100,
        current_users: 0,
        max_storage: 10 * 1024 * 1024 * 1024, // 10 GB
        current_storage: 0,
        features: [],
        theme: 'light',
        language: 'vi',
      };

      await updateSettings(defaultSettings);

      console.log('[useTenantSettings] Settings reset for tenant:', id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(message);
      console.error('[useTenantSettings] Error resetting settings:', err);
      throw new Error(message);
    }
  }, [id, dataClient, updateSettings]);

  /**
   * Reload settings from server
   */
  const reload = useCallback(async () => {
    // Clear cache and refetch
    if (id) {
      const cacheKey = `tenant_settings_${id}`;
      localStorage.removeItem(cacheKey);
    }
    await fetchSettings();
  }, [id, fetchSettings]);

  // Auto-fetch on mount and when id/dataClient changes
  useEffect(() => {
    if (id && dataClient) {
      console.log('[useTenantSettings] Auto-fetching settings for:', id);
      fetchSettings();
    }
  }, [id, dataClient]); // Only depend on id and dataClient

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    updateSetting,
    resetSettings,
    reload,
  };
}