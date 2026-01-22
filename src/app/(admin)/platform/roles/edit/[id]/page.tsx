import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { EnhancedRoleForm } from '../../../../../components/roles/EnhancedRoleForm';
import { rolesApi, Role, UpdateRoleRequest } from '../../../../../api/rolesApi';
import { showToast } from '../../../../../lib/toast';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const data = await rolesApi.getById(id);
        setRole(data);
      } catch (error: any) {
        console.error('Failed to fetch role:', error);
        showToast.error('Lỗi', 'Không thể tải thông tin vai trò');
        router.push('/platform/roles');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchRole();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await rolesApi.update(id, data as UpdateRoleRequest);
      showToast.success('Thành công', 'Đã cập nhật vai trò');
      router.push('/platform/roles');
    } catch (error: any) {
      console.error('Failed to update role:', error);
      showToast.error('Lỗi', error.message || 'Không thể cập nhật vai trò');
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

  if (!role) return null;

  return (
    <PageLayout
      icon={Shield}
      title="Chỉnh Sửa Vai Trò"
      description={`Cập nhật quyền hạn cho vai trò: ${role.name}`}
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/roles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <EnhancedRoleForm
          initialData={role}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/roles')}
          loading={loading}
          isEdit={true}
        />
      </div>
    </PageLayout>
  );
}