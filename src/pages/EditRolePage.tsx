/**
 * Edit Role Page
 * ✅ IMPLEMENTED 2026-01-15: Full role editing with FormPageLayout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { RoleForm } from '../components/roles/RoleForm';
import { rolesApi, Role, UpdateRoleRequest } from '../api/rolesApi';
import { toast } from 'sonner@2.0.3';

export default function EditRolePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadRole();
    }
  }, [id]);

  const loadRole = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getById(id!);
      setRole(data);
    } catch (error: any) {
      console.error('Error loading role:', error);
      toast.error('Không thể tải thông tin vai trò: ' + error.message);
      navigate('/core/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateRoleRequest) => {
    if (!role) return;

    try {
      setIsSubmitting(true);
      const updated = await rolesApi.update(role._id, data);
      toast.success(`Đã cập nhật vai trò: ${updated.name}`);
      navigate('/core/roles');
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Không thể cập nhật vai trò: ' + error.message);
      throw error; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải vai trò...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Không tìm thấy vai trò</p>
          <Button onClick={() => navigate('/core/roles')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa vai trò"
      description={`${role.name} (${role.type})`}
      icon={Shield}
      backPath="/core/roles"
      backLabel="Quay lại danh sách"
      banner={
        role.type === 'SYSTEM'
          ? {
              type: 'warning',
              icon: AlertTriangle,
              title: 'System Role',
              message: 'Đây là vai trò hệ thống. Chỉ có thể chỉnh sửa permissions, không thể xóa.',
            }
          : undefined
      }
    >
      <RoleForm
        role={role}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/roles')}
        isLoading={isSubmitting}
      />
    </FormPageLayout>
  );
}