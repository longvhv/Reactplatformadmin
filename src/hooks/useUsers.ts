/**
 * useUsers Hook
 * Manages multiple users data fetching and operations
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner@2.0.3';
import { useDataClient } from './useDataClient';
import type { User, UserFilters, CreateUserRequest, UpdateUserRequest } from '../api/usersApi';

interface UseUsersOptions {
  autoLoad?: boolean;
  filters?: UserFilters;
  limit?: number;
  offset?: number;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { autoLoad = true, filters, limit, offset } = options;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState<number | undefined>();

  // Get DataClient instance
  const dataClient = useDataClient();

  // Memoize filters
  const memoizedFilters = useMemo(() => filters, [
    filters?.status,
    filters?.is_verified,
    filters?.is_support_staff,
    filters?.mfa_enabled,
    filters?.search,
  ]);

  /**
   * Load users from database
   */
  const loadUsers = useCallback(async () => {
    // Guard: Wait for dataClient to be ready
    if (!dataClient) return;

    setLoading(true);
    setError(null);

    try {
      // Build filters (DataClient usually expects specific structure)
      // We pass the filters object directly as it matches UserFilters
      const queryFilters: Record<string, any> = { ...memoizedFilters };

      // Query using DataClient
      const result = await dataClient.query<User>('users', {
        filters: queryFilters,
        orderBy: [{ field: 'created_at', direction: 'desc' }],
        limit,
        offset,
      });

      setUsers(result.data);
      setTotal(result.total);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load users');
      setError(errorObj);
      console.error('[useUsers] Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [dataClient, memoizedFilters, limit, offset]);

  /**
   * Create new user
   */
  const createUser = useCallback(
    async (userData: CreateUserRequest): Promise<User> => {
      if (!dataClient) throw new Error('DataClient not initialized');

      setError(null);

      try {
        const newUser = await dataClient.create<User>('users', userData);
        
        // Optimistic update
        setUsers((prev) => [newUser, ...prev]);
        toast.success('User created successfully');
        return newUser;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to create user');
        setError(errorObj);
        console.error('[useUsers] Error creating user:', err);
        toast.error('Failed to create user');
        throw errorObj;
      }
    },
    [dataClient]
  );

  /**
   * Update user
   * ✅ No optimistic locking (no version field)
   */
  const updateUser = useCallback(
    async (id: string, userData: UpdateUserRequest): Promise<User> => {
      if (!dataClient) throw new Error('DataClient not initialized');

      setError(null);

      try {
        // Update using DataClient
        const updatedUser = await dataClient.update<User>('users', id, userData);

        // Optimistic update
        setUsers((prev) => prev.map((u) => (u._id === id ? updatedUser : u)));
        toast.success('User updated successfully');
        return updatedUser;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to update user');
        setError(errorObj);
        console.error('[useUsers] Error updating user:', err);
        toast.error('Failed to update user');
        throw errorObj;
      }
    },
    [dataClient]
  );

  /**
   * Delete user (Soft delete)
   */
  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      if (!dataClient) throw new Error('DataClient not initialized');

      setError(null);

      try {
        await dataClient.delete('users', id);

        // Optimistic update
        setUsers((prev) => prev.filter((u) => u._id !== id));
        toast.success('User deleted successfully');
        return true;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to delete user');
        setError(errorObj);
        console.error('[useUsers] Error deleting user:', err);
        toast.error('Failed to delete user');
        throw errorObj;
      }
    },
    [dataClient]
  );

  /**
   * Get user by ID from local state
   */
  const getUser = useCallback(
    (id: string): User | undefined => {
      return users.find((u) => u._id === id);
    },
    [users]
  );

  /**
   * Get user by ID from database
   */
  const fetchUser = useCallback(
    async (id: string): Promise<User | null> => {
      if (!dataClient) throw new Error('DataClient not initialized');

      setError(null);

      try {
        const user = await dataClient.get<User>('users', id);
        if (!user) return null;

        // Update local cache if user exists in list
        setUsers((prev) => {
          const exists = prev.some((u) => u._id === id);
          if (exists) {
            return prev.map((u) => (u._id === id ? user : u));
          }
          return prev; // Don't add to list to avoid messing up pagination/filters
        });

        return user;
      } catch (err) {
        console.error('[useUsers] Error fetching user:', err);
        return null;
      }
    },
    [dataClient]
  );

  // Auto-load logic
  useEffect(() => {
    if (autoLoad && dataClient) {
      loadUsers();
    }
  }, [autoLoad, dataClient, loadUsers]);

  return {
    users,
    loading,
    error,
    total,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    fetchUser,
    refresh: loadUsers,
  };
}

export default useUsers;