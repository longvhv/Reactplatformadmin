/**
 * TenantBilling Component
 * Billing management tab - Stub
 */

import type { Tenant } from '../../data/tenants';

interface TenantBillingProps {
  tenantId: string;
  tenant: Tenant;
}

export function TenantBilling({ tenantId, tenant }: TenantBillingProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Quản lý Billing</h2>
      <p className="text-gray-500">Component đang được phát triển...</p>
      <p className="text-sm text-gray-400 mt-2">Billing Type: {tenant.billing_type}</p>
      <p className="text-sm text-gray-400">Tier: {tenant.tier}</p>
    </div>
  );
}