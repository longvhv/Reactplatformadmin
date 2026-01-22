/**
 * Invoice Edit Page
 * ✅ MIGRATED from /pages/commerce/invoices/edit/[id].tsx
 * ✅ FIXED: Import paths corrected to 6 levels (path has 7 slashes) - ACTUALLY CORRECTED NOW
 */
'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Receipt, Loader2 } from 'lucide-react';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { EnhancedInvoiceForm } from '../../../../../../components/invoices/EnhancedInvoiceForm';
import { invoiceApi, UpdateInvoiceRequest, Invoice } from '../../../../../../api/invoiceApi';
import { showToast } from '../../../../../../lib/toast';

function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const data = await invoiceApi.getById(id);
      setInvoice(data);
    } catch (error: any) {
      console.error('Failed to load invoice:', error);
      showToast.error('Lỗi', 'Không thể tải thông tin hóa đơn');
      router.push('/commerce/subscription-invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSaving(true);
      await invoiceApi.update(id, data as UpdateInvoiceRequest);
      showToast.success('Thành công', 'Đã cập nhật hóa đơn');
      router.push('/commerce/subscription-invoices');
    } catch (error: any) {
      console.error('Failed to update invoice:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return null; // Should redirect in useEffect
  }

  return (
    <Fragment>
      <PageLayout
        icon={Receipt}
        title={`Cập nhật hóa đơn: ${invoice.invoice_number}`}
        description="Chỉnh sửa thông tin hóa đơn"
      >
        <EnhancedInvoiceForm 
          initialData={invoice}
          isEdit={true}
          onSubmit={handleSubmit}
          loading={saving}
          onCancel={() => router.push('/commerce/subscription-invoices')}
        />
      </PageLayout>
    </Fragment>
  );
}

export { EditInvoicePage };
export default EditInvoicePage;