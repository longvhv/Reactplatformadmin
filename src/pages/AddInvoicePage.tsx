/**
 * Add Invoice Page
 * Page for creating new invoices
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText } from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../api/subscriptionInvoiceApi';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export const AddInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Omit<SubscriptionInvoice, '_id' | 'created_at' | 'updated_at' | 'version'>) => {
    try {
      setLoading(true);
      
      // Check if invoice number already exists
      const exists = await subscriptionInvoiceApi.numberExists(
        data.invoice_number,
        data.tenant_id
      );
      
      if (exists) {
        toast.error(t('invoices.errors.invoiceNumberExists'));
        throw new Error('Invoice number exists');
      }

      await subscriptionInvoiceApi.create(data);
      toast.success(t('invoices.createSuccess'));
      navigate('/core/subscription-invoices');
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/subscription-invoices');
  };

  return (
    <FormPageLayout
      mode="add"
      title={t('invoices.addInvoice')}
      description={t('invoices.addInvoiceDescription')}
      icon={FileText}
      backPath="/core/subscription-invoices"
      backLabel={t('common.backToList')}
    >
      <InvoiceForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </FormPageLayout>
  );
};

export default AddInvoicePage;