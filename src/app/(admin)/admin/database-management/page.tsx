/**
 * Database Management Page
 * ✅ MIGRATED from /pages/admin/database-management.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { Database, Activity } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { databaseApi } from '../../../../api/databaseApi';
import { showToast } from '../../../../lib/toast';

function DatabaseManagementPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => { loadStats(); }, []);
  const loadStats = async () => { try { setLoading(true); const data = await databaseApi.getStats(); setStats(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      await databaseApi.optimize();
      showToast.success('Success', 'Database optimized');
      loadStats();
    } catch (error: any) {
      showToast.error('Error', 'Failed to optimize');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={Database} title="Database Management" description="Manage database operations and optimization" actions={<div className="flex gap-2"><Button onClick={loadStats}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button><Button onClick={handleOptimize} disabled={optimizing}><Zap className="w-4 h-4 mr-2" />{optimizing ? 'Optimizing...' : 'Optimize'}</Button></div>}><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"><Card className="p-6"><div><p className="text-sm text-gray-500">Total Records</p><p className="text-2xl font-bold">{stats?.totalRecords || 0}</p></div></Card><Card className="p-6"><div><p className="text-sm text-gray-500">Database Size</p><p className="text-2xl font-bold">{stats?.size || '0 MB'}</p></div></Card><Card className="p-6"><div><p className="text-sm text-gray-500">Collections</p><p className="text-2xl font-bold">{stats?.collections || 0}</p></div></Card></div><Card className="p-6"><h3 className="text-lg font-semibold mb-4">Collection Statistics</h3><div className="space-y-3">{(stats?.collectionStats || []).map((coll: any, idx: number) => (<div key={idx} className="flex items-center justify-between p-3 border rounded"><div><p className="font-medium">{coll.name}</p><p className="text-sm text-gray-500">{coll.count} documents</p></div><p className="text-sm text-gray-500">{coll.size}</p></div>))}</div></Card></PageLayout></Fragment>;
}
export { DatabaseManagementPage };
export default DatabaseManagementPage;