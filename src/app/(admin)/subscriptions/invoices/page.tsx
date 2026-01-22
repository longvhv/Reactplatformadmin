/**
 * Subscription Invoices List Page
 * 
 * ✅ REWRITTEN 2026-01-21: 
 * - Integrates with shared InvoiceTable
 * - Uses subscriptionInvoiceApi for data fetching
 * - Fully typed with schema support
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { showToast } from '@/lib/toast';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '@/api/subscriptionInvoiceApi';

export default function SubscriptionInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await subscriptionInvoiceApi.getAll();
      setInvoices(data);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id: string) => {
    try {
        // User ID should be retrieved from auth context in real app
        // Using placeholder for now as per task scope
        const currentUserId = 'user-placeholder'; 
        await subscriptionInvoiceApi.softDelete(id, currentUserId); 
        showToast.success('Thành công', 'Đã xóa invoice');
        
        // Optimistic update or refetch
        setInvoices(prev => prev.filter(i => i._id !== id));
    } catch (error) {
        showToast.error('Lỗi', 'Không thể xóa invoice');
    }
  };

  const handleStatusChange = async (id: string, status: SubscriptionInvoice['status']) => {
      try {
          const invoice = invoices.find(i => i._id === id);
          if (!invoice) return;

          // Optimistic Locking: pass version
          await subscriptionInvoiceApi.changeStatus(id, status, invoice.version);
          
          showToast.success('Thành công', 'Đã cập nhật trạng thái');
          fetchInvoices(); // Refetch to get updated version and data
      } catch (error) {
          showToast.error('Lỗi', 'Không thể cập nhật trạng thái');
      }
  }

  return (
    <PageLayout
      icon={FileText}
      title="Subscription Invoices"
      description="Quản lý hóa đơn subscription và thanh toán"
      actions={
        <Button onClick={() => router.push('/subscriptions/invoices/add')} className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo Invoice
        </Button>
      }
    >
      <InvoiceTable 
        invoices={invoices} 
        loading={loading} 
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </PageLayout>
  );
}