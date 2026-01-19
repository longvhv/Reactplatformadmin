/**
 * Add Tenant Digital Asset Page
 * Create a new digital asset for a tenant
 * 
 * ✅ IMPROVED: Handles both tenant context (from params) and global context (via selection)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Database, Building2 } from 'lucide-react';
import { digitalAssetsApi, CreateAssetRequest } from '@/api/digitalAssetsApi';
import { EnhancedTenantDigitalAssetForm } from '@/components/digital-assets/EnhancedTenantDigitalAssetForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';
import { TenantCombobox } from '@/components/common/TenantCombobox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AddTenantDigitalAssetPage() {
  const navigate = useNavigate();
  // Route structure: /core/tenants/:tenantId/digital-assets/new OR /commerce/digital-assets/create
  const { tenantId } = useParams<{ tenantId: string }>();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(tenantId || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenantId) {
      setActiveTenantId(tenantId);
    }
  }, [tenantId]);

  const handleSubmit = async (data: CreateAssetRequest | any) => {
    if (!activeTenantId) {
      showToast.error('Lỗi', 'Không tìm thấy ID của Tenant');
      return;
    }
    
    setLoading(true);
    try {
      await digitalAssetsApi.create({
        ...data,
        tenant_id: activeTenantId,
      });
      showToast.success('Thành công', 'Đã tạo tài sản số mới');
      
      // If we are in tenant context, go back to tenant assets
      if (tenantId) {
        navigate(`/core/tenants/${tenantId}/digital-assets`);
      } else {
        // Global context
        navigate('/commerce/digital-assets');
      }
    } catch (error: any) {
      console.error('Error creating digital asset:', error);
      showToast.error('Lỗi', 'Không thể tạo tài sản số: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // State 1: Tenant selection needed
  if (!activeTenantId) {
    return (
      <FormPageLayout
        mode="add"
        title="Thêm Tài Sản Số"
        description="Chọn khách hàng để tạo tài sản số mới"
        icon={Database}
        backPath="/commerce/digital-assets"
        backLabel="Quay lại danh sách"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Chọn Khách Hàng (Tenant)
            </CardTitle>
            <CardDescription>
              Vui lòng chọn khách hàng sở hữu tài sản số này
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Khách hàng
              </label>
              <TenantCombobox 
                value={activeTenantId} 
                onValueChange={setActiveTenantId}
                placeholder="Tìm kiếm khách hàng..."
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => navigate('/commerce/digital-assets')}>
                Hủy bỏ
              </Button>
            </div>
          </CardContent>
        </Card>
      </FormPageLayout>
    );
  }

  // State 2: Form with selected tenant
  return (
    <FormPageLayout
      mode="add"
      title="Thêm Tài Sản Số"
      description="Quản lý tên miền, chứng chỉ SSL và các tài sản kỹ thuật số khác"
      icon={Database}
      backPath={tenantId ? `/core/tenants/${tenantId}/digital-assets` : '/commerce/digital-assets'}
      backLabel="Quay lại danh sách"
    >
      <EnhancedTenantDigitalAssetForm 
        tenantId={activeTenantId}
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => navigate(tenantId ? `/core/tenants/${tenantId}/digital-assets` : '/commerce/digital-assets')}
      />
    </FormPageLayout>
  );
}
