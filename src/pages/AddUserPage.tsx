/**
 * Add User Page
 * Full-featured user creation form
 * ✅ Updated to use EnhancedUserForm with proper validation
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus } from 'lucide-react';
import { usersApi, CreateUserRequest } from '@/api/usersApi';
import { EnhancedUserForm } from '@/components/users/EnhancedUserForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function AddUserPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateUserRequest | any) => {
    setLoading(true);
    try {
      // Check if email exists first (optional but good UX)
      const exists = await usersApi.emailExists(data.email);
      if (exists) {
        showToast.error('Lỗi', 'Email này đã tồn tại trong hệ thống');
        setLoading(false);
        return;
      }

      await usersApi.create(data);
      showToast.success('Thành công', 'Đã tạo người dùng mới');
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast.error('Lỗi', 'Không thể tạo người dùng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Người Dùng"
      description="Tạo tài khoản người dùng mới trong hệ thống"
      icon={UserPlus}
      backPath="/admin/users"
      backLabel="Danh sách người dùng"
    >
      <EnhancedUserForm 
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => navigate('/admin/users')}
      />
    </FormPageLayout>
  );
}
