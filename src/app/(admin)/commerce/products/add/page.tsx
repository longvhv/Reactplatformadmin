/**
 * Add Product Page
 * Page for creating a new SaaS product
 * ✅ CREATED: 2026-01-21
 */
'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { Package } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { EnhancedProductForm } from '@/components/products/EnhancedProductForm';
import { saasProductsApi, CreateSaasProductRequest } from '@/api/saasProductsApi';
import { showToast } from '@/lib/toast';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // In a real app, tenantId should come from auth context or URL
  // For now, hardcoding or getting from auth if available
  const { user } = useAuth();
  const tenantId = user?.tenant_id || 'default-tenant-id'; 

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await saasProductsApi.create(data as CreateSaasProductRequest);
      showToast.success('Thành công', 'Đã tạo sản phẩm mới');
      router.push('/commerce/products');
    } catch (error: any) {
      console.error('Create product error:', error);
      showToast.error('Lỗi', error.message || 'Không thể tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/commerce/products');
  };

  return (
    <PageLayout
      icon={Package}
      title="Thêm sản phẩm mới"
      description="Tạo mới một gói sản phẩm hoặc dịch vụ SaaS"
      backButton={{
        label: 'Quay lại danh sách',
        onClick: handleCancel,
      }}
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <EnhancedProductForm
          tenantId={tenantId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}

export default AddProductPage;
