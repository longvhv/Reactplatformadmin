/**
 * Edit Usage Event Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../../components/shim/next-navigation';
import { Activity } from 'lucide-react';
import { FormPageLayout } from '../../../../../../components/layouts/FormPageLayout';
import { usageEventsApi, UsageEvent } from '../../../../../../api/usageEventsApi';
import { UsageEventForm } from '../../../../../../components/usage-events/UsageEventForm';
import { showToast } from '../../../../../../lib/toast';

function EditUsageEventPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<UsageEvent | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (id) loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setDataLoading(true);
      const data = await usageEventsApi.getById(id);
      setEvent(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load usage event');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await usageEventsApi.update(id, data);
      showToast.success('Success', 'Usage event updated');
      router.push('/platform/usage-events');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout 
      mode="edit" 
      title="Edit Usage Event" 
      description="Update or correct usage event details" 
      icon={Activity} 
      backPath="/platform/usage-events" 
      backLabel="Back"
    >
      <UsageEventForm 
        initialData={event || undefined}
        onSubmit={handleSubmit} 
        loading={loading} 
        onCancel={() => router.push('/platform/usage-events')} 
      />
    </FormPageLayout>
  );
}

export { EditUsageEventPage };
export default EditUsageEventPage;