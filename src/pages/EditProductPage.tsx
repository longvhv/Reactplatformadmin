/**
 * Edit Product Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saasProductApi, SaaSProduct } from '../api/saasProductApi';
import { ProductForm } from '../components/products/ProductForm';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function EditProductPage() {
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
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Không tìm thấy sản phẩm</p>
          <Button onClick={() => navigate('/core/products')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/core/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Chỉnh sửa sản phẩm
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {product.name} ({product.code})
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/core/products')}
        />
      </div>
    </div>
  );
}