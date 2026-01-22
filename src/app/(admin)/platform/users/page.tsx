'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { 
  Users, Plus, Search, Filter, Edit, Trash2, MoreVertical, 
  CheckCircle, XCircle, Shield, Globe, Lock, Mail, Phone 
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { usersApi, User, UserStatus } from '../../../../api/usersApi';
import { showToast } from '../../../../lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../../../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này sẽ chuyển người dùng sang trạng thái xóa mềm.')) return;
    try {
      await usersApi.delete(id);
      showToast.success('Thành công', 'Đã xóa người dùng');
      loadUsers(); // Reload to update status/list
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể xóa người dùng: ' + error.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: UserStatus) => {
    try {
      await usersApi.updateStatus(id, newStatus);
      showToast.success('Thành công', `Đã cập nhật trạng thái thành ${newStatus}`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: newStatus } : u));
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const filteredUsers = users.filter(user => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone_number && user.phone_number.includes(query));
      if (!matches) return false;
    }

    // Status Filter
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Active</Badge>;
      case 'BANNED': return <Badge variant="destructive">Banned</Badge>;
      case 'DISABLED': return <Badge variant="secondary">Disabled</Badge>;
      case 'PENDING': return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleRowClick = (userId: string) => {
    router.push(`/platform/users/${userId}`);
  };

  return (
    <PageLayout
      icon={Users}
      title="Quản lý Người dùng"
      description="Quản lý tài khoản, trạng thái và quyền truy cập người dùng hệ thống"
      actions={
        <Button onClick={() => router.push('/platform/users/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm Người dùng
        </Button>
      }
    >
      <Card className="p-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                placeholder="Tìm kiếm theo tên, email, số điện thoại..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="ACTIVE">Hoạt động (Active)</option>
                  <option value="PENDING">Chờ duyệt (Pending)</option>
                  <option value="DISABLED">Vô hiệu hóa (Disabled)</option>
                  <option value="BANNED">Bị cấm (Banned)</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin thêm</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user._id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors" 
                    onClick={() => handleRowClick(user._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 border mr-3">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            {user.is_support_staff && <Shield className="w-3 h-3 text-indigo-500" />}
                            {user.is_support_staff && "Support Staff"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {user.email}
                      </div>
                      {user.phone_number && (
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {user.phone_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div>{getStatusBadge(user.status)}</div>
                        {user.is_verified && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {user.locale}
                        </div>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3" /> MFA: {user.mfa_enabled ? 'On' : 'Off'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/platform/users/edit/${user._id}`)}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/users/edit/${user._id}`)}>
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status !== 'ACTIVE' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user._id, 'ACTIVE')}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Kích hoạt
                              </DropdownMenuItem>
                            )}
                            {user.status === 'ACTIVE' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user._id, 'DISABLED')}>
                                <XCircle className="w-4 h-4 mr-2 text-yellow-600" />
                                Vô hiệu hóa
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleStatusChange(user._id, 'BANNED')}>
                              <Shield className="w-4 h-4 mr-2 text-red-600" />
                              Cấm (Ban)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa người dùng
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}