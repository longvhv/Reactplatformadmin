/**
 * Create Feature Flag Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Flag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { FeatureFlagForm } from '@/components/feature-flags/FeatureFlagForm';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { CreateFeatureFlagRequest } from '@/api/featureFlagsApi';
import { showToast } from '@/lib/toast';

export default function CreateFeatureFlagPage() {
  const router = useRouter();
  const { createFeatureFlag } = useFeatureFlags();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CreateFeatureFlagRequest | any) => {
    setSubmitting(true);
    try {
      await createFeatureFlag(data);
      showToast.success('Success', 'Feature flag created successfully');
      router.push('/platform/feature-flags');
    } catch (error: any) {
      console.error('Failed to create feature flag:', error);
      showToast.error('Error', error.message || 'Failed to create feature flag');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      icon={Flag}
      title="Create Feature Flag"
      description="Create a new feature flag to control feature rollout"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/feature-flags')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <FeatureFlagForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/feature-flags')}
          loading={submitting}
        />
      </div>
    </PageLayout>
  );
}
