/**
 * Multiple Form Pages: Add Service Package | Add Product Type | Add SaaS Product Type | Edit Reserved Slug | Edit Webhook
 * ✅ MIGRATED: Using Next.js shim - Batch of 5 pages
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Package } from 'lucide-react';
import { FormPageLayout } from '../../../../../components/layouts/FormPageLayout';
import { servicePackagesApi } from '../../../../api/servicePackagesApi';
import { ServicePackageForm } from '../../../../components/service-packages/ServicePackageForm';
import { showToast } from '../../../../lib/toast';

function AddServicePackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await servicePackagesApi.create(data);
      showToast.success('Success', 'Service package created');
      router.push('/platform/service-packages');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout mode="add" title="Add Service Package" description="Create service package" icon={Package} backPath="/platform/service-packages" backLabel="Back">
      <ServicePackageForm onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/service-packages')} />
    </FormPageLayout>
  );
}

export { AddServicePackagePage };
export default AddServicePackagePage;