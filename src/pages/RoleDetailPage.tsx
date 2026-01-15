/**
 * RoleDetailPage Component
 * Chi tiết vai trò với quản lý quyền - Under 500 lines
 * 
 * ✅ FIXED 2026-01-14:
 * - Fix getUsersByRole → getByRoleId
 * - Fix assigned_at → granted_at
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Check,
  Search,
  Mail,
  UserX
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermissions';
import { userRolesApi, UserRole } from '@/api/userRolesApi';

export default function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [showActions, setShowActions] = useState(false);
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
      navigate('/core/roles');
    }
  }, [id, navigate]);

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

  if (error || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error || 'Role not found'}</p>
          <Button onClick={() => navigate('/core/roles')} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xóa vai trò "${role.name}"?`)) return;
    try {
      await deleteRole();
      navigate('/core/roles');
    } catch (err) {
      alert('Xóa vai trò thất bại');
    }
  };

  const handleAddPermission = async (permCode: string) => {
    if (role.permission_codes.includes(permCode)) return;
    
    const updatedCodes = [...role.permission_codes, permCode];
    try {
      await updateRole({ permission_codes: updatedCodes });
    } catch (err) {
      alert('Failed to add permission');
    }
  };

  const handleRemovePermission = async (permCode: string) => {
    const updatedCodes = role.permission_codes.filter(code => code !== permCode);
    try {
      await updateRole({ permission_codes: updatedCodes });
    } catch (err) {
      alert('Failed to remove permission');
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
        // ✅ FIXED: getUsersByRole → getByRoleId
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/core/roles')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>

              <div className="flex items-center gap-4">
                <div className={`
                  w-16 h-16 rounded-lg flex items-center justify-center
                  ${role.type === 'SYSTEM' ? 'bg-blue-100' : 'bg-green-100'}
                `}>
                  <Shield className={`
                    w-8 h-8
                    ${role.type === 'SYSTEM' ? 'text-blue-600' : 'text-green-600'}
                  `} />
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {role.name}
                    </h1>
                    <span className={`
                      px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${role.type === 'SYSTEM' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                      }
                    `}>
                      {role.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      v{role.version}
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      {role.permission_codes.length} quyền
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/core/roles/edit/${id}`)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                    <div className="py-1">
                      {role.type === 'CUSTOM' && (
                        <button
                          onClick={handleDelete}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa vai trò
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'permissions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className="lg:col-span-2 space-y-6">{activeTab === 'permissions' && (
              <>
                {/* Description */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Mô tả</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-900">
                      {role.description || 'Chưa có mô tả'}
                    </p>
                  </div>
                </div>

                {/* Permissions */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Quyền hạn ({role.permission_codes.length})</h2>
                    <Button
                      size="sm"
                      onClick={() => setShowAddPermissions(!showAddPermissions)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm quyền
                    </Button>
                  </div>

                  {/* Add Permissions Panel */}
                  {showAddPermissions && (
                    <div className="px-6 py-4 bg-gray-50 border-b">
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
                            <div key={perm.code} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                                <code className="text-xs text-gray-500">{perm.code}</code>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddPermission(perm.code)}
                                className="gap-1"
                              >
                                <Plus className="w-3 h-3" />
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
                          className="mt-4 gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Thêm quyền đầu tiên
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedPermissions.map(perm => (
                          <div key={perm.code} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2 bg-white rounded">
                                <Lock className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{perm.name}</p>
                                <code className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                                  {perm.code}
                                </code>
                                {perm.description && (
                                  <p className="text-sm text-gray-600 mt-1">{perm.description}</p>
                                )}
                              </div>
                            </div>
                            {role.type === 'CUSTOM' && (
                              <button
                                onClick={() => handleRemovePermission(perm.code)}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {activeTab === 'users' && (
              <>
                {/* Users List */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Người dùng được gán vai trò này</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Tổng số: {roleUsers.length} người dùng
                    </p>
                  </div>
                  <div className="p-6">
                    {loadingUsers ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
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
                            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            onClick={() => navigate(`/core/users/${userRole.user_id}`)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 truncate">
                                    {userRole.user_full_name || 'Unnamed User'}
                                  </p>
                                  {userRole.is_active && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                      Active
                                    </span>
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
                                navigate(`/core/users/${userRole.user_id}`);
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
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Thống kê</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Loại vai trò</span>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${role.type === 'SYSTEM' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                    }
                  `}>
                    {role.type}
                  </span>
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
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Metadata</h2>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Tạo lúc</p>
                  <p className="font-medium">{formatDate(role.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Cập nhật lúc</p>
                  <p className="font-medium">{formatDate(role.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Info */}
            {role.type === 'SYSTEM' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">System Role</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Vai trò hệ thống không thể xóa và có thể có giới hạn chỉnh sửa.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}