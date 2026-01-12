import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '@/providers/LanguageProvider';
import { usersApi, type UserWithMeta } from '@/services/usersApi';
import type { UserData } from '@/components/users/UserDialog';

export function useUsersData() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserWithMeta[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Load users from localStorage on mount
  useEffect(() => {
    const loadedUsers = usersApi.getAll();
    setUsers(loadedUsers);
  }, []);

  const addUser = useCallback((userData: UserData) => {
    const newUser = usersApi.create(userData);
    setUsers(usersApi.getAll());
    toast.success(t('users.userCreated'));
  }, [t]);

  const updateUser = useCallback((id: number, userData: UserData) => {
    const updated = usersApi.update(id, userData);
    if (updated) {
      setUsers(usersApi.getAll());
      toast.success(t('users.userUpdated'));
    }
  }, [t]);

  const deleteUsers = useCallback((userIds: number[]) => {
    const deletedCount = usersApi.bulkDelete(userIds);
    setUsers(usersApi.getAll());
    setSelectedUsers([]);
    
    if (userIds.length > 1) {
      toast.success(t('users.usersDeleted').replace('{count}', deletedCount.toString()));
    } else {
      toast.success(t('users.userDeleted'));
    }
  }, [t]);

  const toggleUserSelection = useCallback((userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  }, []);

  const selectAllUsers = useCallback((userIds: number[]) => {
    setSelectedUsers(userIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  return {
    users,
    selectedUsers,
    addUser,
    updateUser,
    deleteUsers,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
  };
}