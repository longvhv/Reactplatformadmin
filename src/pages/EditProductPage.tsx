/**
 * Edit Product Page
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { saasProductApi, SaaSProduct } from '../api/saasProductApi';
import { ProductForm } from '../components/products/ProductForm';
import { toast } from 'sonner@2.0.3';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<SaaSProduct | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await saasProductApi.getById(id!);
      setProduct(data);
    } catch (error: any) {
      toast.error('Không thể tải thông tin sản phẩm: ' + error.message);
      navigate('/core/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<SaaSProduct>) => {
    if (!product) return;

    try {
      await saasProductApi.update(product._id!, data, product.version!);
      toast.success('Đã cập nhật sản phẩm');
      navigate('/core/products');
    } catch (error: any) {
      toast.error('Không thể cập nhật: ' + error.message);
      throw error;
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
          <p className="text-red-600">Không tìm thấy sản phẩm</p>
          <Button onClick={() => navigate('/core/products')} className="mt-4">
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
      backPath="/core/products"
      backLabel="Quay lại danh sách"
    >
      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/products')}
      />
    </FormPageLayout>
  );
}