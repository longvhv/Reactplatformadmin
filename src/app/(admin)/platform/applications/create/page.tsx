/**
 * Create Application Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../../components/shim/next-navigation';
import { Plus } from 'lucide-react';
import { FormPageLayout } from '../../../../../../components/layouts/FormPageLayout';
import { applicationsApi } from '../../../../../../api/applicationsApi';
import { ApplicationForm } from '../../../../../../components/applications/ApplicationForm';
import { showToast } from '../../../../../../lib/toast';

function CreateApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await applicationsApi.create(data);
      showToast.success('Success', 'Application created');
      router.push('/platform/applications');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout mode="create" title="Create Application" description="Add a new application to the platform" icon={Plus} backPath="/platform/applications" backLabel="Back">
      <ApplicationForm onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/applications')} />
    </FormPageLayout>
  );
}

export { CreateApplicationPage };
export default CreateApplicationPage;