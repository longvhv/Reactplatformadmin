/**
 * Edit Application Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { useParams } from 'react-router'; // ✅ Use react-router
import { Server } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { applicationsApi, Application } from '@/api/applicationsApi';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { showToast } from '@/lib/toast';

function EditApplicationPage() {
  const router = useRouter();
  const params = useParams(); // ✅ Use hook
  const id = params.id;
  
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<Application | null>(null);

  useEffect(() => {
    if (id) {
      loadApplication(id);
    }
  }, [id]);

  const loadApplication = async (appId: string) => {
    try {
      const data = await applicationsApi.getById(appId);
      setInitialData(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load application');
      router.push('/platform/applications');
    }
  };

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    setLoading(true);
    try {
      await applicationsApi.update(id, data);
      showToast.success('Success', 'Application updated');
      router.push('/platform/applications');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update application');
    } finally {
      setLoading(false);
    }
  };

  if (!initialData) {
    return (
        <FormPageLayout mode="edit" title="Edit Application" description="Manage application details" icon={Server} backPath="/platform/applications" backLabel="Back">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        </FormPageLayout>
    );
  }

  return (
    <FormPageLayout mode="edit" title="Edit Application" description={`Edit details for ${initialData.name}`} icon={Server} backPath="/platform/applications" backLabel="Back">
      <ApplicationForm 
        initialData={initialData} 
        onSubmit={handleSubmit} 
        loading={loading} 
        onCancel={() => router.push('/platform/applications')} 
      />
    </FormPageLayout>
  );
}

export default EditApplicationPage;
