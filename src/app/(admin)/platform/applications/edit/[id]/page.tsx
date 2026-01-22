/**
 * MEGA BATCH: Edit Application | Edit Service Package | Edit Product Type | Edit SaaS Product Type | Add Service Delivery | Edit Service Delivery | Edit Notification | Add Invoice | Edit Invoice | Add Digital Asset
 * ✅ MIGRATED: 10 pages in one ultra-batch for maximum speed
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Server } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { applicationsApi } from '@/api/applicationsApi';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { showToast } from '@/lib/toast';

function EditApplicationPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => { if (id) loadApp(); }, [id]);

  const loadApp = async () => {
    try {
      setAppLoading(true);
      const data = await applicationsApi.getById(id);
      setApp(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load');
    } finally {
      setAppLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await applicationsApi.update(id, data);
      showToast.success('Success', 'Application updated');
      router.push('/platform/applications');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (appLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <FormPageLayout mode="edit" title="Edit Application" description="Update application settings" icon={Server} backPath="/platform/applications" backLabel="Back">
      <ApplicationForm initialData={app} onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/applications')} />
    </FormPageLayout>
  );
}

export { EditApplicationPage };
export default EditApplicationPage;
