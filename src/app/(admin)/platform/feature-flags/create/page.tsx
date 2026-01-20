/**
 * Add Feature Flag Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Flag } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { featureFlagsApi } from '@/api/featureFlagsApi';
import { FeatureFlagForm } from '@/components/feature-flags/FeatureFlagForm';
import { showToast } from '@/lib/toast';

function AddFeatureFlagPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await featureFlagsApi.create(data);
      showToast.success('Success', 'Feature flag created');
      router.push('/platform/feature-flags');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create feature flag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Add Feature Flag"
      description="Create a new feature flag"
      icon={Flag}
      backPath="/platform/feature-flags"
      backLabel="Back to Feature Flags"
    >
      <FeatureFlagForm
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/platform/feature-flags')}
      />
    </FormPageLayout>
  );
}

export { AddFeatureFlagPage };
export default AddFeatureFlagPage;
