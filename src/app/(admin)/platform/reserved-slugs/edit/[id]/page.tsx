/**
 * Edit Reserved Slug | Edit Webhook | Edit Application | Add/Edit Service Delivery | Edit Invoice
 * ✅ MIGRATED: Batch edit pages
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../../components/shim/next-navigation';
import { Tag } from 'lucide-react';
import { FormPageLayout } from '../../../../../../components/layout/FormPageLayout';
import { reservedSlugsApi } from '../../../../../../api/reservedSlugsSimpleApi';
import { ReservedSlugForm } from '../../../../../../components/reserved-slugs/ReservedSlugForm';
import { showToast } from '../../../../../../lib/toast';

function EditReservedSlugPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<any>(null);
  const [slugLoading, setSlugLoading] = useState(true);

  useEffect(() => { if (id) loadSlug(); }, [id]);

  const loadSlug = async () => {
    try {
      setSlugLoading(true);
      const data = await reservedSlugsApi.getById(id);
      setSlug(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load');
    } finally {
      setSlugLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await reservedSlugsApi.update(id, data);
      showToast.success('Success', 'Reserved slug updated');
      router.push('/platform/reserved-slugs');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (slugLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <FormPageLayout mode="edit" title="Edit Reserved Slug" description="Update reserved slug" icon={Tag} backPath="/platform/reserved-slugs" backLabel="Back">
      <ReservedSlugForm initialData={slug} onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/reserved-slugs')} />
    </FormPageLayout>
  );
}

export { EditReservedSlugPage };
export default EditReservedSlugPage;