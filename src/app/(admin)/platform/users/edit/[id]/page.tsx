import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { EnhancedUserForm } from '@/components/users/EnhancedUserForm';
import { usersApi, User, CreateUserRequest, UpdateUserRequest } from '@/api/usersApi';
import { showToast } from '@/lib/toast';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await usersApi.getById(id);
        setUser(data);
      } catch (error: any) {
        console.error('Failed to fetch user:', error);
        showToast.error('Lỗi', 'Không thể tải thông tin người dùng');
        router.push('/platform/users');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, router]);

  const handleSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
    setLoading(true);
    try {
      // Safe to cast as UpdateUserRequest because form is in edit mode
      await usersApi.update(id, data as UpdateUserRequest);
      showToast.success('Thành công', 'Đã cập nhật thông tin người dùng');
      router.push('/platform/users');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      showToast.error('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <PageLayout
      icon={Users}
      title="Chỉnh sửa Người dùng"
      description={`Cập nhật thông tin tài khoản: ${user.full_name}`}
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/users')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <EnhancedUserForm
          initialData={user}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/users')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}