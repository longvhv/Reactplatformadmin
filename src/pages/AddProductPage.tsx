/**
 * Add Product Page
 * ✅ FIXED 2026-01-15: Using productsApi (correct schema)
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { productsApi, CreateProductRequest } from '../api/productsApi';
import { ProductForm } from '../components/products/ProductForm';
import { toast } from 'sonner@2.0.3';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function AddProductPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateProductRequest) => {
    try {
      await productsApi.create(data);

      toast.success('Đã tạo sản phẩm mới');
      navigate('/core/products');
    } catch (error: any) {
      toast.error('Không thể tạo sản phẩm: ' + error.message);
      throw error;
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm sản phẩm mới"
      description="Tạo sản phẩm SaaS mới với tất cả thông tin cần thiết"
      icon={Package}
      backPath="/core/products"
      backLabel="Quay lại danh sách"
    >
      <ProductForm
        tenantId={DEMO_TENANT_ID}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/products')}
      />
    </FormPageLayout>
  );
}