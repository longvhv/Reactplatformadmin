/**
 * EditTenantPage
 * Wrapper for editing existing tenant
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useParams, useNavigate } from 'react-router';
import { Building2, RefreshCw } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { EnhancedTenantForm } from '@/components/tenants/EnhancedTenantForm';
import { useTenants } from '@/hooks/useTenants';
import { toast } from 'sonner@2.0.3';

export default function EditTenantPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenants, updateTenant, loading } = useTenants({ autoLoad: true });

  const tenant = tenants.find(t => t._id === id);

  const handleSubmit = async (data: any) => {
    try {
      await updateTenant(id!, data);
      toast.success('Cập nhật tenant thành công!');
      navigate('/core/tenants');
    } catch (error: any) {
      toast.error('Không thể cập nhật tenant: ' + error.message);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải tenant...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Không tìm thấy tenant</p>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Tenant"
      description={`Cập nhật thông tin cho ${tenant.name}`}
      icon={Building2}
      backPath="/core/tenants"
      backLabel="Quay lại danh sách"
    >
      <EnhancedTenantForm
        tenant={tenant}
        tenants={tenants}
        onSubmit={handleSubmit}
        isEdit={true}
      />
    </FormPageLayout>
  );
}