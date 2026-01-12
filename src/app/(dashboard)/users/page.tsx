'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Download } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

import { useUsersData } from '@/hooks/useUsersData';
import { useUserFilters } from '@/hooks/useUserFilters';
import { UserStats } from '@/components/users/UserStats';
import { UserFilters } from '@/components/users/UserFilters';
import { UserBulkActions } from '@/components/users/UserBulkActions';
import { UserList } from '@/components/users/UserList';
import { UserPagination } from '@/components/users/UserPagination';
import { UserDialog, UserData } from '@/components/users/UserDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';

export default function UsersPage() {
  const { t } = useLanguage();
  const {
    users,
    selectedUsers,
    addUser,
    updateUser,
    deleteUsers,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
  } = useUsersData();

  const {
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    filteredUsers,
    clearFilters,
    hasFilters,
  } = useUserFilters(users);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: UserData & { id: number }) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  const handleSaveUser = (userData: UserData) => {
    if (editingUser && 'id' in editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
  };

  const handleDeleteUser = (userId: number) => {
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    setDeletingUserId(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    const userIds = deletingUserId ? [deletingUserId] : selectedUsers;
    deleteUsers(userIds);
    setDeletingUserId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllUsers(paginatedUsers.map(u => u.id));
    } else {
      clearSelection();
    }
  };

  const handleExport = () => {
    const dataToExport = selectedUsers.length > 0
      ? users.filter(u => selectedUsers.includes(u.id))
      : users;
    
    const csv = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Status', 'Department', 'Position'],
      ...dataToExport.map(u => [
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.department,
        u.position,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    
    toast.success(t('users.exportUsers'));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    clearSelection();
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
    clearSelection();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('users.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('users.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {t('users.export')}
          </Button>
          <Button 
            onClick={handleAddUser}
            className="bg-[#6366f1] hover:bg-[#4f46e5] gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {t('users.addUser')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <UserStats users={users} />

      {/* Users Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle>{t('users.usersList')}</CardTitle>
              <CardDescription>{t('users.usersListDescription')}</CardDescription>
            </div>

            <UserFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              clearFilters={clearFilters}
              hasFilters={hasFilters}
            />

            <UserBulkActions
              selectedCount={selectedUsers.length}
              onExport={handleExport}
              onDelete={handleDeleteSelected}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <UserList
            users={paginatedUsers}
            selectedUsers={selectedUsers}
            onSelectAll={handleSelectAll}
            onSelectUser={toggleUserSelection}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
          />

          {filteredUsers.length > 0 && (
            <UserPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredUsers.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        userCount={deletingUserId ? 1 : selectedUsers.length}
      />
    </div>
  );
}
