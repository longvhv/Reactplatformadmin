/**
 * System Log Detail Page
 * ✅ MIGRATED from /pages/admin/system-logs/[id].tsx
 */
'use client';
import { useState, useEffect } from 'react';
import { useParams } from '../../../../../components/shim/next-navigation';
import { FileText, ArrowLeft } from 'lucide-react';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { systemLogsApi } from '../../../../../api/systemLogsApi';
import { showToast } from '../../../../../lib/toast';

function SystemLogDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadLog(); }, [id]);
  const loadLog = async () => { try { const data = await systemLogsApi.getById(id); setLog(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!log) return <div className="text-center py-12">Not found</div>;

  return <Fragment><PageLayout icon={FileText} title="System Log Details" description="View system log details"><Card className="p-6"><div className="space-y-4"><div><h3 className="font-semibold mb-2">Level</h3><span className={`px-3 py-1 rounded text-sm font-semibold ${log.level === 'error' ? 'bg-red-100 text-red-800' : log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{log.level}</span></div><div><h3 className="font-semibold mb-2">Timestamp</h3><p className="text-gray-700">{new Date(log.timestamp).toLocaleString()}</p></div><div><h3 className="font-semibold mb-2">Message</h3><p className="text-gray-700 font-mono text-sm bg-gray-50 p-3 rounded">{log.message}</p></div>{log.stack && <div><h3 className="font-semibold mb-2">Stack Trace</h3><pre className="text-gray-700 font-mono text-xs bg-gray-50 p-3 rounded overflow-x-auto">{log.stack}</pre></div>}</div></Card></PageLayout></Fragment>;
}
export { SystemLogDetailPage };
export default SystemLogDetailPage;