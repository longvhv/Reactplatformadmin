/**
 * TenantUsage Component
 * Usage monitoring tab - Stub
 */

interface TenantUsageProps {
  tenantId: string;
  tier: string;
}

export function TenantUsage({ tenantId, tier }: TenantUsageProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Theo dõi Usage</h2>
      <p className="text-gray-500">Component đang được phát triển...</p>
      <p className="text-sm text-gray-400 mt-2">Tenant ID: {tenantId}</p>
      <p className="text-sm text-gray-400">Tier: {tier}</p>
    </div>
  );
}
