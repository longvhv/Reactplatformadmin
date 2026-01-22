'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { UserRoleForm } from '../../../../../../components/user-roles/UserRoleForm';
import { userRolesApi, UserRole, UpdateUserRoleRequest } from '../../../../../../api/userRolesApi';
import { showToast } from '../../../../../../lib/toast';

export default function EditUserRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const data = await userRolesApi.getById(id);
        setUserRole(data);
      } catch (error: any) {
        console.error('Failed to fetch user role:', error);
        showToast.error('Error', 'Failed to load assignment record');
        router.push('/platform/user-roles');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchUserRole();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userRolesApi.update(id, data as UpdateUserRoleRequest);
      showToast.success('Success', 'User role assignment updated');
      router.push('/platform/user-roles');
    } catch (error: any) {
      console.error('Failed to update role assignment:', error);
      showToast.error('Error', error.message || 'Failed to update assignment');
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

  if (!userRole) return null;

  return (
    <PageLayout
      icon={Users}
      title="Edit Role Assignment"
      description="Update scope or expiration for this role assignment"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-roles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserRoleForm
          initialData={userRole}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-roles')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}