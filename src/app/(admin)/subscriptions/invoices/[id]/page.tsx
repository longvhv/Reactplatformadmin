/**
 * Invoice Detail Page  
 * Trang chi tiết hóa đơn đăng ký
 * ✅ MIGRATED from /pages/SubscriptionInvoiceDetailPage.tsx
 */
'use client';

import { Fragment, useState, useEffect } from 'react';

import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { showToast } from '../../../../../lib/toast';
import { InvoiceDetail } from '../../../../../components/invoices/InvoiceDetail';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../../../../../api/subscriptionInvoiceApi';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const data = await subscriptionInvoiceApi.getById(id);
        setInvoice(data);
      } catch (error: any) {
        console.error('Error fetching invoice:', error);
        showToast.error('Lỗi', 'Không thể tải thông tin invoice');
        router.push('/subscriptions/invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!invoice) {
    return null; // Handled by redirect in catch block
  }

  return (
    <PageLayout
      icon={FileText}
      title={`Invoice #${invoice.invoice_number}`}
      description="Chi tiết hóa đơn subscription"
      actions={
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto">
        <InvoiceDetail invoice={invoice} />
      </div>
    </PageLayout>
  );
}