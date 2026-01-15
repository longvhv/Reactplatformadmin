/**
 * Tenant Roles Tab
 * Manage roles for a specific tenant
 */

import React, { useState } from 'react';
import { useRoles } from '../../hooks/useRoles';
import { Role } from '../../api/rolesApi';
import { RolesList } from '../roles/RolesList';
import { RoleFormDialog } from '../roles/RoleFormDialog';
import { RoleDetailTabs } from '../roles/RoleDetailTabs';
import { toast } from 'sonner@2.0.3';

interface TenantRolesTabProps {
  tenantId: string;
}

export function TenantRolesTab({ tenantId }: TenantRolesTabProps) {
  const { roles, loading, createRole, updateRole, deleteRole, refresh } =
    useRoles({ tenant_id: tenantId });

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  const handleAdd = () => {
    setEditingRole(null);
    setShowFormDialog(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowFormDialog(true);
  };

  const handleView = (role: Role) => {
    setViewingRole(role);
    setShowDetailDialog(true);
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vai trò này?')) return;

    try {
      await deleteRole(roleId);
      toast.success('Đã xóa vai trò');
    } catch (error: any) {
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingRole) {
        await updateRole(editingRole._id, data);
        toast.success('Đã cập nhật vai trò');
      } else {
        await createRole(data);
        toast.success('Đã tạo vai trò mới');
      }
      setShowFormDialog(false);
      setEditingRole(null);
    } catch (error: any) {
      throw error; // Let form handle error display
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Vai trò Tenant</strong> - Quản lý các vai trò dành riêng cho tenant này.
        </p>
      </div>

      <RolesList
        roles={roles}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onRefresh={refresh}
        showTenantColumn={false}
      />

      {/* Form Dialog */}
      {showFormDialog && (
        <RoleFormDialog
          role={editingRole}
          tenantId={tenantId}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowFormDialog(false);
            setEditingRole(null);
          }}
        />
      )}

      {/* Detail Dialog */}
      {showDetailDialog && viewingRole && (
        <RoleDetailTabs
          role={viewingRole}
          onEdit={() => {
            setShowDetailDialog(false);
            handleEdit(viewingRole);
          }}
          onClose={() => {
            setShowDetailDialog(false);
            setViewingRole(null);
          }}
        />
      )}
    </div>
  );
}

export default TenantRolesTab;