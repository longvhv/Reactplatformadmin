/**
 * RolesPage Component
 * Quản lý vai trò (Roles) - Under 500 lines
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Edit, Trash2, Filter, Shield as ShieldIcon, Eye, MoreVertical, Lock } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoles } from '@/hooks/useRoles';
import { RoleFormModal } from '@/components/roles/RoleFormModal';
import { Role } from '@/api/rolesApi';
import { toast } from 'sonner';

export default function RolesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'SYSTEM' | 'CUSTOM'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

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
        toast.success('Đã cập nhật vai trò');
      } else {
        await createRole(data);
        toast.success('Đã tạo vai trò mới');
      }
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (err) {
      console.error('Error saving role:', err);
      toast.error('Lỗi khi lưu vai trò');
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

  // Stats
  const stats = {
    total: roles.length,
    system: roles.filter(r => r.type === 'SYSTEM').length,
    custom: roles.filter(r => r.type === 'CUSTOM').length,
    withPermissions: roles.filter(r => r.permission_codes.length > 0).length,
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa vai trò "${name}"?`)) return;
    try {
      await deleteRole(id);
    } catch (err) {
      alert('Failed to delete role');
    }
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
                <ShieldIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                Vai trò
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý vai trò và quyền hạn trong hệ thống
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
              size="sm"
              className="gap-2"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4" />
              Tạo vai trò
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ShieldIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng vai trò</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">System</p>
                <p className="text-xl font-bold text-blue-600">{stats.system}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Custom</p>
                <p className="text-xl font-bold text-green-600">{stats.custom}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShieldIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Có quyền</p>
                <p className="text-xl font-bold text-purple-600">{stats.withPermissions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm theo tên vai trò, mô tả..."
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
            <div className="pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại vai trò
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">Tất cả</option>
                  <option value="SYSTEM">System</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Roles List */}
        {filteredRoles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <ShieldIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Không tìm thấy vai trò</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <div key={role._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`
                        p-3 rounded-lg
                        ${role.type === 'SYSTEM' ? 'bg-blue-100' : 'bg-green-100'}
                      `}>
                        <ShieldIcon className={`
                          w-6 h-6
                          ${role.type === 'SYSTEM' ? 'text-blue-600' : 'text-green-600'}
                        `} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/core/roles/${role._id}`)}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600 block truncate"
                        >
                          {role.name}
                        </button>
                        
                        <span className={`
                          inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium
                          ${role.type === 'SYSTEM' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                          }
                        `}>
                          {role.type}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative group ml-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                        <div className="py-1">
                          <button
                            onClick={() => navigate(`/core/roles/${role._id}`)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleEdit(role)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Chỉnh sửa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {role.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {role.description}
                    </p>
                  )}

                  {/* Permissions Count */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Lock className="w-4 h-4" />
                      <span>{role.permission_codes.length} quyền</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      v{role.version}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    Tạo: {formatDate(role.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={editingRole}
        onSave={handleSave}
        tenantId="default-tenant"
      />
    </div>
  );
}