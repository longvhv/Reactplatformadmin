/**
 * Data Cleanup Page
 * ✅ MIGRATED from /pages/tools/data-cleanup.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { dataCleanupApi } from '@/api/dataCleanupApi';
import { showToast } from '@/lib/toast';

function DataCleanupPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => { loadSuggestions(); }, []);
  const loadSuggestions = async () => { try { setLoading(true); const data = await dataCleanupApi.getSuggestions(); setSuggestions(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleCleanup = async (type: string) => {
    if (!confirm(`Are you sure you want to cleanup ${type}?`)) return;
    try {
      setCleaning(true);
      await dataCleanupApi.cleanup(type);
      showToast.success('Success', 'Cleanup completed');
      loadSuggestions();
    } catch (error: any) {
      showToast.error('Error', 'Failed to cleanup');
    } finally {
      setCleaning(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={Trash2} title="Data Cleanup" description="Clean up unused and orphaned data" actions={<Button onClick={loadSuggestions}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>}><Card className="p-6 mb-6 bg-yellow-50 border-yellow-200"><div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" /><div><h3 className="font-semibold text-yellow-900">Warning</h3><p className="text-sm text-yellow-800">Data cleanup operations are permanent and cannot be undone. Always backup your data before proceeding.</p></div></div></Card><div className="space-y-4">{suggestions.map((suggestion) => (<Card key={suggestion.type} className="p-6"><div className="flex items-center justify-between"><div className="flex-1"><h3 className="font-semibold mb-1">{suggestion.title}</h3><p className="text-sm text-gray-500 mb-2">{suggestion.description}</p><p className="text-sm font-medium text-red-600">{suggestion.count} items to cleanup</p></div><Button variant="destructive" onClick={() => handleCleanup(suggestion.type)} disabled={cleaning}><Trash2 className="w-4 h-4 mr-2" />Cleanup</Button></div></Card>))}</div></PageLayout></Fragment>;
}
export { DataCleanupPage };
export default DataCleanupPage;
