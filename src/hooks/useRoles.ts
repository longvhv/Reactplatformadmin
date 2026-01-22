/**
 * useRoles Hook
 * Hook for managing roles list
 * 
 * ✅ REFACTORED 2026-01-20: Uses rolesApi directly for strict schema compliance
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  rolesApi, 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  RoleFilters,
  RoleStats
} from '../api/rolesApi';

interface UseRolesOptions extends RoleFilters {
  autoLoad?: boolean;
}

export function useRoles(options: UseRolesOptions = {}) {
  const { autoLoad = true, tenant_id, type, search, limit, offset, has_permissions } = options;
  const [roles, setRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load roles from API
   */
  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build filters
      const filters: RoleFilters = {
        tenant_id,
        type,
        search,
        has_permissions,
        limit,
        offset
      };
      
      const data = await rolesApi.getAll(filters);
      setRoles(data);
    } catch (err: any) {
      const message = err?.message || 'Failed to load roles';
      setError(message);
      console.error('Error loading roles:', message);
    } finally {
      setLoading(false);
    }
  }, [tenant_id, type, search, has_permissions, limit, offset]);

  /**
   * Load stats
   */
  const loadStats = useCallback(async () => {
    if (!tenant_id) return;
    try {
      const data = await rolesApi.getStats(tenant_id);
      setStats(data);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  }, [tenant_id]);

  useEffect(() => {
    if (autoLoad) {
      loadRoles();
      if (tenant_id) {
        loadStats();
      }
    }
  }, [loadRoles, loadStats, autoLoad, tenant_id]);

  /**
   * Create role
   */
  const createRole = async (data: CreateRoleRequest): Promise<Role> => {
    try {
      const newRole = await rolesApi.create(data);
      setRoles(prev => [newRole, ...prev]);
      if (tenant_id) loadStats();
      return newRole;
    } catch (err: any) {
      const message = err?.message || 'Failed to create role';
      throw new Error(message);
    }
  };

  /**
   * Update role
   */
  const updateRole = async (id: string, data: UpdateRoleRequest): Promise<Role> => {
    try {
      const updatedRole = await rolesApi.update(id, data);
      setRoles(prev => prev.map(r => r._id === id ? updatedRole : r));
      if (tenant_id) loadStats();
      return updatedRole;
    } catch (err: any) {
      const message = err?.message || 'Failed to update role';
      throw new Error(message);
    }
  };

  /**
   * Delete role
   */
  const deleteRole = async (id: string): Promise<void> => {
    try {
      await rolesApi.delete(id);
      setRoles(prev => prev.filter(r => r._id !== id));
      if (tenant_id) loadStats();
    } catch (err: any) {
      const message = err?.message || 'Failed to delete role';
      throw new Error(message);
    }
  };

  /**
   * Get role by ID from local state
   */
  const getRole = useCallback((id: string): Role | undefined => {
    return roles.find(r => r._id === id);
  }, [roles]);

  return {
    roles,
    stats,
    loading,
    error,
    loadRoles,
    loadStats,
    createRole,
    updateRole,
    deleteRole,
    getRole,
    refresh: loadRoles
  };
}

export default useRoles;
