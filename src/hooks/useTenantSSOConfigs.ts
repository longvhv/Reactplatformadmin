/**
 * useTenantSSOConfigs Hook
 * React hook for managing tenant SSO configurations
 * 
 * ✅ CREATED 2026-01-14: Use new interface with 27 fields
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  tenantSSOConfigsApi,
  TenantSSOConfig,
  SSOConfigFilters,
  CreateTenantSSOConfigRequest,
  UpdateTenantSSOConfigRequest,
  SSOConfigTestResult,
  SSOConfigStats,
  SSOProvider,
  SSOConfigStatus,
} from '../api/tenantSSOConfigsApi';

export function useTenantSSOConfigs(filters?: SSOConfigFilters) {
  const [configs, setConfigs] = useState<TenantSSOConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters
  const memoizedFilters = useMemo(() => filters, [
    filters?.tenant_id,
    filters?.provider,
    filters?.status,
    filters?.include_deleted,
    filters?.search,
    filters?.limit,
    filters?.offset,
  ]);

  // Fetch configs
  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantSSOConfigsApi.getAll(memoizedFilters);
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SSO configs');
      console.error('Error fetching SSO configs:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  // Create config
  const createConfig = async (data: CreateTenantSSOConfigRequest): Promise<TenantSSOConfig> => {
    try {
      const created = await tenantSSOConfigsApi.create(data);
      await fetchConfigs();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  // Update config
  const updateConfig = async (id: string, data: UpdateTenantSSOConfigRequest): Promise<TenantSSOConfig> => {
    try {
      const updated = await tenantSSOConfigsApi.update(id, data);
      await fetchConfigs();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete config
  const deleteConfig = async (id: string, version?: number): Promise<void> => {
    try {
      await tenantSSOConfigsApi.delete(id, undefined, version);
      await fetchConfigs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  // Test config
  const testConfig = async (id: string): Promise<SSOConfigTestResult> => {
    try {
      return await tenantSSOConfigsApi.testConfig(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  // Status management
  const activateConfig = async (id: string): Promise<TenantSSOConfig> => {
    try {
      const activated = await tenantSSOConfigsApi.activate(id);
      await fetchConfigs();
      return activated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  const deactivateConfig = async (id: string): Promise<TenantSSOConfig> => {
    try {
      const deactivated = await tenantSSOConfigsApi.deactivate(id);
      await fetchConfigs();
      return deactivated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  const setTesting = async (id: string): Promise<TenantSSOConfig> => {
    try {
      const testing = await tenantSSOConfigsApi.setTesting(id);
      await fetchConfigs();
      return testing;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set testing mode';
      setError(message);
      throw new Error(message);
    }
  };

  const deprecateConfig = async (id: string): Promise<TenantSSOConfig> => {
    try {
      const deprecated = await tenantSSOConfigsApi.deprecate(id);
      await fetchConfigs();
      return deprecated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deprecate SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  // Clone config
  const cloneConfig = async (id: string, newName: string): Promise<TenantSSOConfig> => {
    try {
      const cloned = await tenantSSOConfigsApi.clone(id, newName);
      await fetchConfigs();
      return cloned;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clone SSO config';
      setError(message);
      throw new Error(message);
    }
  };

  // Get stats
  const getStats = async (): Promise<SSOConfigStats> => {
    try {
      return await tenantSSOConfigsApi.getStats(memoizedFilters);
    } catch (err) {
      console.error('Error getting stats:', err);
      return {
        total: 0,
        by_provider: {
          SAML: 0,
          OAUTH2: 0,
          OIDC: 0,
          LDAP: 0,
          CAS: 0,
          OTHER: 0,
        },
        by_status: {
          ACTIVE: 0,
          INACTIVE: 0,
          TESTING: 0,
          DEPRECATED: 0,
        },
        active: 0,
        testing: 0,
        with_scopes: 0,
        with_attribute_mapping: 0,
      };
    }
  };

  // Bulk operations
  const bulkActivate = async (ids: string[]): Promise<void> => {
    try {
      await tenantSSOConfigsApi.bulkActivate(ids);
      await fetchConfigs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk activate';
      setError(message);
      throw new Error(message);
    }
  };

  const bulkDeactivate = async (ids: string[]): Promise<void> => {
    try {
      await tenantSSOConfigsApi.bulkDeactivate(ids);
      await fetchConfigs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk deactivate';
      setError(message);
      throw new Error(message);
    }
  };

  const bulkDelete = async (ids: string[]): Promise<void> => {
    try {
      await tenantSSOConfigsApi.bulkDelete(ids);
      await fetchConfigs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to bulk delete';
      setError(message);
      throw new Error(message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    loading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    testConfig,
    activateConfig,
    deactivateConfig,
    setTesting,
    deprecateConfig,
    cloneConfig,
    getStats,
    bulkActivate,
    bulkDeactivate,
    bulkDelete,
    refresh: fetchConfigs,
  };
}

export default useTenantSSOConfigs;
