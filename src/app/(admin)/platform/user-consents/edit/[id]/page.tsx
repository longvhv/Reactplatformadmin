'use client';

import { useRouter, useParams } from '@/components/shim/next-navigation';
import { FileCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { UserConsentForm } from '@/components/user-consents/UserConsentForm';
import { userConsentsApi, UserConsent, UpdateConsentRequest } from '@/api/userConsentsApi';
import { showToast } from '@/lib/toast';

export default function EditUserConsentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [consent, setConsent] = useState<UserConsent | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchConsent = async () => {
      try {
        const data = await userConsentsApi.getById(id);
        setConsent(data);
      } catch (error: any) {
        console.error('Failed to fetch consent:', error);
        showToast.error('Error', 'Failed to load record');
        router.push('/platform/user-consents');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchConsent();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userConsentsApi.update(id, data as UpdateConsentRequest);
      showToast.success('Success', 'Consent record updated');
      router.push('/platform/user-consents');
    } catch (error: any) {
      console.error('Failed to update consent:', error);
      showToast.error('Error', error.message || 'Failed to update record');
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

  if (!consent) return null;

  return (
    <PageLayout
      icon={FileCheck}
      title="Edit Consent Record"
      description="Modify or audit an existing consent record"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-consents')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserConsentForm
          initialData={consent}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-consents')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}