/**
 * AddUserPage Component
 * Full-featured user creation form
 * ✅ CREATED 2026-01-15: Unified design with FormPageLayout
 * 
 * Features:
 * - All fields from users schema
 * - Status management (ACTIVE, BANNED, DISABLED, PENDING)
 * - MFA toggle, Support staff toggle, Verification toggle
 * - Locale selection, Avatar URL, Phone number
 * - Real-time validation, Success/Error handling
 * - Password generation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus } from 'lucide-react';
import { userApi, CreateUserRequest } from '../api/userApi';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { UserForm } from '../components/users/UserForm';
import { toast } from 'sonner@2.0.3';

export default function AddUserPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    // Validation
    if (!data.full_name?.trim()) {
      toast.error('Họ và tên không được để trống');
      throw new Error('Missing full_name');
    }

    if (!data.email?.trim()) {
      toast.error('Email không được để trống');
      throw new Error('Missing email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error('Email không hợp lệ');
      throw new Error('Invalid email');
    }

    if (data.avatar_url && !data.avatar_url.match(/^https?:\/\//)) {
      toast.error('Avatar URL phải bắt đầu với http:// hoặc https://');
      throw new Error('Invalid avatar_url');
    }

    try {
      setLoading(true);

      // Create user request with generated password
      const createData: CreateUserRequest = {
        full_name: data.full_name,
        email: data.email,
        password_hash: generateTemporaryPassword(), // Generate temporary password
        phone_number: data.phone_number || undefined,
        avatar_url: data.avatar_url || undefined,
        status: data.status || 'PENDING',
        locale: data.locale || 'vi-VN',
        is_support_staff: data.is_support_staff || false,
        mfa_enabled: data.mfa_enabled || false,
        is_verified: data.is_verified || false,
      };

      const newUser = await userApi.create(createData);
      
      toast.success('✅ Tạo người dùng thành công!', {
        description: `Email: ${newUser.email}. Mật khẩu tạm thời đã được gửi qua email.`,
        duration: 6000,
      });
      
      navigate('/core/users');
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('❌ Không thể tạo người dùng: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/users');
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo người dùng mới"
      description="Thêm người dùng vào hệ thống"
      icon={UserPlus}
      backPath="/core/users"
      backLabel="Quay lại danh sách"
    >
      <UserForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </FormPageLayout>
  );
}

/**
 * Generate temporary password for new user
 * User will be required to change on first login
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
