/**
 * Add Product Type Page
 * ✅ CREATED 2026-01-15: Full product type creation with FormPageLayout
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { ProductTypeForm } from '../components/product-types/ProductTypeForm';
import { productTypesApi, CreateProductTypeRequest } from '../api/productTypesApi';
import { toast } from 'sonner@2.0.3';

export default function AddProductTypePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateProductTypeRequest) => {
    try {
      setIsLoading(true);
      const created = await productTypesApi.create(data);
      toast.success(`Đã tạo loại sản phẩm: ${created.name}`);
      navigate('/core/product-types');
    } catch (error: any) {
      console.error('Error creating product type:', error);
      toast.error('Không thể tạo loại sản phẩm: ' + error.message);
      throw error; // Re-throw to let form handle it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo loại sản phẩm mới"
      description="Tạo loại sản phẩm mới trong hệ thống"
      icon={Package}
      backPath="/core/product-types"
      backLabel="Quay lại danh sách"
    >
      <ProductTypeForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/product-types')}
        isLoading={isLoading}
      />
    </FormPageLayout>
  );
}
