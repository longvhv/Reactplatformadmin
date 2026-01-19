/**
 * Users Page
 * Main users management page with table/grid view modes
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Plus, Search, Grid, List, User, CheckCircle, Shield, 
  Users as UsersIcon, UserCheck, Download, Upload, Filter 
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { UserTable } from '../components/users/UserTable';
import { UserGrid } from '../components/users/UserGrid';
import { showToast } from '../lib/toast';
import { StatisticsCards } from '../components/common/StatisticsCards';
import { PageLayout } from '../components/layout/PageLayout';
import { useLanguage } from '../providers/LanguageProvider';
import { Card } from '../components/ui/card';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

type UserStatus = 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING';

export default function UsersPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [mfaFilter, setMfaFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Hooks
  const { users, loading, deleteUser, updateUser } = useUsers({ autoLoad: true });

  // Apply filters - Memoized
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          user.full_name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone_number?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Status
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;

      // Verified
      if (verifiedFilter === 'verified' && !user.is_verified) return false;
      if (verifiedFilter === 'unverified' && user.is_verified) return false;

      // MFA
      if (mfaFilter === 'enabled' && !user.mfa_enabled) return false;
      if (mfaFilter === 'disabled' && user.mfa_enabled) return false;

      return true;
    });
  }, [users, searchQuery, statusFilter, verifiedFilter, mfaFilter]);

  // Stats - Memoized
  const stats = useMemo(() => {
    return [
      { label: t('common.total'), value: users.length, color: 'gray' as const, icon: UsersIcon },
      { label: t('users.active'), value: users.filter(u => u.status === 'ACTIVE').length, color: 'green' as const, icon: CheckCircle },
      { label: t('users.verified'), value: users.filter(u => u.is_verified).length, color: 'blue' as const, icon: UserCheck },
      { label: t('users.mfaEnabled'), value: users.filter(u => u.mfa_enabled).length, color: 'purple' as const, icon: Shield },
      { label: t('users.supportStaff'), value: users.filter(u => u.is_support_staff).length, color: 'indigo' as const, icon: User },
    ];
  }, [users, t]);

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa người dùng',
      description: 'Bạn có chắc chắn muốn xóa người dùng này không?',
      onConfirm: async () => {
        try {
          await deleteUser(id);
          showToast.success('Xóa thành công', 'Người dùng đã được xóa');
        } catch (err) {
          showToast.error('Lỗi', 'Không thể xóa người dùng');
        }
      },
      variant: 'destructive',
    });
  };

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      await updateUser(id, { status });
      showToast.success('Cập nhật thành công', 'Trạng thái đã được thay đổi');
    } catch (err) {
      showToast.error('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      showToast.warning('Chọn người dùng', 'Vui lòng chọn ít nhất một người dùng');
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: `Xác nhận ${action}`,
      description: `Bạn có chắc muốn ${action} ${selectedUsers.length} người dùng đã chọn?`,
      onConfirm: async () => {
        // Implementation for bulk actions
        console.log(`Bulk ${action}:`, selectedUsers);
        showToast.success('Thành công', `Đã ${action} ${selectedUsers.length} người dùng`);
        setConfirmDialog({ ...confirmDialog, open: false });
      },
      variant: action === 'delete' ? 'destructive' : 'default',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      BANNED: 'bg-red-100 text-red-800',
      DISABLED: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as UserStatus] || colors.ACTIVE;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Fragment>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageLayout
        icon={UsersIcon}
        title={t('navigation.users')}
        description={t('users.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {/* Export */}}
            >
              <Download className="w-4 h-4" />
              {t('common.export')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {/* Import */}}
            >
              <Upload className="w-4 h-4" />
              {t('users.import')}
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate('/admin/users/create')}
            >
              <Plus className="w-4 h-4" />
              {t('users.addNew')}
            </Button>
          </div>
        }
      >
        {/* Stats */}
        <StatisticsCards stats={stats} columns={5} />

        {/* Filters & Search */}
        <Card className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="all">Tất cả</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="DISABLED">Disabled</option>
                  <option value="BANNED">Banned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Xác thực
                </label>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="all">Tất cả</option>
                  <option value="verified">Đã xác thực</option>
                  <option value="unverified">Chưa xác thực</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MFA
                </label>
                <select
                  value={mfaFilter}
                  onChange={(e) => setMfaFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="all">Tất cả</option>
                  <option value="enabled">Đã bật</option>
                  <option value="disabled">Chưa bật</option>
                </select>
              </div>
            </div>
          )}

          {/* Bulk actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 pt-4 border-t mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedUsers.length} đã chọn
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('disable')}
              >
                Disable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUsers([])}
              >
                Clear
              </Button>
            </div>
          )}
        </Card>

        {/* Users Table/Grid */}
        {viewMode === 'table' ? (
          <UserTable
            users={filteredUsers}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            handleDelete={handleDelete}
            handleStatusChange={handleStatusChange}
          />
        ) : (
          <UserGrid
            users={filteredUsers}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            handleDelete={handleDelete}
            handleStatusChange={handleStatusChange}
          />
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
          confirmLabel="Xác nhận"
          cancelLabel="Hủy"
        />
      </PageLayout>
    </Fragment>
  );
}