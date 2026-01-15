/**
 * UsersPage Component
 * Main user management page - Under 500 lines
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsers } from '@/hooks/useUsers';
import type { UserStatus } from '@/data/users';

export default function UsersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [mfaFilter, setMfaFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
    if (!confirm(t('users.confirmDelete'))) return;
    try {
      await deleteUser(id);
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleStatusChange = async (id: string, status: UserStatus) => {
    try {
      await updateUser(id, { status });
    } catch (err) {
      alert('Failed to update status');
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
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
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
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                {t('users.title')}
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
              {t('users.addNew')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">Verified</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{stats.verified}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">MFA Enabled</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">{stats.mfa}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-500">Support Staff</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{stats.support}</p>
          </div>
        </div>

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

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u._id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bảo mật
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-gray-500">Không tìm thấy người dùng</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user._id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {user.avatar_url ? (
                            <button
                              onClick={() => navigate(`/core/users/${user._id}`)}
                              className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                            >
                              <img
                                src={user.avatar_url}
                                alt={user.full_name}
                                className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/core/users/${user._id}`)}
                              className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <span className="text-indigo-600 font-medium">
                                {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                              </span>
                            </button>
                          )}
                          <div className="ml-4">
                            <button
                              onClick={() => navigate(`/core/users/${user._id}`)}
                              className="text-sm font-medium text-gray-900 hover:text-indigo-600 text-left block"
                            >
                              {user.full_name}
                            </button>
                            <button
                              onClick={() => navigate(`/core/users/${user._id}`)}
                              className="text-sm text-gray-500 hover:text-indigo-600 text-left block"
                            >
                              {user.email}
                            </button>
                            {user.phone && (
                              <button
                                onClick={() => navigate(`/core/users/${user._id}`)}
                                className="text-xs text-gray-400 hover:text-indigo-600 text-left block"
                              >
                                {user.phone}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                        {user.metadata?.is_support_staff && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Shield className="w-3 h-3 inline mr-1" />
                            Support
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.email_verified ? (
                            <UserCheck className="w-4 h-4 text-green-600" title="Verified" />
                          ) : (
                            <UserX className="w-4 h-4 text-gray-400" title="Not verified" />
                          )}
                          {user.metadata?.mfa_enabled ? (
                            <Lock className="w-4 h-4 text-green-600" title="MFA enabled" />
                          ) : (
                            <Unlock className="w-4 h-4 text-gray-400" title="MFA disabled" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/core/users/${user._id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}