'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Monitor, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { UserSessionForm } from '../../../../components/user-sessions/UserSessionForm';
import { userSessionsApi, CreateSessionRequest } from '../../../../api/userSessionsApi';
import { showToast } from '../../../../lib/toast';

export default function CreateUserSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userSessionsApi.create(data as CreateSessionRequest);
      showToast.success('Success', 'User session created successfully');
      router.push('/platform/user-sessions');
    } catch (error: any) {
      console.error('Failed to create session:', error);
      showToast.error('Error', error.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Monitor}
      title="Create User Session"
      description="Manually create a user session record"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-sessions')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserSessionForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-sessions')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}