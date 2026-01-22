/**
 * Create Role Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { RoleForm } from '@/components/roles/RoleForm';
import { useRoles } from '@/hooks/useRoles';
import { CreateRoleRequest } from '@/api/rolesApi';
import { showToast } from '@/lib/toast';
import { useAuthContext } from '@/providers/AuthProvider';

export default function CreateRolePage() {
  const router = useRouter();
  const { createRole } = useRoles({ autoLoad: false });
  const { user } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CreateRoleRequest | any) => {
    setSubmitting(true);
    try {
      await createRole(data);
      showToast.success('Success', 'Role created successfully');
      router.push('/admin/roles');
    } catch (error: any) {
      console.error('Failed to create role:', error);
      showToast.error('Error', error.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      icon={Shield}
      title="Create Role"
      description="Create a new role and assign permissions"
      actions={
        <Button variant="outline" onClick={() => router.push('/admin/roles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Roles
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <RoleForm
          tenantId={user?.tenant_id}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/roles')}
          isLoading={submitting}
        />
      </div>
    </PageLayout>
  );
}
