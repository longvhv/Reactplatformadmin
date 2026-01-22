/**
 * System Logs Page
 * ✅ MIGRATED from /pages/admin/system-logs.tsx
 */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { FileText, Search, Download } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { systemLogsApi } from '../../../../api/systemLogsApi';
import { showToast } from '../../../../lib/toast';

function SystemLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadLogs(); }, []);
  const loadLogs = async () => { try { setLoading(true); const data = await systemLogsApi.getAll(); setLogs(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };
  const filteredLogs = logs.filter(log => log.message?.toLowerCase().includes(searchTerm.toLowerCase()));

  return <Fragment><PageLayout icon={FileText} title="System Logs" description="View system logs and activity" actions={<Button onClick={loadLogs}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>}><Card className="p-6"><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>{loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : <div className="space-y-2 max-h-[600px] overflow-y-auto">{filteredLogs.map((log) => (<div key={log._id} className="p-3 border rounded font-mono text-xs bg-gray-50 hover:bg-gray-100" onClick={() => router.push(`/admin/system-logs/${log._id}`)}><div className="flex items-center justify-between mb-1"><span className={`px-2 py-1 rounded text-xs font-semibold ${log.level === 'error' ? 'bg-red-100 text-red-800' : log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{log.level}</span><span className="text-gray-500">{new Date(log.timestamp).toLocaleString()}</span></div><p className="text-gray-800">{log.message}</p></div>))}</div>}</Card></PageLayout></Fragment>;
}
export { SystemLogsPage };
export default SystemLogsPage;