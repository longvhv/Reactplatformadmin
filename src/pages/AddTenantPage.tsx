/**
 * AddTenantPage
 * Wrapper for creating new tenant
 */

import { TenantForm } from '@/components/tenants/TenantForm';
import { useTenants } from '@/hooks/useTenants';

export default function AddTenantPage() {
  const { createTenant, tenants } = useTenants({ autoLoad: true });

  return (
    <TenantForm
      tenants={tenants}
      onSubmit={createTenant}
      isEdit={false}
    />
  );
}
