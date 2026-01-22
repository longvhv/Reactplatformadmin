/**
 * Edit Role Page
 * ✅ MIGRATED from /pages/roles/edit/[id].tsx
 * Allows editing existing role with permissions and assignments
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { RoleForm } from '../../../../../components/roles/RoleForm';
import { useRole } from '../../../../../hooks/useRole';
import { UpdateRoleRequest } from '../../../../../api/rolesApi';
import { showToast } from '../../../../../lib/toast';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { role, loading: fetching, updateRole, refresh } = useRole(id);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: UpdateRoleRequest | any) => {
    setSubmitting(true);
    try {
      await updateRole(data);
      await refresh();
      showToast.success('Success', 'Role updated successfully');
      router.push(`/admin/roles/${id}`);
    } catch (error: any) {
      console.error('Failed to update role:', error);
      showToast.error('Error', error.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!role) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">Role not found</p>
        <Button variant="link" onClick={() => router.push('/admin/roles')}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <PageLayout
      icon={Shield}
      title="Edit Role"
      description={`Edit configuration for: ${role.name}`}
      actions={
        <Button variant="outline" onClick={() => router.push(`/admin/roles/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Detail
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <RoleForm
          role={role}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/admin/roles/${id}`)}
          isLoading={submitting}
        />
      </div>
    </PageLayout>
  );
}