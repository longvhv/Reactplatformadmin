/**
 * useRoles Hook
 * Hook for managing roles - uses rolesApi
 * 
 * ✅ UPDATED 2026-01-14: Uses new rolesApi with 9 fields
 */

import { useState, useEffect } from 'react';
import { rolesApi, Role, CreateRoleRequest, UpdateRoleRequest, RoleFilters } from '../api/rolesApi';

interface UseRolesOptions extends RoleFilters {
  autoLoad?: boolean;
}

export function useRoles(options: UseRolesOptions = {}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: RoleFilters = {};
      if (options.tenant_id) filters.tenant_id = options.tenant_id;
      if (options.type) filters.type = options.type;
      if (options.search) filters.search = options.search;
      
      console.log('[useRoles] Loading roles with filters:', filters);
      const data = await rolesApi.getAll(filters);
      console.log('[useRoles] Loaded roles:', data.length);
      setRoles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load roles';
      setError(message);
      console.error('[useRoles] Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (data: CreateRoleRequest) => {
    try {
      const newRole = await rolesApi.create(data);
      setRoles(prev => [...prev, newRole]);
      return newRole;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create role';
      throw new Error(message);
    }
  };

  const updateRole = async (id: string, data: UpdateRoleRequest) => {
    try {
      const updated = await rolesApi.update(id, data);
      setRoles(prev => prev.map(r => r._id === id ? updated : r));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      throw new Error(message);
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await rolesApi.delete(id);
      setRoles(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete role';
      throw new Error(message);
    }
  };

  const refresh = async () => {
    await loadRoles();
  };

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadRoles();
    }
  }, [options.tenant_id, options.type]);

  return {
    roles,
    loading,
    error,
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
    refresh,
  };
}

export default useRoles;