'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { TenantRateLimitForm } from '@/components/tenant-rate-limits/TenantRateLimitForm';
import { tenantRateLimitsApi, CreateRateLimitRequest } from '@/api/tenantRateLimitsApi';
import { showToast } from '@/lib/toast';

export default function CreateRateLimitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await tenantRateLimitsApi.create(data as CreateRateLimitRequest);
      showToast.success('Success', 'Rate limit created successfully');
      router.push('/platform/tenant-rate-limits');
    } catch (error: any) {
      console.error('Failed to create rate limit:', error);
      showToast.error('Error', error.message || 'Failed to create rate limit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Activity}
      title="Create Rate Limit"
      description="Define a new throttling policy for a tenant"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/tenant-rate-limits')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <TenantRateLimitForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/tenant-rate-limits')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}