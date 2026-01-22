/**
 * TenantSettings Component
 * Settings configuration tab - Stub
 */

import type { Tenant } from '../../data/tenants';

interface TenantSettingsProps {
  tenant: Tenant;
  onUpdate: (data: Partial<Tenant>) => Promise<void>;
}

export function TenantSettings({ tenant, onUpdate }: TenantSettingsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Cài đặt Tenant</h2>
      <p className="text-gray-500">Component đang được phát triển...</p>
    </div>
  );
}