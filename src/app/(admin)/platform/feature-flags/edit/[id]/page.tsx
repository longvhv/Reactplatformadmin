'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Flag } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { FeatureFlagForm } from '../../../../../../components/feature-flags/FeatureFlagForm';
import { featureFlagsApi, FeatureFlag, UpdateFeatureFlagRequest } from '../../../../../../api/featureFlagsApi';
import { showToast } from '../../../../../../lib/toast';

function EditFeatureFlagPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const data = await featureFlagsApi.getById(id);
        setFlag(data);
      } catch (error: any) {
        console.error('Failed to fetch feature flag:', error);
        showToast.error('Error', 'Failed to load feature flag details');
        router.push('/platform/feature-flags');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchFlag();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await featureFlagsApi.update(id, data as UpdateFeatureFlagRequest);
      showToast.success('Success', 'Feature flag updated successfully');
      router.push('/platform/feature-flags');
    } catch (error: any) {
      console.error('Failed to update feature flag:', error);
      showToast.error('Error', error.message || 'Failed to update feature flag');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!flag) return null;

  return (
    <PageLayout
      icon={Flag}
      title="Edit Feature Flag"
      description={`Update configuration for ${flag.flag_name}`}
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/feature-flags')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <FeatureFlagForm
          flag={flag}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/feature-flags')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}