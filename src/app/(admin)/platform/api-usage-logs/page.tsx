/**
 * API Usage Logs - Final list page
 * ✅ MIGRATED: Completion approaching
 */
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Activity, Search, Download } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { apiUsageLogsApi } from '../../../../../api/apiUsageLogsApi';
import { showToast } from '../../../../../lib/toast';

function ApiUsageLogsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadItems(); }, []);
  const loadItems = async () => { try { setLoading(true); const data = await apiUsageLogsApi.getAll(); setItems(data); } catch (error: any) { showToast.error('Error', 'Failed'); } finally { setLoading(false); } };
  const filteredItems = items.filter(item => item.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()));

  return <><PageLayout icon={Activity} title="API Usage Logs" description="Monitor API usage" actions={<div />}><Card className="p-6"><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>{loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : <div className="space-y-2">{filteredItems.map((item) => (<div key={item._id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/platform/api-usage-logs/${item._id}`)}><p className="font-medium font-mono text-sm">{item.endpoint}</p><Button variant="ghost" size="sm">View</Button></div>))}</div>}</Card></PageLayout></>;
}
export { ApiUsageLogsPage };
export default ApiUsageLogsPage;