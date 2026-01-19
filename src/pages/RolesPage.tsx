/**
 * RolesPage Component
 * Quản lý vai trò (Roles) - Under 500 lines
 * ✅ MIGRATED Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Filter, Shield, Eye, MoreVertical, Lock, Edit, CheckCircle, Users } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRoles } from '@/hooks/useRoles';
import { RoleFormModal } from '@/components/roles/RoleFormModal';
import { Role } from '@/api/rolesApi';
import { showToast } from '@/lib/toast';
import { DEFAULT_TENANT_ID } from '@/constants/tenant-constants';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatisticsCards } from '@/components/common/StatisticsCards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RolesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'SYSTEM' | 'CUSTOM'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

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
  const { roles, loading, error, deleteRole, createRole, updateRole } = useRoles({ autoLoad: true });

  // Handler functions
  const handleCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingRole) {
        await updateRole(editingRole._id, data);
        showToast.success('Cập nhật thành công', 'Đã cập nhật vai trò');
      } else {
        await createRole(data);
        showToast.success('Tạo thành công', 'Đã tạo vai trò mới');
      }
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (err) {
      console.error('Error saving role:', err);
      showToast.error('Lỗi', 'Lỗi khi lưu vai trò');
    }
  };

  // Apply filters
  const filteredRoles = roles.filter(role => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = role.name.toLowerCase().includes(query);
      const descMatch = role.description?.toLowerCase().includes(query);
      if (!nameMatch && !descMatch) return false;
    }

    // Type filter
    if (typeFilter !== 'all' && role.type !== typeFilter) return false;

    return true;
  });

  const stats = [
    { label: 'Tổng vai trò', value: roles.length, color: 'indigo' as const, icon: Shield },
    { label: 'System', value: roles.filter(r => r.type === 'SYSTEM').length, color: 'blue' as const, icon: Shield },
    { label: 'Custom', value: roles.filter(r => r.type === 'CUSTOM').length, color: 'green' as const, icon: Shield },
    { label: 'Có quyền', value: roles.filter(r => r.permission_codes.length > 0).length, color: 'purple' as const, icon: Lock },
  ];

  const handleDelete = async (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận xóa vai trò',
      description: `Bạn có chắc muốn xóa vai trò "${name}"?`,
      onConfirm: async () => {
        try {
          await deleteRole(id);
          showToast.success('Thành công', 'Đã xóa vai trò');
        } catch (err) {
          showToast.error('Lỗi', 'Không thể xóa vai trò');
        }
      },
      variant: 'destructive',
    });
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
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageLayout
        icon={Shield}
        title="Vai trò"
        description="Quản lý vai trò và quyền hạn trong hệ thống"
        actions={
          <Button size="sm" className="gap-2" onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            Tạo vai trò
          </Button>
        }
      >
        {/* Stats Cards */}
        <StatisticsCards stats={stats} />

        {/* Filters & Search */}
        <Card className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, mô tả..."
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
              Bộ lọc
            </Button>
          </div>

          {showFilters && (
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại vai trò
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="all">Tất cả</option>
                <option value="SYSTEM">System</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          )}
        </Card>

        {/* Roles Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quyền hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cập nhật
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Không tìm thấy vai trò nào</p>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{role.name}</p>
                          {role.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={role.type} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {role.permission_codes.length} quyền
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(role.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/roles/${role._id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(role)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            {role.type !== 'SYSTEM' && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(role._id, role.name)}
                                className="text-red-600"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị {filteredRoles.length} trong tổng số {roles.length} vai trò
            </p>
          </div>
        </Card>

        {/* Role Form Modal */}
        <RoleFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRole(null);
          }}
          onSave={handleSave}
          role={editingRole}
        />

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