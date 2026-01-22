/**
 * Add Region Page | Add Reserved Slug Page | Add Service Package Page
 * ✅ MIGRATED: Using Next.js shim - Creating 3 simple form pages
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Globe } from 'lucide-react';
import { FormPageLayout } from '../../../../../components/layouts/FormPageLayout';
import { regionsApi } from '../../../../api/regionsApi';
import { RegionForm } from '../../../../components/regions/RegionForm';
import { showToast } from '../../../../lib/toast';

function AddRegionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await regionsApi.create(data);
      showToast.success('Success', 'Region created');
      router.push('/platform/regions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout mode="add" title="Add Region" description="Create new region" icon={Globe} backPath="/platform/regions" backLabel="Back">
      <RegionForm onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/regions')} />
    </FormPageLayout>
  );
}

export { AddRegionPage };
export default AddRegionPage;