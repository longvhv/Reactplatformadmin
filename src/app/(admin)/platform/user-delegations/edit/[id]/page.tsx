import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { UserCog, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { UserDelegationForm } from '../../../../../../components/user-delegations/UserDelegationForm';
import { userDelegationsApi, UserDelegation, UpdateDelegationRequest } from '../../../../../../api/userDelegationsApi';
import { showToast } from '../../../../../../lib/toast';

export default function EditUserDelegationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [delegation, setDelegation] = useState<UserDelegation | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDelegation = async () => {
      try {
        const data = await userDelegationsApi.getById(id);
        setDelegation(data);
      } catch (error: any) {
        console.error('Failed to fetch delegation:', error);
        showToast.error('Error', 'Failed to load delegation record');
        router.push('/platform/user-delegations');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchDelegation();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userDelegationsApi.update(id, data as UpdateDelegationRequest);
      showToast.success('Success', 'Delegation updated successfully');
      router.push('/platform/user-delegations');
    } catch (error: any) {
      console.error('Failed to update delegation:', error);
      showToast.error('Error', error.message || 'Failed to update delegation');
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

  if (!delegation) return null;

  return (
    <PageLayout
      icon={UserCog}
      title="Edit Delegation"
      description="Update delegation settings and permissions"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-delegations')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserDelegationForm
          initialData={delegation}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-delegations')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}