/**
 * Integrations List Page
 * ✅ MIGRATED from /pages/platform/integrations.tsx
 */
'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Plug, Plus, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { integrationsApi } from '../../../../api/integrationsApi';
import { showToast } from '../../../../lib/toast';

function IntegrationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadItems(); }, []);
  const loadItems = async () => { try { setLoading(true); const data = await integrationsApi.getAll(); setItems(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };
  const filteredItems = items.filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return <Fragment><PageLayout icon={Plug} title="Integrations" description="Manage third-party integrations" actions={<Button onClick={() => router.push('/platform/integrations/add')}><Plus className="w-4 h-4 mr-2" />Add</Button>}><Card className="p-6"><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>{loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredItems.map((item) => (<Card key={item._id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/platform/integrations/${item._id}`)}><div className="flex items-center gap-3 mb-2"><Plug className="w-8 h-8 text-indigo-600" /><div><p className="font-medium">{item.name}</p><p className="text-xs text-gray-500">{item.status}</p></div></div><p className="text-sm text-gray-600">{item.description}</p></Card>))}</div>}</Card></PageLayout></Fragment>;
}
export { IntegrationsPage };
export default IntegrationsPage;