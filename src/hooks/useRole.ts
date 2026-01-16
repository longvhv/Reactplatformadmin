/**
 * useRole Hook
 * Hook for managing single role
 */

import { useState, useEffect } from 'react';
import { Role } from '../api/rolesApi';

export function useRole(id?: string) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRole = async () => {
    if (!id || id === 'new') return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock data
      const mockRole: Role = {
        _id: id,
        tenant_id: 'tenant-1',
        name: 'HR Manager',
        description: 'Human Resources Manager with full HR access',
        type: 'CUSTOM',
        permission_codes: [
          'HRM:USER:VIEW',
          'HRM:USER:CREATE',
          'HRM:USER:UPDATE',
          'HRM:DEPARTMENT:VIEW',
          'HRM:ATTENDANCE:VIEW',
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 2,
      };

      setRole(mockRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (data: Partial<Role>) => {
    if (!role) return;
    
    try {
      const updated = {
        ...role,
        ...data,
        updated_at: new Date().toISOString(),
        version: role.version + 1,
      };
      setRole(updated);
    } catch (err) {
      throw new Error('Failed to update role');
    }
  };

  const deleteRole = async () => {
    try {
      // Mock delete
      setRole(null);
    } catch (err) {
      throw new Error('Failed to delete role');
    }
  };

  useEffect(() => {
    if (id && id !== 'new') {
      loadRole();
    }
  }, [id]);

  return {
    role,
    loading,
    error,
    updateRole,
    deleteRole,
  };
}