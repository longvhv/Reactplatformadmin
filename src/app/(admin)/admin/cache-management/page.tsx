/**
 * Cache Management Page
 * ✅ MIGRATED from /pages/admin/cache-management.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { Zap, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { cacheApi } from '../../../../api/cacheApi';
import { showToast } from '../../../../lib/toast';

function CacheManagementPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => { try { setLoading(true); const data = await cacheApi.getStats(); setStats(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cache?')) return;
    try {
      setClearing(true);
      await cacheApi.clear();
      showToast.success('Success', 'Cache cleared');
      loadStats();
    } catch (error: any) {
      showToast.error('Error', 'Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={Zap} title="Cache Management" description="Manage application cache" actions={<div className="flex gap-2"><Button onClick={loadStats}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button><Button variant="destructive" onClick={handleClearCache} disabled={clearing}><Trash2 className="w-4 h-4 mr-2" />{clearing ? 'Clearing...' : 'Clear Cache'}</Button></div>}><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"><Card className="p-6"><div><p className="text-sm text-gray-500">Cache Size</p><p className="text-2xl font-bold">{stats?.size || '0 MB'}</p></div></Card><Card className="p-6"><div><p className="text-sm text-gray-500">Cache Entries</p><p className="text-2xl font-bold">{stats?.entries || 0}</p></div></Card><Card className="p-6"><div><p className="text-sm text-gray-500">Hit Rate</p><p className="text-2xl font-bold">{stats?.hitRate || 0}%</p></div></Card></div><Card className="p-6"><h3 className="text-lg font-semibold mb-4">Cache Keys</h3><div className="space-y-2 max-h-[400px] overflow-y-auto">{(stats?.keys || []).map((key: any, idx: number) => (<div key={idx} className="flex items-center justify-between p-3 border rounded"><div><p className="font-medium font-mono text-sm">{key.name}</p><p className="text-xs text-gray-500">Size: {key.size} • TTL: {key.ttl}s</p></div></div>))}</div></Card></PageLayout></Fragment>;
}
export { CacheManagementPage };
export default CacheManagementPage;