/**
 * Add Tenant App Route Page
 * Create a new route configuration for a tenant
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Route } from 'lucide-react';
import { tenantAppRoutesApi, CreateRouteRequest } from '@/api/tenantAppRoutesApi';
import { EnhancedTenantAppRouteForm } from '@/components/tenant-app-routes/EnhancedTenantAppRouteForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function AddTenantAppRoutePage() {
  const navigate = useNavigate();
  // We expect tenantId to be part of the URL, e.g. /tenants/:tenantId/routes/new
  // or pass it via context. Assuming URL param for now.
  // If not in URL, we might need to select a tenant, but routes are usually created contextually.
  // Let's assume the route is /core/tenants/:tenantId/routes/add
  const { tenantId } = useParams<{ tenantId: string }>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateRouteRequest | any) => {
    if (!tenantId) {
      showToast.error('Lỗi', 'Không tìm thấy ID của Tenant');
      return;
    }
    
    setLoading(true);
    try {
      await tenantAppRoutesApi.create({
        ...data,
        tenant_id: tenantId,
      });
      showToast.success('Thành công', 'Đã tạo route mới');
      navigate(`/core/tenants/${tenantId}/routes`);
    } catch (error: any) {
      console.error('Error creating route:', error);
      showToast.error('Lỗi', 'Không thể tạo route: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: Tenant ID is missing in the URL.
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Route Mới"
      description="Cấu hình tên miền và đường dẫn truy cập cho Tenant"
      icon={Route}
      backPath={`/core/tenants/${tenantId}/routes`}
      backLabel="Quay lại danh sách"
    >
      <EnhancedTenantAppRouteForm 
        tenantId={tenantId}
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => navigate(`/core/tenants/${tenantId}/routes`)}
      />
    </FormPageLayout>
  );
}
