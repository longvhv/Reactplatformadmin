import { TenantForm } from "@/components/tenants/TenantForm";
import { createTenant } from "@/api/tenantApi";
import { Tenant } from "@/data/tenants";

export function AddTenantPage() {
  const handleSubmit = async (data: Partial<Tenant>) => {
    // API call to create tenant
    await createTenant(data);
  };

  return <TenantForm onSubmit={handleSubmit} isEdit={false} />;
}
