/**
 * Users Page
 * Main users management page with table/grid view modes
 * ✅ UPDATED 2026-01-15: Unified statistics design
 */

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner@2.0.3';
import { StatisticsCards } from '../components/common/StatisticsCards';

type UserStatus = 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING';

export default function UsersPage() {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [mfaFilter, setMfaFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Hooks
  const { users, loading, error, deleteUser, updateUser } = useUsers({ autoLoad: true });

  // Apply filters
  const filteredUsers = users.filter(user => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query); // Fix: phone not phone_number
      if (!matches) return false;
    }

    // Status
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;

    // Verified - check email_verified since we don't have is_verified
    if (verifiedFilter === 'verified' && !user.email_verified) return false;
    if (verifiedFilter === 'unverified' && user.email_verified) return false;

    // MFA - might be in metadata, skip for now
    const userMfa = user.metadata?.mfa_enabled || false;
    if (mfaFilter === 'enabled' && !userMfa) return false;
    if (mfaFilter === 'disabled' && userMfa) return false;

    return true;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    verified: users.filter(u => u.email_verified).length, // Fix: email_verified
    mfa: users.filter(u => u.metadata?.mfa_enabled).length, // Fix: from metadata
    support: users.filter(u => u.metadata?.is_support_staff).length, // Fix: from metadata
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      await updateUser(id, { status });
      toast.success('Status updated successfully');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }
    
    if (!confirm(`${action} ${selectedUsers.length} users?`)) return;
    
    // Implementation for bulk actions
    console.log(`Bulk ${action}:`, selectedUsers);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                Users
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý người dùng trong hệ thống
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {/* Export */}}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {/* Import */}}
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => navigate('/core/users/new')}
            >
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </div>
        </div>

        {/* Stats */}
        <StatisticsCards 
          stats={[
            { label: 'Tổng số', value: stats.total, color: 'gray', icon: UsersIcon },
            { label: 'Active', value: stats.active, color: 'green', icon: CheckCircle },
            { label: 'Verified', value: stats.verified, color: 'blue', icon: UserCheck },
            { label: 'MFA Enabled', value: stats.mfa, color: 'purple', icon: Shield },
            { label: 'Support Staff', value: stats.support, color: 'indigo', icon: User },
          ]}
          columns={5}
          className="mb-6"
        />

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
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
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Tất cả</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="DISABLED">Disabled</option>
                  <option value="BANNED">Banned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác thực
                </label>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Tất cả</option>
                  <option value="verified">Đã xác thực</option>
                  <option value="unverified">Chưa xác thực</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MFA
                </label>
                <select
                  value={mfaFilter}
                  onChange={(e) => setMfaFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
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
              <span className="text-sm text-gray-600">
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
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4" />
            Table
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
            Grid
          </Button>
        </div>

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
      </div>
    </div>
  );
}