import React, { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { WebhookForm } from '../../../../../components/webhooks/WebhookForm';
import { webhooksApi, CreateWebhookRequest } from '../../../../../api/webhooksApi';
import { showToast } from '../../../../../lib/toast';
import { Webhook } from 'lucide-react';

export default function CreateWebhookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await webhooksApi.create(data as CreateWebhookRequest);
      showToast.success('Success', 'Webhook created successfully');
      router.push('/integrations/webhooks');
    } catch (error: any) {
      console.error('Failed to create webhook:', error);
      showToast.error('Error', error.message || 'Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Webhook}
      title="Create Webhook"
      description="Add a new webhook endpoint to receive real-time updates"
      showBackButton
      backHref="/integrations/webhooks"
    >
      <div className="max-w-4xl mx-auto">
        <WebhookForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/integrations/webhooks')}
          isLoading={loading}
        />
      </div>
    </PageLayout>
  );
}