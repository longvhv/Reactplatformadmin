import React, { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { EnhancedUserForm } from '../../../../../components/users/EnhancedUserForm';
import { usersApi, CreateUserRequest, UpdateUserRequest } from '../../../../../api/usersApi';
import { showToast } from '../../../../../lib/toast';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
    setLoading(true);
    try {
      // Safe to cast as CreateUserRequest because the form is not in edit mode
      await usersApi.create(data as CreateUserRequest);
      showToast.success('Thành công', 'Đã tạo người dùng mới');
      router.push('/platform/users');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      showToast.error('Lỗi', error.message || 'Không thể tạo người dùng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Users}
      title="Thêm Người dùng"
      description="Tạo tài khoản người dùng mới vào hệ thống"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/users')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <EnhancedUserForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/users')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}