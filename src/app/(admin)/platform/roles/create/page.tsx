import React, { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { EnhancedRoleForm } from '../../../../../components/roles/EnhancedRoleForm';
import { rolesApi, CreateRoleRequest } from '../../../../../api/rolesApi';
import { showToast } from '../../../../../lib/toast';
import { getCurrentTenant } from '../../../../../lib/currentTenant';

export default function CreateRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<CreateRoleRequest>>({});

  React.useEffect(() => {
    const loadTenant = async () => {
      const tenant = await getCurrentTenant();
      if (tenant) {
        setInitialData({ tenant_id: tenant._id });
      }
    };
    loadTenant();
  }, []);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await rolesApi.create(data as CreateRoleRequest);
      showToast.success('Thành công', 'Đã tạo vai trò mới');
      router.push('/platform/roles');
    } catch (error: any) {
      console.error('Failed to create role:', error);
      showToast.error('Lỗi', error.message || 'Không thể tạo vai trò');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Shield}
      title="Tạo Vai Trò Mới"
      description="Thiết lập vai trò và phân quyền truy cập"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/roles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <EnhancedRoleForm
          initialData={initialData as any}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/roles')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}