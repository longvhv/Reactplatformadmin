/**
 * Audit Log Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../components/shim/next-navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { auditLogApi, AuditLog } from '../../../../../api/auditLogApi';
import { showToast } from '../../../../../lib/toast';
import { PageLayout } from '../../../../../components/layout/PageLayout';

function AuditLogDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadLog();
  }, [id]);

  const loadLog = async () => {
    try {
      setLoading(true);
      const data = await auditLogApi.getById(id);
      setLog(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Audit Log Not Found</h2>
          <Button onClick={() => router.push('/admin/audit-logs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Audit Logs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      icon={Shield}
      title="Audit Log Details"
      description={`Action: ${log.action}`}
      backButton={{
        label: 'Back to Audit Logs',
        onClick: () => router.push('/admin/audit-logs'),
      }}
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-gray-600 mb-1">Action</dt>
            <dd className="font-medium">{log.action}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">User</dt>
            <dd>{log.user_email || log.user_id || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">IP Address</dt>
            <dd className="font-mono">{log.ip_address || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">Status</dt>
            <dd>
              <span className={`px-2 py-1 rounded text-xs ${
                log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                log.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {log.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">Timestamp</dt>
            <dd>{new Date(log.timestamp).toLocaleString()}</dd>
          </div>
          {log.details && (
            <div>
              <dt className="text-sm text-gray-600 mb-1">Details</dt>
              <dd className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </PageLayout>
  );
}

export { AuditLogDetailPage };
export default AuditLogDetailPage;