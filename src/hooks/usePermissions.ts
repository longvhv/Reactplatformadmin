/**
 * usePermissions Hook
 * Hook for managing permissions with real API integration
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * ✅ UPDATED 2026-01-15: Connected to real API
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';
import { permissionsApi, Permission, PermissionFilters, CreatePermissionRequest, UpdatePermissionRequest, PermissionNode } from '../api/permissionsApi';

interface UsePermissionsOptions {
  autoLoad?: boolean;
  filters?: PermissionFilters;
  limit?: number;
  offset?: number;
}

export function usePermissions(options: UsePermissionsOptions = {}) {
  const { autoLoad = true, filters, limit, offset } = options;
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load permissions from database
   */
  const loadPermissions = useCallback(async () => {
    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[usePermissions] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[usePermissions] Loading permissions from data source...');

      // Try cache first
      const cacheKey = 'permissions_cache';
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setPermissions(cached.data);
          setTotal(cached.total);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load permissions';
      setError(message);
      console.error('[usePermissions] Error loading permissions:', err);
      setLoading(false);
    }
  }, [dataClient, filters, limit, offset]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Build filters
      const queryFilters: Record<string, any> = {};
      if (filters?.app_code) queryFilters.app_code = filters.app_code;
      if (filters?.parent_code) queryFilters.parent_code = filters.parent_code;
      if (filters?.type) queryFilters.type = filters.type;
      if (filters?.search) queryFilters.search = filters.search;

      // Query using DataClient
      const result = await dataClient.query<Permission>('permissions', {
        filters: queryFilters,
        orderBy: [{ field: 'code', direction: 'asc' }],
        limit,
        offset,
      });

      console.log('[usePermissions] Loaded permissions:', result.data.length);

      // Update cache
      localStorage.setItem(
        'permissions_cache',
        JSON.stringify({
          data: result.data,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setPermissions(result.data);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[usePermissions] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Get permissions as tree structure
   * Note: This uses permissionsApi helper, not DataClient
   */
  const getTree = useCallback(async (appCode: string): Promise<PermissionNode[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // This is a special endpoint, use permissionsApi for now
      const tree = await permissionsApi.getTree(appCode);
      return tree;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load permissions tree';
      setError(message);
      console.error('[usePermissions] Error loading tree:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new permission
   */
  const createPermission = useCallback(
    async (data: CreatePermissionRequest): Promise<Permission> => {
      setError(null);

      try {
        console.log('[usePermissions] Creating permission:', data);

        // Use permissionsApi which handles UUID generation and versioning
        const newPermission = await permissionsApi.create(data);

        console.log('[usePermissions] Permission created:', newPermission._id);

        // Optimistic update
        setPermissions((prev) => [newPermission, ...prev]);

        // Invalidate cache
        localStorage.removeItem('permissions_cache');

        return newPermission;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create permission';
        setError(message);
        console.error('[usePermissions] Error creating permission:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Update permission with optimistic locking
   */
  const updatePermission = useCallback(
    async (id: string, data: UpdatePermissionRequest): Promise<Permission> => {
      setError(null);

      try {
        console.log('[usePermissions] Updating permission:', id, data);

        // Get current permission for version check (if available in local state)
        const currentPermission = permissions.find((p) => p._id === id);
        
        // Use permissionsApi which handles version check
        const updatedPermission = await permissionsApi.update(id, {
          ...data,
          version: currentPermission?.version // Pass version if we have it
        });

        console.log('[usePermissions] Permission updated:', updatedPermission._id);

        // Optimistic update
        setPermissions((prev) => prev.map((p) => (p._id === id ? updatedPermission : p)));

        // Invalidate cache
        localStorage.removeItem('permissions_cache');

        return updatedPermission;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update permission';
        setError(message);
        console.error('[usePermissions] Error updating permission:', err);
        throw new Error(message);
      }
    },
    [permissions]
  );

  /**
   * Delete permission (soft delete)
   */
  const deletePermission = useCallback(
    async (id: string): Promise<void> => {
      setError(null);

      try {
        console.log('[usePermissions] Deleting permission:', id);

        // Get current permission for version check
        const currentPermission = permissions.find((p) => p._id === id);

        // Use permissionsApi which handles soft delete and version check
        await permissionsApi.delete(id, undefined, currentPermission?.version);

        console.log('[usePermissions] Permission deleted:', id);

        // Optimistic update
        setPermissions((prev) => prev.filter((p) => p._id !== id));

        // Invalidate cache
        localStorage.removeItem('permissions_cache');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete permission';
        setError(message);
        console.error('[usePermissions] Error deleting permission:', err);
        throw new Error(message);
      }
    },
    [permissions]
  );

  /**
   * Get permission statistics
   * Note: This is a custom endpoint, may need DataClient.execute() in future
   */
  const getStats = useCallback(async () => {
    try {
      return await permissionsApi.getStats(filters);
    } catch (err) {
      console.error('[usePermissions] Error getting stats:', err);
      return {
        total: 0,
        by_app: {},
        groups: 0,
        permissions: 0,
        root_count: 0,
      };
    }
  }, [filters]);

  /**
   * Helper: Build tree from current permissions
   */
  const buildTree = useCallback((): PermissionNode[] => {
    return permissionsApi.buildTree(permissions);
  }, [permissions]);

  /**
   * Helper: Check if permission has children
   */
  const hasChildren = useCallback((code: string): boolean => {
    return permissionsApi.hasChildren(permissions, code);
  }, [permissions]);

  /**
   * Helper: Get all descendants of a permission
   */
  const getDescendants = useCallback((code: string): Permission[] => {
    return permissionsApi.getDescendants(permissions, code);
  }, [permissions]);

  /**
   * Helper: Get breadcrumb path
   */
  const getBreadcrumb = useCallback((code: string): Permission[] => {
    return permissionsApi.getBreadcrumb(permissions, code);
  }, [permissions]);

  /**
   * Refresh permissions from server
   */
  const refresh = useCallback(async () => {
    localStorage.removeItem('permissions_cache');
    await loadPermissions();
  }, [loadPermissions]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && dataClient) {
      console.log('[usePermissions] Auto-loading permissions');
      loadPermissions();
    }
  }, [autoLoad, dataClient]); // Only depend on autoLoad and dataClient

  // Trigger load when dataClient becomes available
  useEffect(() => {
    if (dataClient && autoLoad) {
      console.log('[usePermissions] DataClient ready, triggering load');
      loadPermissions();
    }
  }, [dataClient]); // Only depend on dataClient to avoid loop

  return {
    // Data
    permissions,
    loading,
    error,
    total,
    
    // CRUD operations
    loadPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    
    // Tree operations
    getTree,
    buildTree,
    
    // Helper functions
    getStats,
    hasChildren,
    getDescendants,
    getBreadcrumb,
    
    // Manual refresh
    refresh,
  };
}

// Export Permission type for convenience
export type { Permission, PermissionNode, PermissionFilters, CreatePermissionRequest, UpdatePermissionRequest };