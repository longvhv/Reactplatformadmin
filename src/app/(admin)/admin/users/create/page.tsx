/**
 * Add User Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { User } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { EnhancedUserForm } from '@/components/users/EnhancedUserForm';
import { showToast } from '@/lib/toast';
import { usersApi, CreateUserRequest } from '@/api/usersApi';

function AddUserPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateUserRequest) => {
    setLoading(true);
    try {
      await usersApi.create(data);
      showToast.success(t('common.success'), t('users.createSuccess'));
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast.error(t('common.error'), error.message || t('users.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title={t('users.addUser')}
      description="Create new user account"
      icon={User}
      backPath="/admin/users"
      backLabel={t('users.backToList')}
    >
      <EnhancedUserForm
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/admin/users')}
      />
    </FormPageLayout>
  );
}

export { AddUserPage };
export default AddUserPage;
