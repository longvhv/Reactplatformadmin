/**
 * Audit Trail Detail Page
 * ✅ MIGRATED from /pages/admin/audit-trail/[id].tsx
 */
'use client';
import { useState, useEffect } from 'react';
import { useParams } from '../../../../../components/shim/next-navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { auditTrailApi } from '../../../../../api/auditTrailApi';
import { showToast } from '../../../../../lib/toast';

function AuditTrailDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadItem(); }, [id]);
  const loadItem = async () => { try { const data = await auditTrailApi.getById(id); setItem(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!item) return <div className="text-center py-12">Not found</div>;

  return <Fragment><PageLayout icon={FileSearch} title="Audit Details" description="View audit trail details"><Card className="p-6"><div className="space-y-4"><div><h3 className="font-semibold mb-2">Action</h3><p className="text-gray-700">{item.action}</p></div><div><h3 className="font-semibold mb-2">User</h3><p className="text-gray-700">{item.user}</p></div><div><h3 className="font-semibold mb-2">Timestamp</h3><p className="text-gray-700">{new Date(item.timestamp).toLocaleString()}</p></div><div><h3 className="font-semibold mb-2">IP Address</h3><p className="text-gray-700 font-mono">{item.ip_address}</p></div>{item.details && <div><h3 className="font-semibold mb-2">Details</h3><pre className="text-gray-700 font-mono text-sm bg-gray-50 p-3 rounded overflow-x-auto">{JSON.stringify(item.details, null, 2)}</pre></div>}</div></Card></PageLayout></Fragment>;
}
export { AuditTrailDetailPage };
export default AuditTrailDetailPage;