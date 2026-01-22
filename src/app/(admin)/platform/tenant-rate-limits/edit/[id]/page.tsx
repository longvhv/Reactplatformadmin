'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Activity, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { TenantRateLimitForm } from '../../../../../../components/tenant-rate-limits/TenantRateLimitForm';
import { tenantRateLimitsApi, TenantRateLimit, UpdateRateLimitRequest } from '../../../../../../api/tenantRateLimitsApi';
import { showToast } from '../../../../../../lib/toast';

export default function EditRateLimitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [limit, setLimit] = useState<TenantRateLimit | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchLimit = async () => {
      try {
        const data = await tenantRateLimitsApi.getById(id);
        setLimit(data);
      } catch (error: any) {
        console.error('Failed to fetch rate limit:', error);
        showToast.error('Error', 'Failed to load configuration');
        router.push('/platform/tenant-rate-limits');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchLimit();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await tenantRateLimitsApi.update(id, data as UpdateRateLimitRequest);
      showToast.success('Success', 'Rate limit updated successfully');
      router.push('/platform/tenant-rate-limits');
    } catch (error: any) {
      console.error('Failed to update rate limit:', error);
      showToast.error('Error', error.message || 'Failed to update configuration');
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

  if (!limit) return null;

  return (
    <PageLayout
      icon={Activity}
      title="Edit Rate Limit"
      description={`Update configuration for ${limit.limit_name}`}
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/tenant-rate-limits')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <TenantRateLimitForm
          initialData={limit}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/tenant-rate-limits')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}