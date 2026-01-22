'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { WebhookForm } from '@/components/webhooks/WebhookForm';
import { webhooksApi, UpdateWebhookRequest, Webhook as WebhookType } from '@/api/webhooksApi';
import { showToast } from '@/lib/toast';
import { Webhook } from 'lucide-react';

export default function EditWebhookPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<WebhookType | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      loadWebhook();
    }
  }, [id]);

  const loadWebhook = async () => {
    try {
      setFetching(true);
      const data = await webhooksApi.getById(id);
      setInitialData(data);
    } catch (error: any) {
      console.error('Failed to load webhook:', error);
      showToast.error('Error', 'Failed to load webhook details');
      router.push('/integrations/webhooks');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await webhooksApi.update(id, data as UpdateWebhookRequest);
      showToast.success('Success', 'Webhook updated successfully');
      router.push('/integrations/webhooks');
    } catch (error: any) {
      console.error('Failed to update webhook:', error);
      showToast.error('Error', error.message || 'Failed to update webhook');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
       <PageLayout
        icon={Webhook}
        title="Edit Webhook"
        description="Loading webhook details..."
        showBackButton
        backHref="/integrations/webhooks"
      >
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    );
  }

  if (!initialData) return null;

  return (
    <PageLayout
      icon={Webhook}
      title="Edit Webhook"
      description={`Update configuration for ${initialData.name}`}
      showBackButton
      backHref="/integrations/webhooks"
    >
      <div className="max-w-4xl mx-auto">
        <WebhookForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/integrations/webhooks')}
          isLoading={loading}
        />
      </div>
    </PageLayout>
  );
}
