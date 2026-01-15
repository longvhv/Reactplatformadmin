/**
 * usePermissions Hook
 * Hook for managing permissions
 */

import { useState, useEffect } from 'react';

export interface Permission {
  _id: string;
  app_code: string;
  code: string;
  parent_code?: string;
  path?: string;
  is_group: boolean;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface UsePermissionsOptions {
  autoLoad?: boolean;
  appCode?: string;
}

export function usePermissions(options: UsePermissionsOptions = {}) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data
      const mockPermissions: Permission[] = [
        {
          _id: '1',
          app_code: 'HRM',
          code: 'HRM:USER:VIEW',
          path: '/HRM/USER/USER_VIEW/',
          is_group: false,
          name: 'View Users',
          description: 'View user information',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          _id: '2',
          app_code: 'HRM',
          code: 'HRM:USER:CREATE',
          path: '/HRM/USER/USER_CREATE/',
          is_group: false,
          name: 'Create Users',
          description: 'Create new users',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          _id: '3',
          app_code: 'HRM',
          code: 'HRM:USER:UPDATE',
          path: '/HRM/USER/USER_UPDATE/',
          is_group: false,
          name: 'Update Users',
          description: 'Update user information',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          _id: '4',
          app_code: 'HRM',
          code: 'HRM:DEPARTMENT:VIEW',
          path: '/HRM/DEPARTMENT/DEPT_VIEW/',
          is_group: false,
          name: 'View Departments',
          description: 'View department information',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          _id: '5',
          app_code: 'HRM',
          code: 'HRM:ATTENDANCE:VIEW',
          path: '/HRM/ATTENDANCE/ATT_VIEW/',
          is_group: false,
          name: 'View Attendance',
          description: 'View attendance records',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setPermissions(mockPermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.autoLoad) {
      loadPermissions();
    }
  }, [options.autoLoad]);

  return {
    permissions,
    loading,
    error,
    loadPermissions,
  };
}
