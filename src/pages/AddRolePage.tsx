/**
 * Add Role Page
 * ✅ IMPLEMENTED 2026-01-15: Full role creation with FormPageLayout
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Shield } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { RoleForm } from '../components/roles/RoleForm';
import { rolesApi, CreateRoleRequest } from '../api/rolesApi';
import { toast } from 'sonner@2.0.3';

export default function AddRolePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant_id');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateRoleRequest) => {
    try {
      setIsLoading(true);
      const created = await rolesApi.create(data);
      toast.success(`Đã tạo vai trò: ${created.name}`);
      navigate('/core/roles');
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error('Không thể tạo vai trò: ' + error.message);
      throw error; // Re-throw to let form handle it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo vai trò mới"
      description="Tạo vai trò với các quyền hạn cụ thể"
      icon={Shield}
      backPath="/core/roles"
      backLabel="Quay lại danh sách"
    >
      <RoleForm
        tenantId={tenantId}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/roles')}
        isLoading={isLoading}
      />
    </FormPageLayout>
  );
}