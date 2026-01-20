/**
 * Edit Role Page
 * Edit existing role
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Shield } from 'lucide-react';
import { rolesApi } from '@/api/rolesApi';
import { EnhancedRoleForm } from '@/components/roles/EnhancedRoleForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';
import { useRole } from '@/hooks/useRole';

function EditRolePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { role, loading: roleLoading } = useRole(id);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await rolesApi.update(id, data);
      showToast.success('Thành công', 'Đã cập nhật vai trò');
      router.push('/admin/roles');
    } catch (error: any) {
      console.error('Error updating role:', error);
      showToast.error('Lỗi', 'Không thể cập nhật: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh Sửa Vai Trò"
      description="Cập nhật thông tin và quyền hạn"
      icon={Shield}
      backPath="/admin/roles"
      backLabel="Danh sách vai trò"
    >
      <EnhancedRoleForm 
        initialData={role}
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => router.push('/admin/roles')}
      />
    </FormPageLayout>
  );
}

export { EditRolePage };
export default EditRolePage;
