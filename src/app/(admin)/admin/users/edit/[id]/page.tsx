/**
 * Edit User Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { User } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { EnhancedUserForm } from '@/components/users/EnhancedUserForm';
import { showToast } from '@/lib/toast';
import { usersApi, UpdateUserRequest } from '@/api/usersApi';
import { useUser } from '@/hooks/useUser';

function EditUserPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  const { user, loading: userLoading } = useUser(id);

  const handleSubmit = async (data: UpdateUserRequest) => {
    setLoading(true);
    try {
      await usersApi.update(id, data);
      showToast.success(t('common.success'), t('users.updateSuccess'));
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      showToast.error(t('common.error'), error.message || t('users.updateError'));
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title={t('users.editUser')}
      description="Update user information"
      icon={User}
      backPath="/admin/users"
      backLabel={t('users.backToList')}
    >
      <EnhancedUserForm
        initialData={user}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/admin/users')}
      />
    </FormPageLayout>
  );
}

export { EditUserPage };
export default EditUserPage;
