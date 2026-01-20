/**
 * Edit Permission Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { Shield } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { PermissionForm } from '@/components/permissions/PermissionForm';
import { usePermissions } from '@/hooks/usePermissions';
import { showToast } from '@/lib/toast';

export default function EditPermissionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { permissions, loadPermissions, updatePermission } = usePermissions({ autoLoad: true });
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<any>(null);

  // Find permission from loaded list
  useEffect(() => {
    if (permissions.length > 0 && id) {
      const found = permissions.find(p => p._id === id);
      if (found) {
        setPermission(found);
      } else {
        // Fallback: If not in current list (maybe pagination?), force load or show error
        // For now, assume autoLoad fetches all or relevant ones. 
        // Real app might need fetchById.
      }
    }
  }, [permissions, id]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await updatePermission(id, data);
      showToast.success('Success', 'Permission updated successfully');
      router.push('/platform/permissions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update permission');
    } finally {
      setLoading(false);
    }
  };

  if (!permission && permissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!permission && permissions.length > 0) {
     return (
        <FormPageLayout
            mode="edit"
            title="Permission Not Found"
            description="The requested permission could not be found."
            icon={Shield}
            backPath="/platform/permissions"
            backLabel="Back to Permissions"
        >
            <div className="text-center py-8">
                <p className="text-gray-500">Permission not found or you don't have access.</p>
            </div>
        </FormPageLayout>
     );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Edit Permission"
      description={`Edit permission: ${permission.name}`}
      icon={Shield}
      backPath="/platform/permissions"
      backLabel="Back to Permissions"
    >
      <PermissionForm
        initialData={permission}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/platform/permissions')}
      />
    </FormPageLayout>
  );
}
