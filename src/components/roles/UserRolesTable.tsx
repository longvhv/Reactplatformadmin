/**
 * UserRolesTable Component
 * Reusable component hiển thị user roles với CRUD
 * Dùng chung cho: User Detail, Tenant Detail
 */

import React, { useState } from 'react';
import { useUserRoles } from '../../hooks/useUserRoles';
import { UserRoleModal } from './UserRoleModal';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit,
  Globe,
  Building2,
  MapPin,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { UserRole, CreateUserRoleData } from '../../api/userRolesApi';

interface UserRolesTableProps {
  userId?: string;
  tenantId?: string;
  showUserColumn?: boolean; // Show user column in tenant detail
}

export function UserRolesTable({ userId, tenantId, showUserColumn = false }: UserRolesTableProps) {
  const { userRoles, loading, deleteUserRole, toggleActive, createUserRolesBulk, updateUserRole } =
    useUserRoles({
      user_id: userId,
      tenant_id: tenantId,
    });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get scope icon
  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global':
        return <Globe className="w-4 h-4" />;
      case 'tenant':
        return <Building2 className="w-4 h-4" />;
      case 'department':
        return <Users className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      default:
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

  // Get scope color
  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'global':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'tenant':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'department':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'location':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Check if expired
  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Handle add
  const handleAdd = () => {
    setEditingRole(undefined);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (role: UserRole) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa phân quyền này?')) return;

    setDeletingId(id);
    try {
      await deleteUserRole(id);
    } catch (err) {
      console.error('Error deleting user role:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleActive(id, !currentStatus);
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  // Handle submit
  const handleSubmit = async (data: CreateUserRoleData[]) => {
    if (editingRole) {
      // Update mode - only allow single update
      await updateUserRole(editingRole._id, {
        scope: data[0].scope,
        scope_id: data[0].scope_id,
        expires_at: data[0].expires_at,
        is_active: data[0].is_active,
      });
    } else {
      // Create mode - support bulk
      await createUserRolesBulk(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Phân quyền ({userRoles.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý vai trò và phạm vi phân quyền
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm phân quyền
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {showUserColumn && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Người dùng
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vai trò
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phạm vi
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ngày phân
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hết hạn
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {userRoles.map((userRole) => {
                const expired = isExpired(userRole.expires_at);
                return (
                  <tr key={userRole._id} className="hover:bg-gray-50 transition-colors">
                    {showUserColumn && (
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {userRole.user?.full_name || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-500">{userRole.user?.email}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {userRole.role?.name || 'Unknown'}
                        </span>
                        {userRole.role?.description && (
                          <span className="text-xs text-gray-500">
                            {userRole.role.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getScopeIcon(userRole.scope)}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getScopeColor(
                            userRole.scope
                          )}`}
                        >
                          {userRole.scope}
                        </span>
                        {userRole.scope === 'tenant' && userRole.tenant && (
                          <span className="text-xs text-gray-500">
                            ({userRole.tenant.name})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {userRole.is_active && !expired ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">Active</span>
                          </>
                        ) : expired ? (
                          <>
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-orange-700">Expired</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(userRole.granted_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {formatDate(userRole.expires_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(userRole._id, userRole.is_active)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title={userRole.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {userRole.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(userRole)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(userRole._id)}
                          disabled={deletingId === userRole._id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {userRoles.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Chưa có phân quyền nào</p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm phân quyền đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <UserRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editData={editingRole}
        fixedUserId={userId}
        fixedTenantId={tenantId}
      />
    </div>
  );
}

export default UserRolesTable;
