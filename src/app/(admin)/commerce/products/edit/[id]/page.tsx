/**
 * Edit Product Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import React from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Package } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { productsApi, UpdateProductRequest } from '@/api/productsApi';
import { EnhancedProductForm } from '@/components/products/EnhancedProductForm';
import { showToast } from '@/lib/toast';
import { useProduct } from '@/hooks/useProduct';

function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const { product, loading } = useProduct(id);

  const handleSubmit = async (data: any) => {
    try {
      await productsApi.update(id, data as UpdateProductRequest);
      showToast.success('Thành công', 'Đã cập nhật sản phẩm');
      router.push('/commerce/products');
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể cập nhật: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa sản phẩm"
      description="Cập nhật thông tin sản phẩm"
      icon={Package}
      backPath="/commerce/products"
      backLabel="Quay lại danh sách"
    >
      <EnhancedProductForm
        initialData={product}
        tenantId={product?.tenant_id}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/commerce/products')}
      />
    </FormPageLayout>
  );
}

export { EditProductPage };
export default EditProductPage;
