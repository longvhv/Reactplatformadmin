/**
 * InvoiceTable Component
 * Displays invoices in a table format with full CRUD operations
 * ✅ Schema compatible: subscriptionInvoiceApi is alias to invoiceApi
 * ✅ FIXED 2026-01-15: Use helper functions for payment status (derived field)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  FileText, Pencil, Trash2, Send, DollarSign, 
  Calendar, CreditCard, AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';
import { SubscriptionInvoice } from '../../api/subscriptionInvoiceApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../providers/LanguageProvider';
import { 
  getPaymentStatusBadge, 
  getStatusBadge, 
  getCustomerName, 
  getCustomerEmail,
  formatCurrency,
  formatDate
} from '../../utils/invoiceHelpers';

interface InvoiceTableProps {
  invoices: SubscriptionInvoice[];
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: SubscriptionInvoice['status']) => void;
  loading?: boolean;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onDelete,
  onStatusChange,
  loading = false,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('invoices.noInvoices')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('invoices.noInvoicesDescription')}</p>
        <div className="mt-6">
          <Button onClick={() => navigate('/core/subscription-invoices/add')}>
            {t('invoices.addInvoice')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoices.invoiceNumber')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoices.customer')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoices.dates')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoices.amount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('invoices.payment')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                    <div>
                      <button
                        onClick={() => navigate(`/core/subscription-invoices/${invoice._id}`)}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {invoice.invoice_number}
                      </button>
                      <div className="text-xs text-gray-500">
                        {/* ✅ FIX: invoice_date doesn't exist, use created_at */}
                        {formatDate(invoice.created_at)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {/* ✅ FIX: Use billing_info JSONB structure */}
                  <div className="text-sm text-gray-900">{getCustomerName(invoice)}</div>
                  <div className="text-xs text-gray-500">{getCustomerEmail(invoice)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {t('invoices.due')}: {formatDate(invoice.due_date)}
                      </div>
                      {/* ✅ FIX: paid_date → paid_at */}
                      {invoice.paid_at && (
                        <div className="text-xs text-green-600">
                          {t('invoices.paid')}: {formatDate(invoice.paid_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {/* ✅ FIX: currency → currency_code */}
                    {formatCurrency(invoice.total_amount, invoice.currency_code)}
                  </div>
                  {invoice.amount_due > 0 && (
                    <div className="text-xs text-red-600">
                      {/* ✅ FIX: currency → currency_code */}
                      {t('invoices.due')}: {formatCurrency(invoice.amount_due, invoice.currency_code)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* ✅ FIX: Use helper function, returns Badge component */}
                  <Badge className={getStatusBadge(invoice.status).color}>
                    {getStatusBadge(invoice.status).label}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* ✅ FIX: payment_status is derived, use helper */}
                  {(() => {
                    const badge = getPaymentStatusBadge(invoice);
                    return (
                      <Badge className={badge.color}>
                        {badge.label}
                      </Badge>
                    );
                  })()}
                  {/* ✅ FIX: payment_method in metadata JSONB */}
                  {invoice.metadata?.payment_method && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {invoice.metadata.payment_method}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/core/subscription-invoices/edit/${invoice._id}`)}
                      title={t('common.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {/* ✅ FIX: Status must be UPPERCASE */}
                    {invoice.status === 'DRAFT' && onStatusChange && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStatusChange(invoice._id!, 'OPEN')}
                        title={t('invoices.sendInvoice')}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(invoice._id!)}
                      className={deleteConfirmId === invoice._id ? 'text-red-600' : ''}
                      title={deleteConfirmId === invoice._id ? t('invoices.confirmDelete') : t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;