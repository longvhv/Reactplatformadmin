/**
 * Permissions Management Page
 * Quản lý phân quyền hệ thống theo cấu trúc cây phân cấp
 * 
 * ✅ CREATED 2026-01-15: Hoàn thiện Permissions module
 * - Tree structure view với expand/collapse
 * - Nhóm theo Application (app_code)
 * - CRUD operations đầy đủ
 * - Filter và search capabilities
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import { Permission, PermissionNode, CreatePermissionRequest, UpdatePermissionRequest } from '../api/permissionsApi';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Plus, RefreshCw, Search, Shield, Folder, ChevronRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { PermissionFormDialog } from '../components/permissions/PermissionFormDialog';
import { PermissionTreeItem } from '../components/permissions/PermissionTreeItem';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

export default function PermissionsPage() {
  const { t } = useLanguage();
  const {
    permissions,
    loading,
    error,
    createPermission,
    updatePermission,
    deletePermission,
    getTree,
    buildTree,
    refresh,
  } = usePermissions({ autoLoad: true });

  // UI State
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);
  const [parentCode, setParentCode] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  // Tree state
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [appPermissions, setAppPermissions] = useState<Record<string, PermissionNode[]>>({});

  // Get unique apps from permissions
  const apps = Array.from(new Set(permissions.map(p => p.app_code))).sort();

  // Build tree when permissions change
  useEffect(() => {
    if (permissions.length > 0) {
      // Build overall tree
      const tree = buildTree();
      setPermissionTree(tree);

      // Build tree per app
      const byApp: Record<string, PermissionNode[]> = {};
      apps.forEach(app => {
        const appPerms = permissions.filter(p => p.app_code === app);
        byApp[app] = buildTree(); // This should be filtered, but buildTree uses all permissions
        // So we need to do it differently
      });
      
      // Better approach: group by app first
      const grouped: Record<string, PermissionNode[]> = {};
      apps.forEach(app => {
        const appPerms = permissions.filter(p => p.app_code === app);
        // Build tree from filtered permissions
        const map = new Map<string, PermissionNode>();
        const roots: PermissionNode[] = [];

        appPerms.forEach(perm => {
          map.set(perm.code, { ...perm, children: [] });
        });

        appPerms.forEach(perm => {
          const node = map.get(perm.code)!;
          if (perm.parent_code && map.has(perm.parent_code)) {
            const parent = map.get(perm.parent_code)!;
            parent.children = parent.children || [];
            parent.children.push(node);
          } else {
            roots.push(node);
          }
        });

        grouped[app] = roots;
      });

      setAppPermissions(grouped);
    }
  }, [permissions, buildTree, apps]);

  // Handle create
  const handleCreate = (parent?: Permission) => {
    setEditingPermission(null);
    setParentCode(parent?.code || null);
    setShowFormDialog(true);
  };

  // Handle edit
  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setParentCode(permission.parent_code || null);
    setShowFormDialog(true);
  };

  // Handle delete (initiate)
  const handleDeleteClick = (permission: Permission) => {
    setDeletingPermission(permission);
    setShowDeleteDialog(true);
  };

  // Handle delete (confirm)
  const handleDeleteConfirm = async () => {
    if (!deletingPermission) return;

    try {
      await deletePermission(deletingPermission._id);
      toast.success('Đã xóa permission thành công');
      setShowDeleteDialog(false);
      setDeletingPermission(null);
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Không thể xóa permission'
      );
    }
  };

  // Handle form submit
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingPermission) {
        await updatePermission(editingPermission._id, data as UpdatePermissionRequest);
        toast.success('Đã cập nhật permission thành công');
      } else {
        await createPermission(data as CreatePermissionRequest);
        toast.success('Đã tạo permission mới thành công');
      }
      setShowFormDialog(false);
      setEditingPermission(null);
      setParentCode(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Không thể lưu permission'
      );
    }
  };

  // Filter permissions
  const filteredPermissions = permissions.filter((permission) => {
    // App filter
    if (selectedApp !== 'all' && permission.app_code !== selectedApp) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        permission.code.toLowerCase().includes(query) ||
        permission.name.toLowerCase().includes(query) ||
        (permission.description?.toLowerCase().includes(query) || false);
      
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Get available parents for form (only groups in selected app)
  const availableParents = permissions
    .filter(p => p.is_group && (selectedApp === 'all' || p.app_code === selectedApp))
    .map(p => ({ code: p.code, name: p.name }));

  // Calculate stats
  const stats = {
    total: permissions.length,
    groups: permissions.filter(p => p.is_group).length,
    permissions: permissions.filter(p => !p.is_group).length,
    byApp: apps.reduce((acc, app) => {
      acc[app] = permissions.filter(p => p.app_code === app).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Quản lý Phân quyền
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Định nghĩa và quản lý các quyền trong hệ thống
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>

              <Button
                onClick={() => handleCreate()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm Permission
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tổng số permissions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Nhóm phân quyền</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.groups}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Folder className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Quyền riêng lẻ</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {stats.permissions}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedApp} onValueChange={setSelectedApp}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Chọn ứng dụng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ứng dụng</SelectItem>
                {apps.map((app) => (
                  <SelectItem key={app} value={app}>
                    {app} ({stats.byApp[app]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'tree' | 'flat')}>
            <TabsList className="mb-4">
              <TabsTrigger value="tree">Dạng cây</TabsTrigger>
              <TabsTrigger value="flat">Dạng bảng</TabsTrigger>
            </TabsList>

            {/* Tree View */}
            <TabsContent value="tree">
              {selectedApp === 'all' ? (
                // Show all apps grouped
                <div className="space-y-6">
                  {apps.map((app) => (
                    <div key={app} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {app}
                          </h3>
                          <Badge variant="secondary">
                            {stats.byApp[app]} permissions
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {appPermissions[app]?.map((permission) => (
                          <PermissionTreeItem
                            key={permission._id}
                            permission={permission}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onAddChild={handleCreate}
                          />
                        ))}
                        {(!appPermissions[app] || appPermissions[app].length === 0) && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Chưa có permission nào
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Show selected app only
                <div className="space-y-1">
                  {appPermissions[selectedApp]?.map((permission) => (
                    <PermissionTreeItem
                      key={permission._id}
                      permission={permission}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onAddChild={handleCreate}
                    />
                  ))}
                  {(!appPermissions[selectedApp] || appPermissions[selectedApp].length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Chưa có permission nào cho ứng dụng này
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Flat View */}
            <TabsContent value="flat">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mã
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        App
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Parent
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPermissions.map((permission) => (
                      <tr key={permission._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                          {permission.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {permission.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="outline">{permission.app_code}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {permission.is_group ? (
                            <Badge className="bg-yellow-100 text-yellow-800">Group</Badge>
                          ) : (
                            <Badge className="bg-indigo-100 text-indigo-800">Permission</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">
                          {permission.parent_code || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(permission)}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(permission)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPermissions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Không tìm thấy permission nào
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Form Dialog */}
      <PermissionFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        permission={editingPermission}
        appCode={selectedApp !== 'all' ? selectedApp : (apps[0] || '')}
        parentCode={parentCode}
        availableParents={availableParents}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa Permission"
        description={
          deletingPermission
            ? `Bạn có chắc chắn muốn xóa permission "${deletingPermission.name}" (${deletingPermission.code})? Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </div>
  );
}
