/**
 * Edit SaaS Product Type Page
 * Edit existing SaaS product type
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { SaasProductTypeForm } from '../components/saas-product-types/SaasProductTypeForm';
import { saasProductTypesApi, SaasProductType, UpdateSaasProductTypeRequest } from '../api/saasProductTypesApi';
import { showToast } from '../lib/toast';

export default function EditSaasProductTypePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [productType, setProductType] = useState<SaasProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductType = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await saasProductTypesApi.getById(id);
        setProductType(data);
      } catch (err: any) {
        setError(err.message);
        showToast.error('Lỗi', 'Không thể tải thông tin loại sản phẩm');
        navigate('/commerce/saas-product-types');
      } finally {
        setLoading(false);
      }
    };

    fetchProductType();
  }, [id, navigate]);

  const handleSubmit = async (data: UpdateSaasProductTypeRequest | any) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const updated = await saasProductTypesApi.update(id, data);
      showToast.success('Thành công', `Đã cập nhật loại sản phẩm: ${updated.name}`);
      navigate('/commerce/saas-product-types');
    } catch (error: any) {
      console.error('Error updating product type:', error);
      showToast.error('Lỗi', 'Không thể cập nhật loại sản phẩm: ' + error.message);
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
            onClick={() => navigate('/commerce/saas-product-types')}
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
      title="Sửa Loại Sản Phẩm SaaS"
      description={`Cập nhật: ${productType.name}`}
      icon={Package}
      backPath="/commerce/saas-product-types"
      backLabel="Quay lại danh sách"
    >
      <SaasProductTypeForm
        productType={productType}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/commerce/saas-product-types')}
        isLoading={isLoading}
      />
    </FormPageLayout>
  );
}
