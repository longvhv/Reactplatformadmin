/**
 * TenantAuditLogs Component
 * Audit logs tab - Stub
 */

interface TenantAuditLogsProps {
  tenantId: string;
}

export function TenantAuditLogs({ tenantId }: TenantAuditLogsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Audit Logs</h2>
      <p className="text-gray-500">Component đang được phát triển...</p>
      <p className="text-sm text-gray-400 mt-2">Tenant ID: {tenantId}</p>
    </div>
  );
}
