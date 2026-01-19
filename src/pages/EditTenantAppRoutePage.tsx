/**
 * Edit Tenant App Route Page
 * Edit an existing route configuration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Route } from 'lucide-react';
import { tenantAppRoutesApi, TenantAppRoute } from '@/api/tenantAppRoutesApi';
import { EnhancedTenantAppRouteForm } from '@/components/tenant-app-routes/EnhancedTenantAppRouteForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function EditTenantAppRoutePage() {
  const navigate = useNavigate();
  // Route structure: /core/tenants/:tenantId/routes/:id/edit
  const { tenantId, id } = useParams<{ tenantId: string; id: string }>();
  
  const [route, setRoute] = useState<TenantAppRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRoute = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await tenantAppRoutesApi.getById(id);
        if (data) {
          setRoute(data);
        } else {
          showToast.error('Lỗi', 'Không tìm thấy thông tin Route');
          navigate(`/core/tenants/${tenantId}/routes`);
        }
      } catch (error: any) {
        console.error('Error fetching route:', error);
        showToast.error('Lỗi', 'Không thể tải thông tin Route: ' + error.message);
        navigate(`/core/tenants/${tenantId}/routes`);
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [id, tenantId, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await tenantAppRoutesApi.update(id, data);
      showToast.success('Thành công', 'Đã cập nhật cấu hình Route');
      navigate(`/core/tenants/${tenantId}/routes`);
    } catch (error: any) {
      console.error('Error updating route:', error);
      showToast.error('Lỗi', 'Không thể cập nhật Route: ' + error.message);
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

  if (!route || !tenantId) return null;

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Route"
      description={`Cấu hình cho ${route.domain || 'Route'} (${route.path_prefix})`}
      icon={Route}
      backPath={`/core/tenants/${tenantId}/routes`}
      backLabel="Quay lại danh sách"
    >
      <EnhancedTenantAppRouteForm 
        initialData={route}
        tenantId={tenantId}
        isEdit={true}
        onSubmit={handleSubmit} 
        loading={saving}
        onCancel={() => navigate(`/core/tenants/${tenantId}/routes`)}
      />
    </FormPageLayout>
  );
}
