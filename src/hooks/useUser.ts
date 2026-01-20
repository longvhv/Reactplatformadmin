/**
 * useUser Hook
 * Manages single user data fetching and operations
 * 
 * MIGRATED: Now uses DataClient abstraction layer
 * - Easy to switch between Supabase and Golang API
 * - Consistent pattern across all hooks
 * - Type-safe with generics
 */

import { useState, useEffect, useCallback } from 'react';
import { useDataClient } from './useDataClient';
import type { User, UserStatus } from '@/api/usersApi';

/**
 * Hook for managing single user operations
 * @param userId - The ID of the user to manage
 */
export function useUser(userId?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get DataClient instance
  const dataClient = useDataClient();

  /**
   * Fetch user by ID from data source
   */
  const fetchUser = useCallback(async () => {
    // Skip special IDs
    if (!userId || userId === 'new' || userId === 'add') {
      setUser(null);
      return;
    }

    // Guard: Wait for dataClient to be ready
    if (!dataClient) {
      console.log('[useUser] Waiting for DataClient to initialize...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useUser] Fetching user:', userId);

      // Try cache first
      const cacheKey = `user_${userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;

        // Use cache if less than 2 minutes old
        if (cacheAge < 2 * 60 * 1000) {
          setUser(cached.data);
          setLoading(false);

          // Continue to fetch in background
          fetchFromDataSource(true);
          return;
        }
      }

      // Fetch from data source
      await fetchFromDataSource(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(message);
      console.error('[useUser] Error fetching user:', err);
      setLoading(false);
    }
  }, [userId, dataClient]);

  /**
   * Fetch from data source using DataClient
   */
  const fetchFromDataSource = async (isBackgroundUpdate: boolean) => {
    if (!dataClient || !userId) {
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
      return;
    }

    try {
      // Get single user using DataClient
      const result = await dataClient.get<User>('users', userId);

      if (!result) {
        throw new Error('User not found');
      }

      console.log('[useUser] Loaded user:', result._id);

      // Update cache
      const cacheKey = `user_${userId}`;
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: result,
          timestamp: Date.now(),
        })
      );

      // Update state
      setUser(result);

      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      console.error('[useUser] Fetch error:', err);
      
      if (!isBackgroundUpdate) {
        throw err;
      }
    }
  };

  /**
   * Update user with optimistic locking
   */
  const updateUser = useCallback(
    async (updates: Partial<User>): Promise<User> => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        // Prepare update data (remove immutable fields)
        const updateData: any = { ...updates };
        delete updateData._id;
        delete updateData.created_at;
        delete updateData.created_by;
        delete updateData.version;

        console.log('[useUser] Updating user:', userId);

        // Update using DataClient (includes optimistic locking)
        const updatedUser = await dataClient.update<User>(
          'users',
          userId,
          updateData
        );

        console.log('[useUser] Updated user:', userId);

        // Update local state
        setUser(updatedUser);

        // Invalidate cache
        const cacheKey = `user_${userId}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem('users_cache'); // Also invalidate list cache

        return updatedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user';
        setError(message);
        console.error('[useUser] Error updating user:', err);
        throw new Error(message);
      }
    },
    [userId, dataClient]
  );

  /**
   * Update user status
   */
  const updateStatus = useCallback(
    async (newStatus: UserStatus): Promise<void> => {
      if (!userId || !user) {
        throw new Error('No user loaded');
      }

      if (!dataClient) {
        throw new Error('DataClient not initialized');
      }

      setError(null);

      try {
        console.log('[useUser] Updating status to:', newStatus);

        // Update using DataClient
        const updatedUser = await dataClient.update<User>(
          'users',
          userId,
          { status: newStatus }
        );

        console.log('[useUser] Updated status for:', userId);

        // Update local state
        setUser(updatedUser);

        // Invalidate cache
        const cacheKey = `user_${userId}`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem('users_cache');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setError(message);
        console.error('[useUser] Error updating status:', err);
        throw new Error(message);
      }
    },
    [userId, user, dataClient]
  );

  /**
   * Delete user (soft delete)
   */
  const deleteUser = useCallback(async (): Promise<void> => {
    if (!userId) {
      throw new Error('No user ID provided');
    }

    if (!dataClient) {
      throw new Error('DataClient not initialized');
    }

    setError(null);

    try {
      console.log('[useUser] Deleting user:', userId);

      // Delete using DataClient (soft delete)
      await dataClient.delete('users', userId);

      console.log('[useUser] Deleted user:', userId);

      // Clear local state
      setUser(null);

      // Invalidate cache
      const cacheKey = `user_${userId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem('users_cache');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      console.error('[useUser] Error deleting user:', err);
      throw new Error(message);
    }
  }, [userId, dataClient]);

  /**
   * Reload user data from server
   */
  const reload = useCallback(async () => {
    // Clear cache and refetch
    if (userId) {
      const cacheKey = `user_${userId}`;
      localStorage.removeItem(cacheKey);
    }
    await fetchUser();
  }, [userId, fetchUser]);

  // Auto-fetch on mount and when userId/dataClient changes
  useEffect(() => {
    if (userId && userId !== 'new' && userId !== 'add' && dataClient) {
      console.log('[useUser] Auto-fetching user:', userId);
      fetchUser();
    }
  }, [userId, dataClient]); // Only depend on userId and dataClient

  return {
    user,
    loading,
    error,
    fetchUser,
    updateUser,
    updateStatus,
    deleteUser,
    reload,
  };
}