/**
 * Add Product Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { saasProductApi, SaaSProduct } from '../api/saasProductApi';
import { ProductForm } from '../components/products/ProductForm';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function AddProductPage() {
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/core/products')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Thêm sản phẩm mới
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/core/products')}
        />
      </div>
    </div>
  );
}