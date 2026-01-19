/**
 * Edit Product Page
 * ✅ FIXED 2026-01-15: Using productsApi (correct schema)
 * ✅ FIXED 2026-01-17: Updated paths to Vietnamese structure
 * ✅ FIXED 2026-01-18: Enhanced UI with EnhancedProductForm
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { productsApi, Product, UpdateProductRequest } from '../api/productsApi';
import { EnhancedProductForm } from '../components/products/EnhancedProductForm';
import { showToast } from '@/lib/toast';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getById(id!);
      setProduct(data);
    } catch (error: any) {
      console.error('Error loading product:', error);
      showToast.error('Lỗi', 'Không thể tải thông tin sản phẩm: ' + error.message);
      navigate('/commerce/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!product) return;

    try {
      await productsApi.update(product._id!, data as UpdateProductRequest);
      showToast.success('Thành công', 'Đã cập nhật sản phẩm');
      navigate('/commerce/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      showToast.error('Lỗi', 'Không thể cập nhật: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Không tìm thấy sản phẩm</p>
          <Button onClick={() => navigate('/commerce/products')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa sản phẩm"
      description={`${product.name} (${product.code})`}
      icon={Package}
      backPath="/commerce/products"
      backLabel="Quay lại danh sách"
    >
      <EnhancedProductForm
        product={product}
        tenantId={DEMO_TENANT_ID}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/commerce/products')}
      />
    </FormPageLayout>
  );
}
