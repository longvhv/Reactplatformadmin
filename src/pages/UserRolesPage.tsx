/**
 * UserRolesPage - Quản lý phân quyền người dùng
 * Kế thừa pattern từ RolesPage để tránh trùng lặp code
 * 
 * ✅ FIXED 2026-01-14:
 * - Use correct fields: granted_at (not assigned_at)
 * - All fields now exist in interface
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, Filter, UserCog, Shield, Globe, Building2, Users, Folder } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { userRolesApi, UserRole } from '@/api/userRolesApi';
import { UserRoleDialog } from '@/components/user-roles/UserRoleDialog';

export default function UserRolesPage() {
  const navigate = useNavigate();
  
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

  // Fetch user roles
  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const data = await userRolesApi.getAll();
      setUserRoles(data);
      setFilteredRoles(data);
    } catch (error: any) {
      toast.error('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...userRoles];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ur => 
        ur.user_email?.toLowerCase().includes(query) ||
        ur.user_full_name?.toLowerCase().includes(query) ||
        ur.role_name?.toLowerCase().includes(query) ||
        ur.role_slug?.toLowerCase().includes(query)
      );
    }
    
    // Active filter
    if (filterActive !== 'all') {
      result = result.filter(ur => 
        filterActive === 'active' ? ur.is_active : !ur.is_active
      );
    }
    
    setFilteredRoles(result);
  }, [searchQuery, filterActive, userRoles]);

  const handleCreate = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleEdit = (userRole: UserRole) => {
    setEditingRole(userRole);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa phân quyền này?')) return;
    
    try {
      await userRolesApi.delete(id);
      toast.success('✅ Xóa phân quyền thành công!');
      fetchUserRoles();
    } catch (error: any) {
      toast.error('❌ ' + error.message);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingRole(null);
    fetchUserRoles();
  };

  const stats = {
    total: userRoles.length,
    active: userRoles.filter(ur => ur.is_active).length,
    inactive: userRoles.filter(ur => !ur.is_active).length,
    expired: userRoles.filter(ur => userRolesApi.isExpired(ur)).length,
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global': return Globe;
      case 'tenant': return Building2;
      case 'department': return Users;
      case 'project': return Folder;
      default: return Shield;
    }
  };

  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case 'global': return 'bg-purple-100 text-purple-800';
      case 'tenant': return 'bg-blue-100 text-blue-800';
      case 'department': return 'bg-green-100 text-green-800';
      case 'project': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Phân quyền người dùng</h1>
            <p className="text-gray-600 dark:text-gray-400">Quản lý vai trò của người dùng trong hệ thống với multi-scope support</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vô hiệu hóa</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đã hết hạn</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm user, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterActive === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive('all')}
            >
              Tất cả
            </Button>
            <Button
              variant={filterActive === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive('active')}
            >
              Đang hoạt động
            </Button>
            <Button
              variant={filterActive === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive('inactive')}
            >
              Vô hiệu hóa
            </Button>
          </div>

          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Thêm phân quyền
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Người dùng</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Vai trò</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Phạm vi</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Trạng thái</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ngày gán</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Hết hạn</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Không tìm thấy phân quyền nào
                  </td>
                </tr>
              ) : (
                filteredRoles.map((ur) => {
                  const isExpired = userRolesApi.isExpired(ur);
                  const ScopeIcon = getScopeIcon(ur.scope);
                  
                  return (
                    <tr key={ur._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {ur.user_full_name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">{ur.user_email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {ur.role_name || 'Unknown Role'}
                          </div>
                          <div className="text-sm text-gray-500">{ur.role_slug}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${getScopeBadgeColor(ur.scope)} flex items-center gap-1 w-fit`}>
                          <ScopeIcon className="w-3 h-3" />
                          {ur.scope}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {isExpired ? (
                          <Badge variant="destructive">Đã hết hạn</Badge>
                        ) : ur.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Hoạt động</Badge>
                        ) : (
                          <Badge variant="secondary">Vô hiệu hóa</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {ur.granted_at ? new Date(ur.granted_at).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {ur.expires_at ? new Date(ur.expires_at).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ur)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ur._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog */}
      <UserRoleDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingRole(null);
        }}
        onSuccess={handleSuccess}
        userRole={editingRole}
      />
    </div>
  );
}