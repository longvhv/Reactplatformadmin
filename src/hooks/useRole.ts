/**
 * useRole Hook
 * Hook for managing single role
 * 
 * ✅ REFACTORED 2026-01-20: Uses rolesApi directly
 */

import { useState, useEffect, useCallback } from 'react';
import { rolesApi, Role, UpdateRoleRequest } from '../api/rolesApi';

export function useRole(id: string | undefined) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    if (!id || id === 'new') return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await rolesApi.getById(id);
      setRole(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch role');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const updateRole = async (data: UpdateRoleRequest) => {
    if (!id || !role) return;
    try {
      const updated = await rolesApi.update(id, data);
      setRole(updated);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to update role');
    }
  };

  const deleteRole = async () => {
    if (!id) return;
    try {
      await rolesApi.delete(id);
      setRole(null);
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to delete role');
    }
  };

  return {
    role,
    loading,
    error,
    refresh: fetchRole,
    updateRole,
    deleteRole
  };
}

export default useRole;
