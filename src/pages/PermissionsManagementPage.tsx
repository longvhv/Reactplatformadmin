/**
 * Permissions Management Page
 * Quản lý permissions của một ứng dụng với tree view
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2, RefreshCw } from 'lucide-react';
import { PermissionTreeItem } from '@/components/permissions/PermissionTreeItem';
import { PermissionFormDialog } from '@/components/permissions/PermissionFormDialog';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Permission {
  _id: string;
  code: string;
  name: string;
  description?: string;
  is_group: boolean;
  path: string;
  parent_code?: string | null;
  app_code: string;
  version: number;
  children?: Permission[];
}

interface Application {
  code: string;
  name: string;
}

export function PermissionsManagementPage() {
  const { id } = useParams<{ id: string }>();
  
  const [application, setApplication] = useState<Application | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [treeData, setTreeData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [parentCode, setParentCode] = useState<string | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);

  // Fetch application data
  useEffect(() => {
    if (!id) return;
    
    const fetchApplication = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/applications/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setApplication(data);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
      }
    };

    fetchApplication();
  }, [id]);

  // Fetch permissions
  const fetchPermissions = async () => {
    if (!application) return;

    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/permissions/tree/${application.code}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const result = await response.json();
      setTreeData(result.data || []);
      
      // Also fetch flat list for parent selection
      const flatResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/permissions?app_code=${application.code}&is_group=true`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (flatResponse.ok) {
        const flatResult = await flatResponse.json();
        setPermissions(flatResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Không thể tải danh sách permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (application) {
      fetchPermissions();
    }
  }, [application]);

  // Handle create/update
  const handleSubmit = async (data: Permission) => {
    try {
      const url = editingPermission
        ? `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/permissions/${editingPermission._id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/permissions`;

      const response = await fetch(url, {
        method: editingPermission ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error);
      }

      toast.success(editingPermission ? 'Cập nhật thành công' : 'Tạo mới thành công');
      fetchPermissions();
      setFormOpen(false);
      setEditingPermission(null);
      setParentCode(null);
    } catch (error) {
      console.error('Error saving permission:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
      throw error;
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingPermission) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/permissions/${deletingPermission._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error);
      }

      toast.success('Xóa thành công');
      fetchPermissions();
      setDeleteDialogOpen(false);
      setDeletingPermission(null);
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể xóa permission');
    }
  };

  // Get available parents (groups only, excluding current and its descendants)
  const availableParents = permissions.filter(p => {
    if (!p.is_group) return false;
    if (editingPermission && p.code === editingPermission.code) return false;
    if (editingPermission && p.path && p.path.includes(`/${editingPermission.code}/`)) return false;
    return true;
  });

  const totalPermissions = permissions.length;
  const groupCount = permissions.filter(p => p.is_group).length;
  const actionCount = permissions.filter(p => !p.is_group).length;

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-600 mt-1">
            Quản lý permissions cho ứng dụng <strong>{application.name}</strong>
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPermission(null);
            setParentCode(null);
            setFormOpen(true);
          }}
          className="bg-[#6366f1] hover:bg-[#4f46e5]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Permission
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng số</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nhóm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{groupCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quyền thực thi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{actionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tree View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cấu trúc Permissions</CardTitle>
              <CardDescription className="mt-1">
                Hiển thị dạng cây phân cấp
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPermissions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : treeData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có permissions nào</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo permission đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {treeData.map((permission) => (
                <PermissionTreeItem
                  key={permission._id}
                  permission={permission}
                  onEdit={(perm) => {
                    setEditingPermission(perm);
                    setParentCode(null);
                    setFormOpen(true);
                  }}
                  onDelete={(perm) => {
                    setDeletingPermission(perm);
                    setDeleteDialogOpen(true);
                  }}
                  onAddChild={(parent) => {
                    setEditingPermission(null);
                    setParentCode(parent.code);
                    setFormOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <PermissionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        permission={editingPermission}
        appCode={application.code}
        parentCode={parentCode}
        availableParents={availableParents}
        onSubmit={handleSubmit}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa permission này?
              {deletingPermission && (
                <div className="mt-3 p-3 bg-gray-100 rounded-md">
                  <p className="font-medium">{deletingPermission.name}</p>
                  <p className="text-sm font-mono text-gray-600">{deletingPermission.code}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PermissionsManagementPage;
