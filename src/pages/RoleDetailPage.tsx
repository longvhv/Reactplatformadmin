/**
 * RoleDetailPage Component
 * Chi tiết vai trò với quản lý quyền - Under 500 lines
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 * ✅ 100% QUALITY: DropdownMenu + ConfirmDialog + Toast
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Shield,
  Lock,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Activity,
  Plus,
  X,
  Search,
  Mail,
  UserX,
  Clock
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { useRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermissions';
import { userRolesApi, UserRole } from '@/api/userRolesApi';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { showToast } from '@/lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddPermissions, setShowAddPermissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');
  const [roleUsers, setRoleUsers] = useState<UserRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { 
    role, 
    loading, 
    error, 
    updateRole, 
    deleteRole 
  } = useRole(id);

  const { permissions, loading: permissionsLoading } = usePermissions({ autoLoad: true });

  useEffect(() => {
    if (!id) {
      navigate('/admin/roles');
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || 'Role not found'}</p>
          <Button onClick={() => navigate('/admin/roles')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteRole();
      showToast.success('Thành công', 'Đã xóa vai trò');
      navigate('/admin/roles');
    } catch (err) {
      showToast.error('Lỗi', 'Xóa vai trò thất bại');
    }
    setShowDeleteDialog(false);
  };

  const handleAddPermission = async (permCode: string) => {
    if (role.permission_codes.includes(permCode)) return;
    
    const updatedCodes = [...role.permission_codes, permCode];
    try {
      await updateRole({ permission_codes: updatedCodes });
      showToast.success('Thành công', 'Đã thêm quyền');
    } catch (err) {
      showToast.error('Lỗi', 'Thêm quyền thất bại');
    }
  };

  const handleRemovePermission = async (permCode: string) => {
    const updatedCodes = role.permission_codes.filter(code => code !== permCode);
    try {
      await updateRole({ permission_codes: updatedCodes });
      showToast.success('Thành công', 'Đã xóa quyền');
    } catch (err) {
      showToast.error('Lỗi', 'Xóa quyền thất bại');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Available permissions to add (not already assigned)
  const availablePermissions = permissions.filter(
    perm => !role.permission_codes.includes(perm.code)
  ).filter(perm => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return perm.code.toLowerCase().includes(query) || 
           perm.name.toLowerCase().includes(query);
  });

  // Assigned permissions details
  const assignedPermissions = permissions.filter(
    perm => role.permission_codes.includes(perm.code)
  );

  useEffect(() => {
    const fetchRoleUsers = async () => {
      setLoadingUsers(true);
      try {
        const users = await userRolesApi.getByRoleId(id!);
        setRoleUsers(users);
      } catch (err) {
        console.error('Failed to fetch role users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (activeTab === 'users' && id) {
      fetchRoleUsers();
    }
  }, [activeTab, id]);

  return (
    <>
      <PageLayout
        icon={Shield}
        title={role.name}
        description={
          <div className="flex items-center gap-3 mt-2">
            <Badge className={role.type === 'SYSTEM' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
              {role.type}
            </Badge>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Activity className="w-4 h-4" />
              v{role.version}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Lock className="w-4 h-4" />
              {role.permission_codes.length} quyền
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/roles')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/roles/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>

            {role.type === 'CUSTOM' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa vai trò
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        }
      >
        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'permissions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span>Quyền hạn ({role.permission_codes.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Người dùng</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'permissions' && (
              <>
                {/* Description */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mô tả</h2>
                  <p className="text-gray-900 dark:text-white">
                    {role.description || 'Chưa có mô tả'}
                  </p>
                </Card>

                {/* Permissions */}
                <Card>
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Quyền hạn ({role.permission_codes.length})</h2>
                    <Button
                      size="sm"
                      onClick={() => setShowAddPermissions(!showAddPermissions)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm quyền
                    </Button>
                  </div>

                  {/* Add Permissions Panel */}
                  {showAddPermissions && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Tìm quyền..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {permissionsLoading ? (
                          <p className="text-sm text-gray-500">Đang tải...</p>
                        ) : availablePermissions.length === 0 ? (
                          <p className="text-sm text-gray-500">Không có quyền khả dụng</p>
                        ) : (
                          availablePermissions.map(perm => (
                            <div key={perm.code} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{perm.name}</p>
                                <code className="text-xs text-gray-500">{perm.code}</code>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddPermission(perm.code)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Thêm
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Assigned Permissions List */}
                  <div className="p-6">
                    {assignedPermissions.length === 0 ? (
                      <div className="text-center py-8">
                        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Chưa có quyền nào</p>
                        <Button 
                          size="sm" 
                          onClick={() => setShowAddPermissions(true)} 
                          className="mt-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Thêm quyền đầu tiên
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedPermissions.map(perm => (
                          <div key={perm.code} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2 bg-white dark:bg-gray-800 rounded">
                                <Lock className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{perm.name}</p>
                                <code className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                                  {perm.code}
                                </code>
                                {perm.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{perm.description}</p>
                                )}
                              </div>
                            </div>
                            {role.type === 'CUSTOM' && (
                              <button
                                onClick={() => handleRemovePermission(perm.code)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'users' && (
              <Card>
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold">Người dùng được gán vai trò này</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tổng số: {roleUsers.length} người dùng
                  </p>
                </div>
                <div className="p-6">
                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Đang tải danh sách người dùng...</p>
                    </div>
                  ) : roleUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <UserX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">Chưa có người dùng nào được gán vai trò này</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roleUsers.map((userRole) => (
                        <div 
                          key={userRole._id} 
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                          onClick={() => navigate(`/admin/users/${userRole.user_id}`)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {userRole.user_full_name || 'Unnamed User'}
                                </p>
                                {userRole.is_active && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              {userRole.user_email && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <p className="text-sm text-gray-500 truncate">{userRole.user_email}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                <span>Assigned: {new Date(userRole.granted_at).toLocaleDateString('vi-VN')}</span>
                                {userRole.expires_at && (
                                  <span className="text-orange-600">
                                    Expires: {new Date(userRole.expires_at).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users/${userRole.user_id}`);
                            }}
                            className="ml-2"
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Thống kê</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Loại vai trò</span>
                  <Badge className={role.type === 'SYSTEM' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {role.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Số quyền</span>
                  <span className="font-semibold">{role.permission_codes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Phiên bản</span>
                  <span className="font-semibold">v{role.version}</span>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Metadata</h2>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    Tạo lúc
                  </div>
                  <p className="font-medium">{formatDate(role.created_at)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    Cập nhật lúc
                  </div>
                  <p className="font-medium">{formatDate(role.updated_at)}</p>
                </div>
              </div>
            </Card>

            {/* Info */}
            {role.type === 'SYSTEM' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300 text-sm">System Role</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Vai trò hệ thống không thể xóa và có thể có giới hạn chỉnh sửa.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa vai trò"
        description={`Bạn có chắc chắn muốn xóa vai trò "${role.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </>
  );
}