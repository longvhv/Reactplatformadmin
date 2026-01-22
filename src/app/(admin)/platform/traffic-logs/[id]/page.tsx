/**
 * Traffic Log Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../components/shim/next-navigation';
import { Activity, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { getTrafficLogById, TrafficLog } from '../../../../api/trafficLogsApi';
import { showToast } from '../../../../lib/toast';
import { PageLayout } from '../../../../components/layout/PageLayout';

function TrafficLogDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [log, setLog] = useState<TrafficLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadLog();
  }, [id]);

  const loadLog = async () => {
    try {
      setLoading(true);
      const data = await getTrafficLogById(id);
      setLog(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load traffic log');
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
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Log Not Found</h2>
          <Button onClick={() => router.push('/platform/traffic-logs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Traffic Logs
          </Button>
        </div>
      </div>
    );
  }

  // Construct endpoint from domain and path
  const endpoint = log.domain && log.path ? `${log.domain}${log.path}` : (log.path || log.domain || 'N/A');

  return (
    <PageLayout
      icon={Activity}
      title="Traffic Log Details"
      description={`${log.method || 'N/A'} ${endpoint}`}
      backButton={{
        label: 'Back to Traffic Logs',
        onClick: () => router.push('/platform/traffic-logs'),
      }}
    >
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-gray-600 mb-1">Method</dt>
            <dd className="font-mono font-medium">{log.method || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">Endpoint</dt>
            <dd className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded break-all">
              {endpoint}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">Status Code</dt>
            <dd>
              <span className={`px-2 py-1 rounded text-xs font-mono ${
                log.status_code && log.status_code >= 200 && log.status_code < 300 ? 'bg-green-100 text-green-800' :
                log.status_code && log.status_code >= 400 ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {log.status_code || 'N/A'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">Response Time</dt>
            <dd>{log.latency_ms ? `${log.latency_ms}ms` : 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">IP Address</dt>
            <dd className="font-mono">{log.ip_address || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 mb-1">Timestamp</dt>
            <dd>{new Date(log.timestamp).toLocaleString()}</dd>
          </div>
          {log.user_agent && (
            <div>
              <dt className="text-sm text-gray-600 mb-1">User Agent</dt>
              <dd className="text-sm break-all">{log.user_agent}</dd>
            </div>
          )}
          {log.data_region && (
            <div>
              <dt className="text-sm text-gray-600 mb-1">Data Region</dt>
              <dd>{log.data_region}</dd>
            </div>
          )}
          {log.app_code && (
            <div>
              <dt className="text-sm text-gray-600 mb-1">App Code</dt>
              <dd className="font-mono">{log.app_code}</dd>
            </div>
          )}
        </dl>
      </div>
    </PageLayout>
  );
}

export { TrafficLogDetailPage };
export default TrafficLogDetailPage;