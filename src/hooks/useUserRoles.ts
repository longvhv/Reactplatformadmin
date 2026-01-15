/**
 * useUserRoles Hook
 * React hook for managing user roles
 */

import { useState, useEffect, useCallback } from 'react';
import {
  userRolesApi,
  UserRole,
  UserRoleFilters,
  CreateUserRoleData,
  UpdateUserRoleData,
} from '../api/userRolesApi';

export function useUserRoles(filters?: UserRoleFilters) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user roles
  const fetchUserRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userRolesApi.getAll(filters);
      setUserRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user roles');
      console.error('Error fetching user roles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create user role
  const createUserRole = async (data: CreateUserRoleData): Promise<UserRole> => {
    try {
      const created = await userRolesApi.create(data);
      await fetchUserRoles();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user role';
      setError(message);
      throw new Error(message);
    }
  };

  // Create multiple user roles
  const createUserRolesBulk = async (dataArray: CreateUserRoleData[]): Promise<UserRole[]> => {
    try {
      const created = await userRolesApi.createBulk(dataArray);
      await fetchUserRoles();
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user roles';
      setError(message);
      throw new Error(message);
    }
  };

  // Update user role
  const updateUserRole = async (id: string, data: UpdateUserRoleData): Promise<UserRole> => {
    try {
      const updated = await userRolesApi.update(id, data);
      await fetchUserRoles();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user role';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete user role
  const deleteUserRole = async (id: string): Promise<void> => {
    try {
      await userRolesApi.delete(id);
      await fetchUserRoles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user role';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete multiple user roles
  const deleteUserRolesBulk = async (ids: string[]): Promise<void> => {
    try {
      await userRolesApi.deleteBulk(ids);
      await fetchUserRoles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user roles';
      setError(message);
      throw new Error(message);
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, isActive: boolean): Promise<void> => {
    try {
      await userRolesApi.toggleActive(id, isActive);
      await fetchUserRoles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle active status';
      setError(message);
      throw new Error(message);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  return {
    userRoles,
    loading,
    error,
    createUserRole,
    createUserRolesBulk,
    updateUserRole,
    deleteUserRole,
    deleteUserRolesBulk,
    toggleActive,
    refresh: fetchUserRoles,
  };
}

export default useUserRoles;
