/**
 * Add Role Page
 * Create new role
 * ✅ Updated to use EnhancedRoleForm
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield } from 'lucide-react';
import { rolesApi, CreateRoleRequest } from '@/api/rolesApi';
import { EnhancedRoleForm } from '@/components/roles/EnhancedRoleForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function AddRolePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateRoleRequest | any) => {
    setLoading(true);
    try {
      await rolesApi.create(data);
      showToast.success('Thành công', 'Đã tạo vai trò mới');
      navigate('/admin/roles');
    } catch (error: any) {
      console.error('Error creating role:', error);
      showToast.error('Lỗi', 'Không thể tạo vai trò: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Vai Trò"
      description="Tạo vai trò mới và phân quyền"
      icon={Shield}
      backPath="/admin/roles"
      backLabel="Danh sách vai trò"
    >
      <EnhancedRoleForm 
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => navigate('/admin/roles')}
      />
    </FormPageLayout>
  );
}
