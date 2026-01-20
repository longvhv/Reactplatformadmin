/**
 * RolesPage Component
 * Quản lý vai trò (Roles) - Under 500 lines
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ Phase 3: ConfirmDialog, showToast, Fragment wrapper
 */

'use client';

import { Fragment, useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
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

function RolesPage() {
  const { t } = useLanguage();
  const router = useRouter();

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
        title={t('navigation.roles')}
        description={t('roles.description')}
        actions={
          <Button onClick={handleCreate} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('roles.addRole')}
          </Button>
        }
      >
        {/* Stats */}
        <StatisticsCards stats={stats} columns={4} />

        {/* Filters & Search */}
        <Card className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={t('roles.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              {t('common.filters')}
            </Button>
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="flex gap-4 pt-4 border-t">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">{t('common.allTypes')}</option>
                <option value="SYSTEM">System</option>
                <option value="CUSTOM">Custom</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setSearchQuery('');
                }}
              >
                {t('common.clearFilters')}
              </Button>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredRoles.length} of {roles.length} roles
          </p>
        </Card>

        {/* Roles Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Role Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Permissions</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span className="font-medium">{role.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={role.type}
                        variant={role.type === 'SYSTEM' ? 'blue' : 'green'}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {role.permission_codes.length}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {role.description || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(role.created_at)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/roles/${role._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDelete(role._id, role.name)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRoles.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">{t('roles.noRoles')}</p>
              </div>
            )}
          </div>
        </Card>
      </PageLayout>

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
      />
    </Fragment>
  );
}

// Named export for reuse
export { RolesPage };

// Default export for routing
export default RolesPage;
