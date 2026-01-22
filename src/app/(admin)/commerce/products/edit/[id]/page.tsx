/**
 * Edit Product Page
 * Page for updating an existing SaaS product
 * ✅ CREATED: 2026-01-21
 */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Package, AlertCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { EnhancedProductForm } from '@/components/products/EnhancedProductForm';
import { saasProductsApi, SaasProduct, UpdateSaasProductRequest } from '@/api/saasProductsApi';
import { showToast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<SaasProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await saasProductsApi.getById(id);
      setProduct(data);
    } catch (err: any) {
      console.error('Load product error:', err);
      setError(err.message || 'Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!product) return;
    
    try {
      setSubmitting(true);
      // Ensure we pass the version for optimistic locking
      const updateData: UpdateSaasProductRequest = {
        ...data,
        version: product.version
      };
      
      await saasProductsApi.update(product._id, updateData);
      showToast.success('Thành công', 'Đã cập nhật sản phẩm');
      router.push('/commerce/products');
    } catch (err: any) {
      console.error('Update product error:', err);
      showToast.error('Lỗi', err.message || 'Không thể cập nhật sản phẩm');
      // If concurrent modification, reload product
      if (err.message?.includes('Concurrent modification')) {
        loadProduct();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/commerce/products');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Không tìm thấy sản phẩm</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {error || 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.'}
        </p>
        <Button onClick={handleCancel}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <PageLayout
      icon={Package}
      title={`Chỉnh sửa: ${product.name}`}
      description={`Cập nhật thông tin cho sản phẩm ${product.code}`}
      backButton={{
        label: 'Quay lại danh sách',
        onClick: handleCancel,
      }}
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
        <EnhancedProductForm
          product={product}
          tenantId={product.tenant_id}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </div>
    </PageLayout>
  );
}

export default EditProductPage;
