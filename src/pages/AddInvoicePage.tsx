/**
 * Add Invoice Page
 * Page for creating new invoices
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../api/subscriptionInvoiceApi';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
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
        setLoading(false);
        return;
      }

      await subscriptionInvoiceApi.create(data);
      toast.success(t('invoices.createSuccess'));
      navigate('/core/invoices');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || t('invoices.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/invoices');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/core/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('invoices.addInvoice')}</h1>
          <p className="text-gray-500 mt-1">{t('invoices.addInvoiceDescription')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl">
        <InvoiceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AddInvoicePage;
