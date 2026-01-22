/**
 * Add Subscription Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Package } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { tenantSubscriptionsApi as subscriptionApi } from '@/api/tenantSubscriptionsApi';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { showToast } from '@/lib/toast';

function AddSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await subscriptionApi.create(data);
      showToast.success('Success', 'Subscription created');
      router.push('/commerce/subscriptions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout mode="add" title="Add Subscription" description="Create new subscription" icon={Package} backPath="/commerce/subscriptions" backLabel="Back">
      <SubscriptionForm onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/commerce/subscriptions')} />
    </FormPageLayout>
  );
}

export { AddSubscriptionPage };
export default AddSubscriptionPage;
