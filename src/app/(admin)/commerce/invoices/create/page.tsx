/**
 * Invoice Create Page
 * ✅ MIGRATED from /pages/commerce/invoices/create.tsx
 */
'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Receipt } from 'lucide-react';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { EnhancedInvoiceForm } from '../../../../../components/invoices/EnhancedInvoiceForm';
import { invoiceApi, CreateInvoiceRequest } from '../../../../../api/invoiceApi';
import { showToast } from '../../../../../lib/toast';

function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await invoiceApi.create(data as CreateInvoiceRequest);
      showToast.success('Thành công', 'Đã tạo hóa đơn mới');
      router.push('/commerce/invoices');
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      throw error; // Let form handle error display if needed, but form already shows toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <PageLayout
        icon={Receipt}
        title="Tạo hóa đơn mới"
        description="Tạo hóa đơn thủ công cho khách hàng"
      >
        <EnhancedInvoiceForm 
          onSubmit={handleSubmit}
          loading={loading}
          onCancel={() => router.push('/commerce/invoices')}
        />
      </PageLayout>
    </Fragment>
  );
}

export default CreateInvoicePage;