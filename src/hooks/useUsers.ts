/**
 * useUsers Hook
 * Hook for managing users with full CRUD operations
 * Uses Supabase via API adapter (ready for Golang migration)
 * ✅ FIXED 2026-01-16: Removed infinite reload loop caused by t dependency
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { usersApi, type User } from '@/api/usersApi';

interface UseUsersOptions {
  autoLoad?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { autoLoad = true } = options;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [useUsers] Loading users from Supabase...');
      const loadedUsers = await usersApi.getAll();
      console.log('✅ [useUsers] Loaded users:', loadedUsers.length);
      setUsers(loadedUsers);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load users');
      console.error('❌ [useUsers] Error loading users:', error);
      setError(error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []); // ✅ FIXED: Removed t dependency to prevent infinite loop

  // Load users on mount if autoLoad is enabled
  useEffect(() => {
    if (autoLoad) {
      loadUsers();
    }
  }, [autoLoad, loadUsers]);

  // Create user
  const createUser = useCallback(async (userData: any) => {
    try {
      console.log('🔍 [useUsers] Creating user:', userData);
      const newUser = await usersApi.create(userData);
      console.log('✅ [useUsers] User created:', newUser._id);
      await loadUsers(); // Reload users
      toast.success('User created successfully');
      return newUser;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create user');
      console.error('❌ [useUsers] Error creating user:', error);
      toast.error('Failed to create user');
      throw error;
    }
  }, [loadUsers]); // ✅ FIXED: Removed t dependency

  // Update user
  const updateUser = useCallback(async (id: string, userData: any) => {
    try {
      console.log('🔍 [useUsers] Updating user:', id, userData);
      
      // Get current user to get version
      const currentUser = users.find(u => u._id === id);
      if (!currentUser) {
        throw new Error('User not found in local state');
      }
      
      const updated = await usersApi.update(id, {
        ...userData,
        version: currentUser.version,
      });
      console.log('✅ [useUsers] User updated:', updated._id);
      await loadUsers(); // Reload users
      toast.success('User updated successfully');
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update user');
      console.error('❌ [useUsers] Error updating user:', error);
      toast.error('Failed to update user');
      throw error;
    }
  }, [users, loadUsers]); // ✅ FIXED: Removed t dependency

  // Delete user
  const deleteUser = useCallback(async (id: string) => {
    try {
      console.log('🔍 [useUsers] Deleting user:', id);
      await usersApi.delete(id);
      console.log('✅ [useUsers] User deleted:', id);
      await loadUsers(); // Reload users
      toast.success('User deleted successfully');
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete user');
      console.error('❌ [useUsers] Error deleting user:', error);
      toast.error('Failed to delete user');
      throw error;
    }
  }, [loadUsers]); // ✅ FIXED: Removed t dependency

  // Bulk delete users
  const bulkDeleteUsers = useCallback(async (userIds: string[]) => {
    try {
      console.log('🔍 [useUsers] Bulk deleting users:', userIds.length);
      let deletedCount = 0;
      for (const id of userIds) {
        try {
          await usersApi.delete(id);
          deletedCount++;
        } catch (err) {
          console.error('❌ [useUsers] Failed to delete user:', id, err);
        }
      }
      console.log('✅ [useUsers] Bulk deleted users:', deletedCount);
      await loadUsers(); // Reload users
      toast.success(`${deletedCount} users deleted successfully`);
      return deletedCount;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete users');
      console.error('❌ [useUsers] Error bulk deleting users:', error);
      toast.error('Failed to delete users');
      throw error;
    }
  }, [loadUsers]); // ✅ FIXED: Removed t dependency

  // Get user by id
  const getUser = useCallback((id: string): User | undefined => {
    return users.find(u => u._id === id);
  }, [users]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    getUser,
    refresh: loadUsers,
  };
}

export default useUsers;