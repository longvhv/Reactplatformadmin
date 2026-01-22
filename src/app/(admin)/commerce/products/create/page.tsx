/**
 * Add Product Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ Enhanced UI with EnhancedProductForm
 */

'use client';

import React from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Package } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { saasProductsApi, CreateSaasProductRequest } from '@/api/saasProductsApi';
import { EnhancedProductForm } from '@/components/products/EnhancedProductForm';
import { showToast } from '@/lib/toast';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

function AddProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      await saasProductsApi.create(data as CreateSaasProductRequest);
      showToast.success('Thành công', 'Đã tạo sản phẩm mới');
      router.push('/commerce/products');
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể tạo sản phẩm: ' + error.message);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm sản phẩm mới"
      description="Tạo sản phẩm SaaS mới với đầy đủ thông tin định giá và tính năng"
      icon={Package}
      backPath="/commerce/products"
      backLabel="Quay lại danh sách"
    >
      <EnhancedProductForm
        tenantId={DEMO_TENANT_ID}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/commerce/products')}
      />
    </FormPageLayout>
  );
}

export { AddProductPage };
export default AddProductPage;
