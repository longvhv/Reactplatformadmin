/**
 * useUser Hook
 * Manages single user data fetching and operations
 * Updated to use new userApi with correct endpoints
 */

import { useState, useEffect } from 'react';
import { userApi, User as UserApiType } from '../api/userApi';

// Import old User type for compatibility
import type { UserStatus } from '@/data/users';

// Map new API type to old User type for backward compatibility
type User = UserApiType & {
  status: UserStatus;
};

export function useUser(userId?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user by ID
  const fetchUser = async () => {
    if (!userId || userId === 'new') return;

    setLoading(true);
    setError(null);

    try {
      const data = await userApi.getById(userId);
      setUser(data as User);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (updates: Partial<User>) => {
    if (!userId) return;

    try {
      await userApi.update(userId, updates);
      
      // Refresh user data after update
      await fetchUser();
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  // Update status
  const updateStatus = async (newStatus: UserStatus) => {
    if (!userId) return;

    try {
      const data = await userApi.updateStatus(userId, newStatus);
      
      // Update local state
      if (user) {
        setUser({
          ...user,
          status: data.status as UserStatus,
          updated_at: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      throw err;
    }
  };

  // Delete user
  const deleteUser = async () => {
    if (!userId) return;

    try {
      await userApi.delete(userId);
      setUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  // Auto-fetch on mount and when userId changes
  useEffect(() => {
    if (userId && userId !== 'new') {
      fetchUser();
    }
  }, [userId]);

  return {
    user,
    loading,
    error,
    fetchUser,
    updateUser,
    updateStatus,
    deleteUser,
  };
}