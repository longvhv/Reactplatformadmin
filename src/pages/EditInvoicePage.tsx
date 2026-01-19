/**
 * Edit Invoice Page
 * Edit existing subscription invoice
 * ✅ Updated to use EnhancedInvoiceForm
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FileText } from 'lucide-react';
import { invoiceApi, Invoice } from '@/api/invoiceApi';
import { EnhancedInvoiceForm } from '@/components/invoices/EnhancedInvoiceForm';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function EditInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await invoiceApi.getById(id);
        if (data) {
          setInvoice(data);
        } else {
          showToast.error('Lỗi', 'Không tìm thấy hóa đơn');
          navigate('/commerce/subscription-invoices');
        }
      } catch (error: any) {
        console.error('Error fetching invoice:', error);
        showToast.error('Lỗi', 'Không thể tải hóa đơn: ' + error.message);
        navigate('/commerce/subscription-invoices');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await invoiceApi.update(id, data);
      showToast.success('Thành công', 'Đã cập nhật hóa đơn');
      navigate('/commerce/subscription-invoices');
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      showToast.error('Lỗi', 'Không thể cập nhật hóa đơn: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Hóa Đơn"
      description={`Cập nhật thông tin hóa đơn ${invoice.invoice_number}`}
      icon={FileText}
      backPath="/commerce/subscription-invoices"
      backLabel="Danh sách hóa đơn"
    >
      <EnhancedInvoiceForm 
        initialData={invoice}
        isEdit={true}
        onSubmit={handleSubmit} 
        loading={saving}
        onCancel={() => navigate('/commerce/subscription-invoices')}
      />
    </FormPageLayout>
  );
}
