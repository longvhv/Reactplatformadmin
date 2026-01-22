'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { UserRoleForm } from '@/components/user-roles/UserRoleForm';
import { userRolesApi, CreateUserRoleRequest } from '@/api/userRolesApi';
import { showToast } from '@/lib/toast';

export default function CreateUserRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userRolesApi.create(data as CreateUserRoleRequest);
      showToast.success('Success', 'User role assigned successfully');
      router.push('/platform/user-roles');
    } catch (error: any) {
      console.error('Failed to assign role:', error);
      showToast.error('Error', error.message || 'Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Users}
      title="Assign User Role"
      description="Grant a new role to a user"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-roles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserRoleForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-roles')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}