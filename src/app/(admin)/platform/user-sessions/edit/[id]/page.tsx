'use client';

import { useRouter, useParams } from '@/components/shim/next-navigation';
import { Monitor, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { UserSessionForm } from '@/components/user-sessions/UserSessionForm';
import { userSessionsApi, UserSession, UpdateSessionRequest } from '@/api/userSessionsApi';
import { showToast } from '@/lib/toast';

export default function EditUserSessionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await userSessionsApi.getById(id);
        setSession(data);
      } catch (error: any) {
        console.error('Failed to fetch session:', error);
        showToast.error('Error', 'Failed to load session record');
        router.push('/platform/user-sessions');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchSession();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userSessionsApi.update(id, data as UpdateSessionRequest);
      showToast.success('Success', 'User session updated successfully');
      router.push('/platform/user-sessions');
    } catch (error: any) {
      console.error('Failed to update session:', error);
      showToast.error('Error', error.message || 'Failed to update session');
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

  if (!session) return null;

  return (
    <PageLayout
      icon={Monitor}
      title="Edit User Session"
      description={`Update session for user`}
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-sessions')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserSessionForm
          initialData={session}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-sessions')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}