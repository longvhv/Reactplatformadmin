/**
 * Add Reserved Slug Page
 * ✅ MIGRATED: Using Next.js shim
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Tag } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { reservedSlugsApi } from '@/api/reservedSlugsSimpleApi';
import { ReservedSlugForm } from '@/components/reserved-slugs/ReservedSlugForm';
import { showToast } from '@/lib/toast';

function AddReservedSlugPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await reservedSlugsApi.create(data);
      showToast.success('Success', 'Reserved slug created');
      router.push('/platform/reserved-slugs');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout mode="add" title="Add Reserved Slug" description="Create reserved slug" icon={Tag} backPath="/platform/reserved-slugs" backLabel="Back">
      <ReservedSlugForm onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/reserved-slugs')} />
    </FormPageLayout>
  );
}

export { AddReservedSlugPage };
export default AddReservedSlugPage;