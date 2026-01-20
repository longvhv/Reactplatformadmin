/**
 * Create Permission Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Shield } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { PermissionForm } from '@/components/permissions/PermissionForm';
import { usePermissions } from '@/hooks/usePermissions';
import { showToast } from '@/lib/toast';

export default function CreatePermissionPage() {
  const router = useRouter();
  const { createPermission } = usePermissions();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await createPermission(data);
      showToast.success('Success', 'Permission created successfully');
      router.push('/platform/permissions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create permission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="create"
      title="Create Permission"
      description="Define a new system permission or permission group"
      icon={Shield}
      backPath="/platform/permissions"
      backLabel="Back to Permissions"
    >
      <PermissionForm
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/platform/permissions')}
      />
    </FormPageLayout>
  );
}
