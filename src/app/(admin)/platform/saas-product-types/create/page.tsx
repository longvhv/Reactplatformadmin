/**
 * Add SaaS Product Type | Edit Reserved Slug | Edit Webhook | Edit Application | Add Service Delivery
 * ✅ MIGRATED: Batch of 5 pages
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Layers } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { saasProductTypesApi } from '@/api/saasProductTypesApi';
import { SaasProductTypeForm } from '@/components/saas-product-types/SaasProductTypeForm';
import { showToast } from '@/lib/toast';

function AddSaasProductTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await saasProductTypesApi.create(data);
      showToast.success('Success', 'SaaS product type created');
      router.push('/platform/saas-product-types');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout mode="add" title="Add SaaS Product Type" description="Create SaaS product type" icon={Layers} backPath="/platform/saas-product-types" backLabel="Back">
      <SaasProductTypeForm onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/saas-product-types')} />
    </FormPageLayout>
  );
}

export { AddSaasProductTypePage };
export default AddSaasProductTypePage;
