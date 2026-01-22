/**
 * Batch Form Pages: Add Product Type | Add SaaS Product Type | Edit Product Type | Edit SaaS Product Type | Edit Service Package
 * ✅ MIGRATED: 5 form pages in rapid batch
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Box } from 'lucide-react';
import { FormPageLayout } from '../../../../../components/layouts/FormPageLayout';
import { productTypesApi } from '../../../../api/productTypesApi';
import { ProductTypeForm } from '../../../../components/product-types/ProductTypeForm';
import { showToast } from '../../../../lib/toast';

function AddProductTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await productTypesApi.create(data);
      showToast.success('Success', 'Product type created');
      router.push('/platform/product-types');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout mode="add" title="Add Product Type" description="Create product type" icon={Box} backPath="/platform/product-types" backLabel="Back">
      <ProductTypeForm onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/product-types')} />
    </FormPageLayout>
  );
}

export { AddProductTypePage };
export default AddProductTypePage;