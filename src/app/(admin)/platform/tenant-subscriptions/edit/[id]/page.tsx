/**
 * Edit Tenant Subscription Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { CreditCard } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { tenantSubscriptionsApi, TenantSubscription } from '@/api/tenantSubscriptionsApi';
import { TenantSubscriptionForm } from '@/components/tenant-subscriptions/TenantSubscriptionForm';
import { showToast } from '@/lib/toast';

export default function EditTenantSubscriptionPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TenantSubscription | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setFetching(true);
      const result = await tenantSubscriptionsApi.getById(id);
      setData(result);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load subscription');
      router.push('/platform/tenant-subscriptions');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await tenantSubscriptionsApi.update(id, formData);
      showToast.success('Success', 'Subscription updated successfully');
      router.push('/platform/tenant-subscriptions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout 
      mode="edit" 
      title="Edit Tenant Subscription" 
      description={`Update subscription ${data?.subscription_number}`} 
      icon={CreditCard} 
      backPath="/platform/tenant-subscriptions" 
      backLabel="Back"
    >
      <TenantSubscriptionForm 
        initialData={data} 
        onSubmit={handleSubmit} 
        loading={loading} 
        onCancel={() => router.push('/platform/tenant-subscriptions')} 
      />
    </FormPageLayout>
  );
}
