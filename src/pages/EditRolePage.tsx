/**
 * Edit Role Page
 * Edit existing role
 * ✅ Updated to use EnhancedRoleForm
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Shield } from 'lucide-react';
import { rolesApi, Role } from '@/api/rolesApi';
import { EnhancedRoleForm } from '@/components/roles/EnhancedRoleForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function EditRolePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await rolesApi.getById(id);
        if (data) {
          setRole(data);
        } else {
          showToast.error('Lỗi', 'Không tìm thấy vai trò');
          navigate('/admin/roles');
        }
      } catch (error: any) {
        console.error('Error fetching role:', error);
        showToast.error('Lỗi', 'Không thể tải vai trò: ' + error.message);
        navigate('/admin/roles');
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await rolesApi.update(id, data);
      showToast.success('Thành công', 'Đã cập nhật vai trò');
      navigate('/admin/roles');
    } catch (error: any) {
      console.error('Error updating role:', error);
      showToast.error('Lỗi', 'Không thể cập nhật vai trò: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!role) return null;

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Vai Trò"
      description={`Cập nhật thông tin vai trò ${role.name}`}
      icon={Shield}
      backPath="/admin/roles"
      backLabel="Danh sách vai trò"
    >
      <EnhancedRoleForm 
        initialData={role}
        isEdit={true}
        onSubmit={handleSubmit} 
        loading={saving}
        onCancel={() => navigate('/admin/roles')}
      />
    </FormPageLayout>
  );
}
