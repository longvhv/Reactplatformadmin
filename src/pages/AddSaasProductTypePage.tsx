/**
 * Add SaaS Product Type Page
 * Create new SaaS product type
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { SaasProductTypeForm } from '../components/saas-product-types/SaasProductTypeForm';
import { saasProductTypesApi, CreateSaasProductTypeRequest } from '../api/saasProductTypesApi';
import { showToast } from '../lib/toast';

export default function AddSaasProductTypePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateSaasProductTypeRequest | any) => {
    try {
      setIsLoading(true);
      const created = await saasProductTypesApi.create(data);
      showToast.success('Thành công', `Đã tạo loại sản phẩm: ${created.name}`);
      navigate('/commerce/saas-product-types');
    } catch (error: any) {
      console.error('Error creating product type:', error);
      showToast.error('Lỗi', 'Không thể tạo loại sản phẩm: ' + error.message);
      throw error; // Re-throw to let form handle it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Loại Sản Phẩm SaaS"
      description="Tạo loại sản phẩm SaaS mới"
      icon={Package}
      backPath="/commerce/saas-product-types"
      backLabel="Quay lại danh sách"
    >
      <SaasProductTypeForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/commerce/saas-product-types')}
        isLoading={isLoading}
      />
    </FormPageLayout>
  );
}
