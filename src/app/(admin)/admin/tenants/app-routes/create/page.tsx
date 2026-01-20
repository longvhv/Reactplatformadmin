/**
 * Add Tenant App Route Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Route } from 'lucide-react';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { tenantAppRoutesApi } from '@/api/tenantAppRoutesApi';
import { TenantAppRouteForm } from '@/components/tenant-app-routes/TenantAppRouteForm';
import { showToast } from '@/lib/toast';

function AddTenantAppRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await tenantAppRoutesApi.create(data);
      showToast.success('Success', 'App route created');
      router.push('/admin/tenants/app-routes');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create app route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Add Tenant App Route"
      description="Configure custom routing for tenant applications"
      icon={Route}
      backPath="/admin/tenants/app-routes"
      backLabel="Back to App Routes"
    >
      <TenantAppRouteForm
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/admin/tenants/app-routes')}
      />
    </FormPageLayout>
  );
}

export { AddTenantAppRoutePage };
export default AddTenantAppRoutePage;
