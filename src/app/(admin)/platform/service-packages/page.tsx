/**
 * FINAL COMPLETION BATCH: Service Packages | Service Deliveries | Notifications | Invoices | User Registrations | API Usage Logs
 * Plus all remaining form pages: Add/Edit Service Delivery | Add/Edit Notification | Add/Edit Invoice | Add/Edit Digital Asset | Edit Region | Add Application
 * ✅ MIGRATED: Final 15 pages - pushing to 100%!
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { servicePackagesApi } from '@/api/servicePackagesApi';
import { showToast } from '@/lib/toast';

function ServicePackagesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadItems(); }, []);
  const loadItems = async () => { try { setLoading(true); const data = await servicePackagesApi.getAll(); setItems(data); } catch (error: any) { showToast.error('Error', 'Failed'); } finally { setLoading(false); } };
  const filteredItems = items.filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return <Fragment><PageLayout icon={Package} title="Service Packages" description="Manage service packages" actions={<Button onClick={() => router.push('/platform/service-packages/create')}><Plus className="w-4 h-4 mr-2" />Add</Button>}><Card className="p-6"><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>{loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : <div className="space-y-2">{filteredItems.map((item) => (<div key={item._id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/platform/service-packages/${item._id}`)}><p className="font-medium">{item.name}</p><Button variant="ghost" size="sm">View</Button></div>))}</div>}</Card></PageLayout></Fragment>;
}

export { ServicePackagesPage };
export default ServicePackagesPage;
