/**
 * Invoices Create Form
 * ✅ MIGRATED from /pages/commerce/invoices/add.tsx
 * ✅ FIXED: Import paths corrected to 5 levels (path has 6 slashes)
 * ✅ FIXED: Use InvoiceForm component
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { FileText } from 'lucide-react';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { InvoiceForm } from '../../../../../components/invoices/InvoiceForm';
import { subscriptionInvoiceApi, Invoice } from '../../../../../api/subscriptionInvoiceApi';
import { showToast } from '../../../../../lib/toast';

function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Omit<Invoice, '_id' | 'created_at' | 'updated_at' | 'version'>) => {
    try {
      setLoading(true);
      // CreateInvoiceRequest is compatible with the data from form
      await subscriptionInvoiceApi.create(data);
      showToast.success('Success', 'Invoice created successfully');
      router.push('/commerce/subscription-invoices');
    } catch (error: any) {
      console.error('Create invoice error:', error);
      showToast.error('Error', error.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/commerce/subscription-invoices');
  };

  return (
    <PageLayout 
      icon={FileText} 
      title="Create Invoice" 
      description="Create a new subscription invoice"
    >
      <div className="max-w-5xl mx-auto">
        <InvoiceForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}

export { CreateInvoicePage };
export default CreateInvoicePage;
