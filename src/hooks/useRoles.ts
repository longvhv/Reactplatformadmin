/**
 * useRoles Hook
 * Hook for managing roles
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * ✅ UPDATED 2026-01-14: Uses new rolesApi with 9 fields
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';
import { Role, CreateRoleRequest, UpdateRoleRequest, RoleFilters } from '../api/rolesApi';

interface UseRolesOptions extends RoleFilters {
  autoLoad?: boolean;
  limit?: number;
  offset?: number;
}

export function useRoles(options: UseRolesOptions = {}) {
  const { autoLoad = true, tenant_id, type, search, limit, offset } = options;
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Load roles from database
   */
  const loadRoles = useCallback(async () => {
    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useRoles] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useRoles] Loading roles from data source...');

      // Try cache first
      const cacheKey = 'roles_cache';
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setRoles(cached.data);
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
      const message = err instanceof Error ? err.message : 'Failed to load roles';
      setError(message);
      console.error('[useRoles] Error loading roles:', err);
      setLoading(false);
    }
  }, [dataClient, tenant_id, type, search, limit, offset]);

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
      const filters: Record<string, any> = {};
      if (tenant_id) filters.tenant_id = tenant_id;
      if (type) filters.type = type;
      if (search) filters.search = search;

      // Query using DataClient
      const result = await dataClient.query<Role>('roles', {
        filters,
        orderBy: [{ field: 'created_at', direction: 'desc' }],
        limit,
        offset,
      });

      console.log('[useRoles] Loaded roles:', result.data.length);

      // Update cache
      localStorage.setItem(
        'roles_cache',
        JSON.stringify({
          data: result.data,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setRoles(result.data);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useRoles] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Create new role
   */
  const createRole = useCallback(
    async (data: CreateRoleRequest): Promise<Role> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useRoles] Creating role:', data);

        // Create using DataClient
        const newRole = await dataClient.create<Role>('roles', data);

        console.log('[useRoles] Role created:', newRole._id);

        // Optimistic update
        setRoles((prev) => [newRole, ...prev]);

        // Invalidate cache
        localStorage.removeItem('roles_cache');

        return newRole;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create role';
        setError(message);
        console.error('[useRoles] Error creating role:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Update role with optimistic locking
   */
  const updateRole = useCallback(
    async (id: string, data: UpdateRoleRequest): Promise<Role> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useRoles] Updating role:', id, data);

        // Get current role for version check
        const currentRole = roles.find((r) => r._id === id);
        if (!currentRole) {
          throw new Error('Role not found in local state');
        }

        // Prepare update data (remove immutable fields)
        const updateData: any = { ...data };
        delete updateData._id;
        delete updateData.created_at;
        delete updateData.created_by;
        
        // Include version for optimistic locking
        updateData.version = currentRole.version;

        // Update using DataClient
        const updatedRole = await dataClient.update<Role>('roles', id, updateData);

        console.log('[useRoles] Role updated:', updatedRole._id);

        // Optimistic update
        setRoles((prev) => prev.map((r) => (r._id === id ? updatedRole : r)));

        // Invalidate cache
        localStorage.removeItem('roles_cache');

        return updatedRole;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update role';
        setError(message);
        console.error('[useRoles] Error updating role:', err);
        throw new Error(message);
      }
    },
    [dataClient, roles]
  );

  /**
   * Delete role (soft delete)
   */
  const deleteRole = useCallback(
    async (id: string): Promise<void> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useRoles] Deleting role:', id);

        // Delete using DataClient (soft delete)
        await dataClient.delete('roles', id);

        console.log('[useRoles] Role deleted:', id);

        // Optimistic update
        setRoles((prev) => prev.filter((r) => r._id !== id));

        // Invalidate cache
        localStorage.removeItem('roles_cache');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete role';
        setError(message);
        console.error('[useRoles] Error deleting role:', err);
        throw new Error(message);
      }
    },
    [dataClient]
  );

  /**
   * Get role by ID
   */
  const getRole = useCallback(
    async (id: string): Promise<Role | null> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useRoles] Fetching role:', id);

        const role = await dataClient.get<Role>('roles', id);

        if (!role) {
          console.log('[useRoles] Role not found:', id);
          return null;
        }

        // Update local cache if role exists
        setRoles((prev) => {
          const exists = prev.some((r) => r._id === id);
          if (exists) {
            return prev.map((r) => (r._id === id ? role : r));
          }
          return [role, ...prev];
        });

        return role;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch role';
        setError(message);
        console.error('[useRoles] Error fetching role:', err);
        return null;
      }
    },
    [dataClient]
  );

  /**
   * Refresh roles from server
   */
  const refresh = useCallback(async () => {
    localStorage.removeItem('roles_cache');
    await loadRoles();
  }, [loadRoles]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && dataClient) {
      console.log('[useRoles] Auto-loading roles');
      loadRoles();
    }
  }, [autoLoad, dataClient]); // Only depend on autoLoad and dataClient

  // Trigger load when dataClient becomes available
  useEffect(() => {
    if (dataClient && autoLoad) {
      console.log('[useRoles] DataClient ready, triggering load');
      loadRoles();
    }
  }, [dataClient]); // Only depend on dataClient to avoid loop

  // Reload when filters change
  useEffect(() => {
    if (dataClient && autoLoad) {
      loadRoles();
    }
  }, [tenant_id, type, search]); // Reload on filter changes

  return {
    roles,
    loading,
    error,
    total,
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
    getRole,
    refresh,
  };
}

export default useRoles;