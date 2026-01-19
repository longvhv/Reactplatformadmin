/**
 * Edit Tenant Digital Asset Page
 * Edit an existing digital asset
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Database } from 'lucide-react';
import { digitalAssetsApi, TenantDigitalAsset } from '@/api/digitalAssetsApi';
import { EnhancedTenantDigitalAssetForm } from '@/components/digital-assets/EnhancedTenantDigitalAssetForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function EditTenantDigitalAssetPage() {
  const navigate = useNavigate();
  // Route structure: /core/tenants/:tenantId/digital-assets/:id/edit
  const { tenantId, id } = useParams<{ tenantId: string; id: string }>();
  
  const [asset, setAsset] = useState<TenantDigitalAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAsset = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await digitalAssetsApi.getById(id);
        if (data) {
          setAsset(data);
        } else {
          showToast.error('Lỗi', 'Không tìm thấy tài sản số');
          navigate(`/core/tenants/${tenantId}/digital-assets`);
        }
      } catch (error: any) {
        console.error('Error fetching digital asset:', error);
        showToast.error('Lỗi', 'Không thể tải thông tin tài sản: ' + error.message);
        navigate(`/core/tenants/${tenantId}/digital-assets`);
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [id, tenantId, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await digitalAssetsApi.update(id, data);
      showToast.success('Thành công', 'Đã cập nhật tài sản số');
      navigate(`/core/tenants/${tenantId}/digital-assets`);
    } catch (error: any) {
      console.error('Error updating digital asset:', error);
      showToast.error('Lỗi', 'Không thể cập nhật tài sản: ' + error.message);
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

  if (!asset || !tenantId) return null;

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Tài Sản Số"
      description={`Cập nhật thông tin cho ${asset.name}`}
      icon={Database}
      backPath={`/core/tenants/${tenantId}/digital-assets`}
      backLabel="Quay lại danh sách"
    >
      <EnhancedTenantDigitalAssetForm 
        initialData={asset}
        tenantId={tenantId}
        isEdit={true}
        onSubmit={handleSubmit} 
        loading={saving}
        onCancel={() => navigate(`/core/tenants/${tenantId}/digital-assets`)}
      />
    </FormPageLayout>
  );
}
