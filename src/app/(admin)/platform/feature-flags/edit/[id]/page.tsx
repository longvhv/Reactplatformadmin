/**
 * Edit Feature Flag Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Flag } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { featureFlagsApi, FeatureFlag } from '@/api/featureFlagsApi';
import { FeatureFlagForm } from '@/components/feature-flags/FeatureFlagForm';
import { showToast } from '@/lib/toast';

function EditFeatureFlagPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [flagLoading, setFlagLoading] = useState(true);

  useEffect(() => {
    if (id) loadFlag();
  }, [id]);

  const loadFlag = async () => {
    try {
      setFlagLoading(true);
      const data = await featureFlagsApi.getById(id);
      setFlag(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load feature flag');
    } finally {
      setFlagLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await featureFlagsApi.update(id, data);
      showToast.success('Success', 'Feature flag updated');
      router.push('/platform/feature-flags');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (flagLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Edit Feature Flag"
      description="Update feature flag configuration"
      icon={Flag}
      backPath="/platform/feature-flags"
      backLabel="Back to Feature Flags"
    >
      <FeatureFlagForm
        initialData={flag}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/platform/feature-flags')}
      />
    </FormPageLayout>
  );
}

export { EditFeatureFlagPage };
export default EditFeatureFlagPage;
