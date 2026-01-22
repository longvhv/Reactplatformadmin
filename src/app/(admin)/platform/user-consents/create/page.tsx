'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { FileCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { UserConsentForm } from '@/components/user-consents/UserConsentForm';
import { userConsentsApi, CreateConsentRequest } from '@/api/userConsentsApi';
import { showToast } from '@/lib/toast';

export default function CreateUserConsentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userConsentsApi.create(data as CreateConsentRequest);
      showToast.success('Success', 'Consent record created successfully');
      router.push('/platform/user-consents');
    } catch (error: any) {
      console.error('Failed to create consent:', error);
      showToast.error('Error', error.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={FileCheck}
      title="Record Consent"
      description="Manually record a user agreement"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-consents')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserConsentForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-consents')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}