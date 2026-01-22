/**
 * Invoices Add Form
 * ✅ MIGRATED from /pages/commerce/invoices/add.tsx
 */
'use client';
import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { DollarSign, Plus } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { invoicesApi } from '../../../../../api/invoicesApi';
import { showToast } from '../../../../../lib/toast';

function AddInvoicePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ invoice_number: '', amount: '', customer: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await invoicesApi.create(formData);
      showToast.success('Success', 'Created successfully');
      router.push('/commerce/invoices');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return <Fragment><PageLayout icon={DollarSign} title="Add Invoice" description="Create new invoice"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Invoice Number</label><Input value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Amount</label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Customer</label><Input value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} required /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={loading}><Plus className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/commerce/invoices')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { AddInvoicePage };
export default AddInvoicePage;