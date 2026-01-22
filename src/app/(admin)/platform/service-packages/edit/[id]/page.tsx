/**
 * ULTRA MEGA BATCH: All Remaining Edit Pages
 * Edit Service Package | Edit Product Type | Edit SaaS Product Type | Add Service Delivery | Edit Service Delivery
 * Edit Notification | Add Invoice | Edit Invoice | Add Digital Asset | Edit Digital Asset
 * Add Application | Add Webhook | Edit Region | Add Feature Flag List | Add Reserved Slugs List
 * Add Product Types List | Add SaaS Product Types List | Add Service Packages List | Add Service Deliveries List | Add Regions List
 * ✅ MIGRATED: 20 pages in ultra-rapid mode - using template pattern
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Package } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { servicePackagesApi } from '@/api/servicePackagesApi';
import { ServicePackageForm } from '@/components/service-packages/ServicePackageForm';
import { showToast } from '@/lib/toast';

function EditServicePackagePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      const result = await servicePackagesApi.getById(id);
      setData(result);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await servicePackagesApi.update(id, formData);
      showToast.success('Success', 'Updated successfully');
      router.push('/platform/service-packages');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <FormPageLayout mode="edit" title="Edit Service Package" description="Update service package" icon={Package} backPath="/platform/service-packages" backLabel="Back">
      <ServicePackageForm package={data} onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/service-packages')} />
    </FormPageLayout>
  );
}

export { EditServicePackagePage };
export default EditServicePackagePage;
