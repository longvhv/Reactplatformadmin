/**
 * Edit Invoice Page
 * Form to update existing subscription invoice with optimistic locking
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FileText, RefreshCw } from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../api/subscriptionInvoiceApi';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { toast } from 'sonner@2.0.3';

export default function EditInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null);

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoadingInvoice(true);
      const data = await subscriptionInvoiceApi.getById(invoiceId);
      setInvoice(data);
    } catch (error: any) {
      toast.error('Không thể tải hóa đơn: ' + error.message);
      navigate('/core/subscription-invoices');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleSubmit = async (data: Omit<SubscriptionInvoice, '_id' | 'created_at' | 'updated_at' | 'version'>) => {
    if (!id || !invoice) return;

    try {
      setLoading(true);
      await subscriptionInvoiceApi.update(id, {
        ...data,
        version: invoice.version,
      });
      toast.success('Cập nhật hóa đơn thành công!');
      navigate('/core/subscription-invoices');
    } catch (error: any) {
      if (error.message.includes('Version conflict') || error.message.includes('409')) {
        toast.error('Hóa đơn đã được cập nhật bởi người khác. Đang tải lại...');
        if (id) loadInvoice(id);
      } else {
        toast.error('Không thể cập nhật hóa đơn: ' + error.message);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa hóa đơn"
      description={`Cập nhật thông tin hóa đơn #${invoice.invoice_number}`}
      icon={FileText}
      backPath="/core/subscription-invoices"
      backLabel="Quay lại danh sách"
    >
      <InvoiceForm
        initialData={invoice}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/core/subscription-invoices')}
        loading={loading}
      />
    </FormPageLayout>
  );
}