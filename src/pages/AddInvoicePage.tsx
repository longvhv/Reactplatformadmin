/**
 * Add Invoice Page
 * Create new subscription invoice
 * ✅ Updated to use EnhancedInvoiceForm
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText } from 'lucide-react';
import { invoiceApi, CreateInvoiceRequest } from '@/api/invoiceApi';
import { EnhancedInvoiceForm } from '@/components/invoices/EnhancedInvoiceForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function AddInvoicePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateInvoiceRequest | any) => {
    setLoading(true);
    try {
      await invoiceApi.create(data);
      showToast.success('Thành công', 'Đã tạo hóa đơn mới');
      navigate('/commerce/subscription-invoices');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      showToast.error('Lỗi', 'Không thể tạo hóa đơn: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Hóa Đơn"
      description="Tạo hóa đơn thanh toán cho khách hàng"
      icon={FileText}
      backPath="/commerce/subscription-invoices"
      backLabel="Danh sách hóa đơn"
    >
      <EnhancedInvoiceForm 
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => navigate('/commerce/subscription-invoices')}
      />
    </FormPageLayout>
  );
}
