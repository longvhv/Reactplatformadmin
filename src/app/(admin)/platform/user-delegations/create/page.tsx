import React, { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { UserCog, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { UserDelegationForm } from '../../../../components/user-delegations/UserDelegationForm';
import { userDelegationsApi, CreateDelegationRequest } from '../../../../api/userDelegationsApi';
import { showToast } from '../../../../lib/toast';

export default function CreateUserDelegationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userDelegationsApi.create(data as CreateDelegationRequest);
      showToast.success('Success', 'Delegation created successfully');
      router.push('/platform/user-delegations');
    } catch (error: any) {
      console.error('Failed to create delegation:', error);
      showToast.error('Error', error.message || 'Failed to create delegation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={UserCog}
      title="Create Delegation"
      description="Delegate authority to another user"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-delegations')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserDelegationForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-delegations')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}