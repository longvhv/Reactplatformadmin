/**
 * Add Tenant App Route Page
 * Page for creating a new tenant app route
 */

'use client';

import { useRouter } from '../../../../../../components/shim/next-navigation';
import { FormPageLayout } from '../../../../../../components/layouts/FormPageLayout';
import { tenantAppRoutesApi } from '../../../../../../api/tenantAppRoutesApi';
import { EnhancedTenantAppRouteForm } from '../../../../../../components/tenant-app-routes/EnhancedTenantAppRouteForm';
import { showToast } from '../../../../../../lib/toast';
import { DEFAULT_TENANT_ID } from '../../../../../../constants/tenant-constants';

function AddTenantAppRoutePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      await tenantAppRoutesApi.create(data);
      showToast.success('Success', 'App route created');
      router.back();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create app route');
    }
  };

  return (
    <FormPageLayout
      title="Add App Route"
      description="Configure a new application route"
    >
      <EnhancedTenantAppRouteForm
        tenantId={DEFAULT_TENANT_ID} // Or get from context/params if needed
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </FormPageLayout>
  );
}

export { AddTenantAppRoutePage };
export default AddTenantAppRoutePage;