/**
 * Add Product Page
 * ✅ FIXED 2026-01-15: Using productsApi (correct schema)
 * ✅ FIXED 2026-01-17: Updated paths to Vietnamese structure
 * ✅ FIXED 2026-01-18: Enhanced UI with EnhancedProductForm
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { productsApi, CreateProductRequest } from '../api/productsApi';
import { EnhancedProductForm } from '../components/products/EnhancedProductForm';
import { showToast } from '@/lib/toast';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function AddProductPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      await productsApi.create(data as CreateProductRequest);
      showToast.success('Thành công', 'Đã tạo sản phẩm mới');
      navigate('/commerce/products');
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể tạo sản phẩm: ' + error.message);
      // Do not rethrow, let the form handle loading state stop
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
        onCancel={() => navigate('/commerce/products')}
      />
    </FormPageLayout>
  );
}
