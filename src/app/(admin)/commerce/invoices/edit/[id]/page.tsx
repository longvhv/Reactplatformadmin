/**
 * Invoices Edit Form
 * ✅ MIGRATED from /pages/commerce/invoices/edit/[id].tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '@/components/shim/next-navigation';
import { FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { invoicesApi } from '@/api/invoicesApi';
import { showToast } from '@/lib/toast';

function InvoicesEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [formData, setFormData] = useState({ invoice_number: '', amount: '', customer: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { const data = await invoicesApi.getById(id); setFormData(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await invoicesApi.update(id, formData);
      showToast.success('Success', 'Updated successfully');
      router.push('/commerce/invoices');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={FileText} title="Edit Invoice" description="Update invoice"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Invoice Number</label><Input value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Amount</label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Customer</label><Input value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} required /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/commerce/invoices')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { InvoicesEditPage };
export default InvoicesEditPage;
