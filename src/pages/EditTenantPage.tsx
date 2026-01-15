/**
 * EditTenantPage
 * Wrapper for editing existing tenant
 */

import { useParams } from 'react-router';
import { TenantForm } from '@/components/tenants/TenantForm';
import { useTenants } from '@/hooks/useTenants';

export default function EditTenantPage() {
  const { id } = useParams<{ id: string }>();
  const { tenants, updateTenant, loading } = useTenants({ autoLoad: true });

  const tenant = tenants.find(t => t._id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading tenant...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive">Tenant not found</p>
        </div>
      </div>
    );
  }

  return (
    <TenantForm
      tenant={tenant}
      tenants={tenants}
      onSubmit={(data) => updateTenant(id!, data)}
      isEdit={true}
    />
  );
}
