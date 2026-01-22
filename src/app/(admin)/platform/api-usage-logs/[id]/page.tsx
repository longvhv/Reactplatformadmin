/**
 * API Usage Logs Detail Page
 * ✅ MIGRATED from /pages/platform/api-usage-logs/[id].tsx
 */
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { Activity, ArrowLeft } from 'lucide-react';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { apiUsageLogsApi } from '../../../../../api/apiUsageLogsApi';
import { showToast } from '../../../../../lib/toast';

function ApiUsageLogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { const data = await apiUsageLogsApi.getById(id); setItem(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!item) return <div className="text-center py-12">Not found</div>;

  return <Fragment><PageLayout icon={Activity} title="API Usage Log Details" description="View API usage log information"><Card className="p-6"><div className="space-y-4"><div><h3 className="font-semibold mb-2">Endpoint</h3><p className="text-gray-700 font-mono text-sm">{item.endpoint}</p></div><div><h3 className="font-semibold mb-2">Method</h3><p className="text-gray-700">{item.method}</p></div><div><h3 className="font-semibold mb-2">Status Code</h3><p className="text-gray-700">{item.status_code}</p></div><div><h3 className="font-semibold mb-2">Timestamp</h3><p className="text-gray-700">{new Date(item.timestamp).toLocaleString()}</p></div></div></Card></PageLayout></Fragment>;
}
export { ApiUsageLogDetailPage };
export default ApiUsageLogDetailPage;