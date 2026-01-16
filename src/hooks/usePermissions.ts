/**
 * usePermissions Hook
 * Hook for managing permissions with real API integration
 * 
 * ✅ UPDATED 2026-01-15: Connected to real API instead of mock data
 */

import { useState, useEffect, useCallback } from 'react';
import { permissionsApi, Permission, PermissionFilters, CreatePermissionRequest, UpdatePermissionRequest, PermissionNode } from '../api/permissionsApi';

interface UsePermissionsOptions {
  autoLoad?: boolean;
  filters?: PermissionFilters;
}

export function usePermissions(options: UsePermissionsOptions = {}) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load permissions from API
   */
  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await permissionsApi.getAll(options.filters);
      setPermissions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load permissions';
      setError(message);
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [options.filters]);

  /**
   * Get permissions as tree structure
   */
  const getTree = useCallback(async (appCode: string): Promise<PermissionNode[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const tree = await permissionsApi.getTree(appCode);
      return tree;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load permissions tree';
      setError(message);
      console.error('Error loading permissions tree:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new permission
   */
  const createPermission = useCallback(async (data: CreatePermissionRequest): Promise<Permission> => {
    setLoading(true);
    setError(null);
    
    try {
      const created = await permissionsApi.create(data);
      await loadPermissions(); // Refresh list
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create permission';
      setError(message);
      console.error('Error creating permission:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPermissions]);

  /**
   * Update an existing permission
   */
  const updatePermission = useCallback(async (id: string, data: UpdatePermissionRequest): Promise<Permission> => {
    setLoading(true);
    setError(null);
    
    try {
      const updated = await permissionsApi.update(id, data);
      await loadPermissions(); // Refresh list
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permission';
      setError(message);
      console.error('Error updating permission:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPermissions]);

  /**
   * Delete a permission (soft delete)
   */
  const deletePermission = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await permissionsApi.delete(id);
      await loadPermissions(); // Refresh list
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete permission';
      setError(message);
      console.error('Error deleting permission:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPermissions]);

  /**
   * Get permission statistics
   */
  const getStats = useCallback(async () => {
    try {
      return await permissionsApi.getStats(options.filters);
    } catch (err) {
      console.error('Error getting permission stats:', err);
      return {
        total: 0,
        by_app: {},
        groups: 0,
        permissions: 0,
        root_count: 0,
      };
    }
  }, [options.filters]);

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

  // Auto-load on mount if enabled
  useEffect(() => {
    if (options.autoLoad) {
      loadPermissions();
    }
  }, [options.autoLoad, loadPermissions]);

  return {
    // Data
    permissions,
    loading,
    error,
    
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
    refresh: loadPermissions,
  };
}

// Export Permission type for convenience
export type { Permission, PermissionNode, PermissionFilters, CreatePermissionRequest, UpdatePermissionRequest };
