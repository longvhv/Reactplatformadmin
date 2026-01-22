/**
 * Add Tenant Subscription Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { CreditCard } from 'lucide-react';
import { FormPageLayout } from '../../../../components/layouts/FormPageLayout';
import { tenantSubscriptionsApi } from '../../../../api/tenantSubscriptionsApi';
import { TenantSubscriptionForm } from '../../../../components/tenant-subscriptions/TenantSubscriptionForm';
import { showToast } from '../../../../lib/toast';

export default function AddTenantSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await tenantSubscriptionsApi.create(data);
      showToast.success('Success', 'Subscription created successfully');
      router.push('/platform/tenant-subscriptions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout 
      mode="add" 
      title="Add Tenant Subscription" 
      description="Create a new subscription for a tenant" 
      icon={CreditCard} 
      backPath="/platform/tenant-subscriptions" 
      backLabel="Back"
    >
      <TenantSubscriptionForm 
        onSubmit={handleSubmit} 
        loading={loading} 
        onCancel={() => router.push('/platform/tenant-subscriptions')} 
      />
    </FormPageLayout>
  );
}