/**
 * UserRolesPage - Quản lý phân quyền người dùng
 * Kế thừa pattern từ RolesPage để tránh trùng lặp code
 * 
 * ✅ MIGRATED to Phase 3 Standards (2026-01-18):
 * - Replaced confirm() with ConfirmDialog
 * - Using showToast (toast from sonner) for all notifications
 * - Wrapped in Fragment
 * - Using PageLayout with icon/title/description
 * - Using StatisticsCards component
 * - Full dark mode support
 * - Added missing imports (useLanguage, Button, Input, Card)
 */

import { Fragment, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Trash2, Search, UserCog, Shield, Globe, Building2, Users, Folder, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { showToast } from '@/lib/toast';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLayout } from '@/components/layout/PageLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

// ==================== TYPES ====================
// TODO: Replace with actual API when available
interface UserRole {
  _id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  role_id: string;
  role_name: string;
  role_slug: string;
  scope: 'global' | 'tenant' | 'department' | 'project';
  is_active: boolean;
  granted_at: string;
  expires_at?: string;
  granted_by?: string;
  created_at: string;
  updated_at: string;
}

// Mock API - Replace with actual implementation
const userRolesApi = {
  getAll: async (params: { limit?: number }) => {
    // TODO: Replace with actual API call
    return [] as UserRole[];
  },
  delete: async (id: string) => {
    // TODO: Replace with actual API call
    return Promise.resolve();
  },
  isExpired: (userRole: UserRole) => {
    if (!userRole.expires_at) return false;
    return new Date(userRole.expires_at) < new Date();
  },
};

export default function UserRolesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Fetch user roles
  const fetchUserRoles = useCallback(async () => {
    try {
      setLoading(true);
      // Limit to 1000 records to prevent OOM on massive datasets
      const data = await userRolesApi.getAll({ limit: 1000 });
      setUserRoles(data);
      setFilteredRoles(data);
    } catch (error: any) {
      showToast.error('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

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
    setConfirmDialog({
      open: true,
      title: 'Xóa phân quyền',
      description: 'Bạn có chắc muốn xóa phân quyền này?',
      onConfirm: async () => {
        try {
          await userRolesApi.delete(id);
          showToast.success('Thành công', 'Xóa phân quyền thành công!');
          fetchUserRoles();
        } catch (error: any) {
          showToast.error('Lỗi', error.message);
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingRole(null);
    fetchUserRoles();
  };

  const stats = [
    { 
      label: t('common.total'), 
      value: userRoles.length, 
      color: 'gray' as const, 
      icon: Shield 
    },
    { 
      label: t('users.active'), 
      value: userRoles.filter(ur => ur.is_active).length, 
      color: 'green' as const, 
      icon: CheckCircle 
    },
    { 
      label: t('users.inactive'), 
      value: userRoles.filter(ur => !ur.is_active).length, 
      color: 'gray' as const, 
      icon: XCircle 
    },
    { 
      label: 'Đã hết hạn', 
      value: userRoles.filter(ur => userRolesApi.isExpired(ur)).length, 
      color: 'red' as const, 
      icon: Clock 
    },
  ];

  const scopeConfig = {
    global: { label: 'Global', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: Globe },
    tenant: { label: 'Tenant', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Building2 },
    department: { label: 'Department', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: Users },
    project: { label: 'Project', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: Folder },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <Fragment>
      <PageLayout
        title={t('navigation.userRoles')}
        description={t('users.description')}
        icon={UserCog}
        actions={
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Thêm phân quyền
          </Button>
        }
      >
        <StatisticsCards stats={stats} columns={4} className="mb-0 border-none shadow-sm" />

        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
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
                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Không tìm thấy phân quyền nào
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((ur) => {
                    const isExpired = userRolesApi.isExpired(ur);
                    
                    return (
                      <tr key={ur._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ur.user_full_name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{ur.user_email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ur.role_name || 'Unknown Role'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{ur.role_slug}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={ur.scope} config={scopeConfig} />
                        </td>
                        <td className="p-4">
                          {isExpired ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Đã hết hạn
                            </span>
                          ) : ur.is_active ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              Vô hiệu hóa
                            </span>
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
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
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
      </PageLayout>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </Fragment>
  );
}
