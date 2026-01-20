/**
 * Permissions Management Page
 * Trang quản lý phân quyền hệ thống theo cấu trúc cây phân cấp
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Shield, Plus, Search, Loader2, AlertCircle, Folder, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { PermissionTreeItem } from '@/components/permissions/PermissionTreeItem';
import { PermissionFormDialog } from '@/components/permissions/PermissionFormDialog';
import { showToast } from '@/lib/toast';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

interface Permission {
  _id: string;
  code: string;
  name: string;
  description?: string;
  is_group: boolean;
  parent_code?: string | null;
  path: string;
  app_code: string;
  children?: Permission[];
  version?: number;
}

function PermissionsPage() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appCode, setAppCode] = useState('admin');
  const [showDialog, setShowDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [parentCode, setParentCode] = useState<string | null>(null);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0`;

  // Fetch permissions tree
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/permissions/tree/${appCode}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Suppress error for table not found (permissions table hasn't been created yet)
        if (response.status === 404 || errorData.error?.includes('not found') || errorData.error?.includes('PGRST')) {
          console.log('[Permissions] Table not created yet, showing empty state');
          setPermissions([]);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch permissions');
      }

      const result = await response.json();
      setPermissions(result.data || []);
    } catch (error: any) {
      // Only log real errors, not "table doesn't exist" errors
      if (!error.message?.includes('not found') && !error.message?.includes('PGRST')) {
        console.error('Error fetching permissions:', error);
        showToast.error('Lỗi', error.message || 'Không thể tải danh sách permissions');
      }
      // Set empty array so UI doesn't break
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [appCode]);

  // Get flat list of all permissions for parent selection
  const getFlatPermissions = (perms: Permission[], result: Permission[] = []): Permission[] => {
    perms.forEach(p => {
      result.push(p);
      if (p.children) {
        getFlatPermissions(p.children, result);
      }
    });
    return result;
  };

  const flatPermissions = getFlatPermissions(permissions);
  const availableParents = flatPermissions
    .filter(p => p.is_group)
    .map(p => ({ code: p.code, name: p.name }));

  // Handle create permission
  const handleCreate = () => {
    setEditingPermission(null);
    setParentCode(null);
    setShowDialog(true);
  };

  // Handle edit permission
  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setParentCode(permission.parent_code || null);
    setShowDialog(true);
  };

  // Handle add child
  const handleAddChild = (parentPermission: Permission) => {
    setEditingPermission(null);
    setParentCode(parentPermission.code);
    setShowDialog(true);
  };

  // Handle delete permission
  const handleDelete = async (permission: Permission) => {
    if (!window.confirm(`Bạn có chắc muốn xóa permission "${permission.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/permissions/${permission._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete permission');
      }

      showToast.success('Thành công', 'Đã xóa permission');
      fetchPermissions();
    } catch (error: any) {
      console.error('Error deleting permission:', error);
      showToast.error('Lỗi', error.message || 'Không thể xóa permission');
    }
  };

  // Handle form submit
  const handleSubmit = async (data: Permission) => {
    try {
      const isEdit = !!editingPermission;
      const url = isEdit 
        ? `${baseUrl}/permissions/${editingPermission._id}`
        : `${baseUrl}/permissions`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          app_code: appCode,
          parent_code: parentCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'create'} permission`);
      }

      showToast.success('Thành công', isEdit ? 'Đã cập nhật permission' : 'Đã tạo permission mới');
      setShowDialog(false);
      fetchPermissions();
    } catch (error: any) {
      console.error('Error submitting permission:', error);
      showToast.error('Lỗi', error.message || 'Không thể lưu permission');
      // Re-throw để PermissionFormDialog có thể handle loading state
      throw error;
    }
  };

  // Filter permissions by search term
  const filterPermissions = (perms: Permission[]): Permission[] => {
    if (!searchTerm) return perms;
    
    return perms.reduce((acc: Permission[], perm) => {
      const matches = 
        perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const filteredChildren = perm.children ? filterPermissions(perm.children) : [];

      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...perm,
          children: filteredChildren.length > 0 ? filteredChildren : perm.children,
        });
      }

      return acc;
    }, []);
  };

  const filteredPermissions = filterPermissions(permissions);

  // Calculate stats
  const totalPermissions = flatPermissions.length;
  const groupCount = flatPermissions.filter(p => p.is_group).length;
  const permissionCount = flatPermissions.filter(p => !p.is_group).length;

  return (
    <PageLayout
      icon={Shield}
      title="Phân quyền"
      description="Quản lý permissions và authorization theo cấu trúc cây phân cấp"
      actions={
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Permission
        </Button>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng Permissions</p>
              <p className="text-2xl font-bold">{totalPermissions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Folder className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nhóm</p>
              <p className="text-2xl font-bold">{groupCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Permissions</p>
              <p className="text-2xl font-bold">{permissionCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={appCode}
              onChange={(e) => setAppCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="admin">Admin App</option>
              <option value="portal">Portal App</option>
              <option value="api">API App</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Permissions Tree */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải permissions...</span>
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có permissions'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo permission đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Permission Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPermissions.map((permission) => (
              <PermissionTreeItem
                key={permission._id}
                permission={permission}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Form Dialog */}
      <PermissionFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        permission={editingPermission}
        appCode={appCode}
        parentCode={parentCode}
        availableParents={availableParents}
        onSubmit={handleSubmit}
      />
    </PageLayout>
  );
}

export default PermissionsPage;