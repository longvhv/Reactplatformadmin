/**
 * Add Usage Event Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Activity } from 'lucide-react';
import { FormPageLayout } from '../../../../components/layouts/FormPageLayout';
import { usageEventsApi } from '../../../../api/usageEventsApi';
import { UsageEventForm } from '../../../../components/usage-events/UsageEventForm';
import { showToast } from '../../../../lib/toast';

function AddUsageEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await usageEventsApi.create(data);
      showToast.success('Success', 'Usage event recorded');
      router.push('/platform/usage-events');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to record event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout 
      mode="add" 
      title="Record Usage Event" 
      description="Manually record a usage event" 
      icon={Activity} 
      backPath="/platform/usage-events" 
      backLabel="Back"
    >
      <UsageEventForm 
        onSubmit={handleSubmit} 
        loading={loading} 
        onCancel={() => router.push('/platform/usage-events')} 
      />
    </FormPageLayout>
  );
}

export { AddUsageEventPage };
export default AddUsageEventPage;