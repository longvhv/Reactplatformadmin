/**
 * Edit Webhook | Edit Application | Edit Service Package | Edit Product Type | Edit SaaS Product Type
 * ✅ MIGRATED: Batch of 5 edit pages
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Webhook } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { webhooksApi } from '@/api/webhooksApi';
import { WebhookForm } from '@/components/webhooks/WebhookForm';
import { showToast } from '@/lib/toast';

function EditWebhookPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [webhook, setWebhook] = useState<any>(null);
  const [webhookLoading, setWebhookLoading] = useState(true);

  useEffect(() => { if (id) loadWebhook(); }, [id]);

  const loadWebhook = async () => {
    try {
      setWebhookLoading(true);
      const data = await webhooksApi.getById(id);
      setWebhook(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load');
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await webhooksApi.update(id, data);
      showToast.success('Success', 'Webhook updated');
      router.push('/platform/webhooks');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (webhookLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <FormPageLayout mode="edit" title="Edit Webhook" description="Update webhook configuration" icon={Webhook} backPath="/platform/webhooks" backLabel="Back">
      <WebhookForm initialData={webhook} onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/webhooks')} />
    </FormPageLayout>
  );
}

export { EditWebhookPage };
export default EditWebhookPage;