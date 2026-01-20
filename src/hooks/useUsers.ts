/**
 * useUsers Hook
 * Hook for managing users with full CRUD operations
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 * ✅ FIXED 2026-01-16: Removed infinite reload loop
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { useDataClient } from './useDataClient';
import type { User } from '@/api/usersApi';

interface UseUsersOptions {
  autoLoad?: boolean;
  filters?: {
    role?: string;
    status?: string;
    tenant_id?: string;
  };
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

  /**
   * Load users from database
   */
  const loadUsers = useCallback(async () => {
    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useUsers] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useUsers] Loading users from data source...');

      // Try cache first
      const cacheKey = 'users_cache';
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 3 minutes old
        if (cacheAge < 3 * 60 * 1000) {
          setUsers(cached.data);
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
      const errorObj = err instanceof Error ? err : new Error('Failed to load users');
      setError(errorObj);
      console.error('[useUsers] Error loading users:', err);
      toast.error('Failed to load users');
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
      if (filters?.role) queryFilters.role = filters.role;
      if (filters?.status) queryFilters.status = filters.status;
      if (filters?.tenant_id) queryFilters.tenant_id = filters.tenant_id;

      // Query using DataClient
      const result = await dataClient.query<User>('users', {
        filters: queryFilters,
        orderBy: [{ field: 'created_at', direction: 'desc' }],
        limit,
        offset,
      });

      console.log('[useUsers] Loaded users:', result.data.length);

      // Update cache
      localStorage.setItem(
        'users_cache',
        JSON.stringify({
          data: result.data,
          total: result.total,
          timestamp: Date.now(),
        })
      );

      // Update state
      setUsers(result.data);
      setTotal(result.total);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useUsers] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Create new user
   */
  const createUser = useCallback(
    async (userData: any): Promise<User> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useUsers] Creating user:', userData);

        // Create using DataClient
        const newUser = await dataClient.create<User>('users', userData);

        console.log('[useUsers] User created:', newUser._id);

        // Optimistic update
        setUsers((prev) => [newUser, ...prev]);

        // Invalidate cache
        localStorage.removeItem('users_cache');

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
   * Update user with optimistic locking
   */
  const updateUser = useCallback(
    async (id: string, userData: any): Promise<User> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useUsers] Updating user:', id, userData);

        // Get current user for version check
        const currentUser = users.find((u) => u._id === id);
        if (!currentUser) {
          throw new Error('User not found in local state');
        }

        // Prepare update data (remove immutable fields)
        const updateData: any = { ...userData };
        delete updateData._id;
        delete updateData.created_at;
        delete updateData.created_by;
        
        // Include version for optimistic locking
        updateData.version = currentUser.version;

        // Update using DataClient
        const updatedUser = await dataClient.update<User>('users', id, updateData);

        console.log('[useUsers] User updated:', updatedUser._id);

        // Optimistic update
        setUsers((prev) => prev.map((u) => (u._id === id ? updatedUser : u)));

        // Invalidate cache
        localStorage.removeItem('users_cache');

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
    [dataClient, users]
  );

  /**
   * Delete user (soft delete)
   */
  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useUsers] Deleting user:', id);

        // Delete using DataClient (soft delete)
        await dataClient.delete('users', id);

        console.log('[useUsers] User deleted:', id);

        // Optimistic update
        setUsers((prev) => prev.filter((u) => u._id !== id));

        // Invalidate cache
        localStorage.removeItem('users_cache');

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
   * Bulk delete users
   */
  const bulkDeleteUsers = useCallback(
    async (userIds: string[]): Promise<number> => {
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useUsers] Bulk deleting users:', userIds.length);

        let deletedCount = 0;
        const errors: string[] = [];

        for (const id of userIds) {
          try {
            await dataClient.delete('users', id);
            deletedCount++;
          } catch (err) {
            console.error('[useUsers] Failed to delete user:', id, err);
            errors.push(id);
          }
        }

        console.log('[useUsers] Bulk deleted users:', deletedCount);

        // Optimistic update - remove deleted users
        setUsers((prev) => prev.filter((u) => !userIds.includes(u._id) || errors.includes(u._id)));

        // Invalidate cache
        localStorage.removeItem('users_cache');

        if (errors.length > 0) {
          toast.warning(`${deletedCount} users deleted, ${errors.length} failed`);
        } else {
          toast.success(`${deletedCount} users deleted successfully`);
        }

        return deletedCount;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to delete users');
        setError(errorObj);
        console.error('[useUsers] Error bulk deleting users:', err);
        toast.error('Failed to delete users');
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
      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useUsers] Fetching user:', id);

        const user = await dataClient.get<User>('users', id);

        if (!user) {
          console.log('[useUsers] User not found:', id);
          return null;
        }

        // Update local cache if user exists
        setUsers((prev) => {
          const exists = prev.some((u) => u._id === id);
          if (exists) {
            return prev.map((u) => (u._id === id ? user : u));
          }
          return [user, ...prev];
        });

        return user;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to fetch user');
        setError(errorObj);
        console.error('[useUsers] Error fetching user:', err);
        return null;
      }
    },
    [dataClient]
  );

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && dataClient) {
      console.log('[useUsers] Auto-loading users');
      loadUsers();
    }
  }, [autoLoad, dataClient]); // Only depend on autoLoad and dataClient

  // Trigger load when dataClient becomes available
  useEffect(() => {
    if (dataClient && autoLoad) {
      console.log('[useUsers] DataClient ready, triggering load');
      loadUsers();
    }
  }, [dataClient]); // Only depend on dataClient to avoid loop

  return {
    users,
    loading,
    error,
    total,
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    getUser,
    fetchUser,
    refresh: loadUsers,
  };
}

export default useUsers;