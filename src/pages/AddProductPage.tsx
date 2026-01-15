/**
 * Add Product Page
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { saasProductApi, SaaSProduct } from '../api/saasProductApi';
import { ProductForm } from '../components/products/ProductForm';
import { toast } from 'sonner@2.0.3';

export default function AddProductPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: Partial<SaaSProduct>) => {
    try {
      await saasProductApi.create({
        ...data,
        tenant_id: '00000000-0000-0000-0000-000000000001', // Demo tenant
      } as any);

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
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/products')}
      />
    </FormPageLayout>
  );
}