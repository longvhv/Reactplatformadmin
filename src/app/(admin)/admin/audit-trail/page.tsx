/**
 * Audit Trail Page
 * ✅ MIGRATED from /pages/admin/audit-trail.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { FileSearch, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { auditTrailApi } from '@/api/auditTrailApi';
import { showToast } from '@/lib/toast';

function AuditTrailPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadItems(); }, []);
  const loadItems = async () => { try { setLoading(true); const data = await auditTrailApi.getAll(); setItems(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };
  const filteredItems = items.filter(item => item.action?.toLowerCase().includes(searchTerm.toLowerCase()) || item.user?.toLowerCase().includes(searchTerm.toLowerCase()));

  return <Fragment><PageLayout icon={FileSearch} title="Audit Trail" description="View system audit trail and user actions"><Card className="p-6"><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search audits..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>{loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : <div className="space-y-2">{filteredItems.map((item) => (<div key={item._id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/audit-trail/${item._id}`)}><div className="flex-1"><p className="font-medium">{item.action}</p><p className="text-sm text-gray-500">By {item.user} • {new Date(item.timestamp).toLocaleString()}</p></div><Button variant="ghost" size="sm">View</Button></div>))}</div>}</Card></PageLayout></Fragment>;
}
export { AuditTrailPage };
export default AuditTrailPage;
