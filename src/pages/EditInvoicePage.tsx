/**
 * Edit Invoice Page
 * Page for editing existing invoices
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../api/subscriptionInvoiceApi';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { Button } from '../components/ui/button';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export const EditInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    
    try {
      setLoadingData(true);
      const data = await subscriptionInvoiceApi.getById(id);
      if (data) {
        setInvoice(data);
      } else {
        toast.error(t('invoices.errors.notFound'));
        navigate('/core/invoices');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error(t('invoices.errors.loadFailed'));
      navigate('/core/invoices');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (data: Omit<SubscriptionInvoice, '_id' | 'created_at' | 'updated_at' | 'version'>) => {
    if (!invoice || !id) return;
    
    try {
      setLoading(true);
      
      // Check if invoice number changed and already exists
      if (data.invoice_number !== invoice.invoice_number) {
        const exists = await subscriptionInvoiceApi.numberExists(
          data.invoice_number,
          data.tenant_id,
          id
        );
        
        if (exists) {
          toast.error(t('invoices.errors.invoiceNumberExists'));
          setLoading(false);
          return;
        }
      }

      await subscriptionInvoiceApi.update(id, data, invoice.version || 1);
      toast.success(t('invoices.updateSuccess'));
      navigate(`/core/invoices/${id}`);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast.error(error.message || t('invoices.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/core/invoices/${id}`);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900">{t('invoices.errors.notFound')}</h3>
          <div className="mt-6">
            <Button onClick={() => navigate('/core/invoices')}>
              {t('common.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/core/invoices/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('invoices.editInvoice')}</h1>
          <p className="text-gray-500 mt-1">
            {invoice.invoice_number} - {t('invoices.editInvoiceDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl">
        <InvoiceForm
          initialData={invoice}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default EditInvoicePage;
