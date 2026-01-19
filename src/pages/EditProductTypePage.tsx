/**
 * Edit Product Type Page
 * ✅ CREATED 2026-01-15: Full product type editing with FormPageLayout
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { ProductTypeForm } from '../components/product-types/ProductTypeForm';
import { productTypesApi, UpdateProductTypeRequest } from '../api/productTypesApi';
import { useProductType } from '../hooks/useProductType';
import { toast } from 'sonner@2.0.3';

export default function EditProductTypePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { productType, loading, error } = useProductType(id);

  const handleSubmit = async (data: UpdateProductTypeRequest) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const updated = await productTypesApi.update(id, data);
      toast.success(`Đã cập nhật loại sản phẩm: ${updated.name}`);
      navigate('/commerce/product-types');
    } catch (error: any) {
      console.error('Error updating product type:', error);
      toast.error('Không thể cập nhật loại sản phẩm: ' + error.message);
      throw error; // Re-throw to let form handle it
    } finally {
      setIsLoading(false);
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

  if (error || !productType) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Không tìm thấy loại sản phẩm</p>
          <button
            onClick={() => navigate('/commerce/product-types')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Sửa Loại Sản Phẩm"
      description={`Cập nhật: ${productType.name}`}
      icon={Package}
      backPath="/commerce/product-types"
      backLabel="Quay lại danh sách"
    >
      <ProductTypeForm
        productType={productType}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/commerce/product-types')}
        isLoading={isLoading}
      />
    </FormPageLayout>
  );
}