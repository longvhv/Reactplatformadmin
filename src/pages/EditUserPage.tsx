/**
 * Edit User Page
 * Edit existing user profile
 * ✅ Updated to use EnhancedUserForm with proper validation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { UserCog } from 'lucide-react';
import { usersApi, User } from '@/api/usersApi';
import { EnhancedUserForm } from '@/components/users/EnhancedUserForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await usersApi.getById(id);
        if (data) {
          setUser(data);
        } else {
          showToast.error('Lỗi', 'Không tìm thấy người dùng');
          navigate('/admin/users');
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
        showToast.error('Lỗi', 'Không thể tải thông tin người dùng: ' + error.message);
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await usersApi.update(id, data);
      showToast.success('Thành công', 'Đã cập nhật thông tin người dùng');
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast.error('Lỗi', 'Không thể cập nhật người dùng: ' + error.message);
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

  if (!user) return null;

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Người Dùng"
      description={`Cập nhật thông tin cho ${user.full_name} (${user.email})`}
      icon={UserCog}
      backPath="/admin/users"
      backLabel="Danh sách người dùng"
    >
      <EnhancedUserForm 
        initialData={user}
        isEdit={true}
        onSubmit={handleSubmit} 
        loading={saving}
        onCancel={() => navigate('/admin/users')}
      />
    </FormPageLayout>
  );
}
