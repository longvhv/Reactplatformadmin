/**
 * InvoiceTable Component
 * Displays invoices in a table format with full CRUD operations
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Eye, Pencil, Trash2, Send, DollarSign, 
  Calendar, CreditCard, AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';
import { SubscriptionInvoice, InvoiceStatus, PaymentStatus } from '../../api/subscriptionInvoiceApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../providers/LanguageProvider';

interface InvoiceTableProps {
  invoices: SubscriptionInvoice[];
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, status: InvoiceStatus) => void;
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

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: t('invoices.status.draft') },
      sent: { color: 'bg-blue-100 text-blue-800', label: t('invoices.status.sent') },
      paid: { color: 'bg-green-100 text-green-800', label: t('invoices.status.paid') },
      overdue: { color: 'bg-red-100 text-red-800', label: t('invoices.status.overdue') },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: t('invoices.status.cancelled') },
      refunded: { color: 'bg-purple-100 text-purple-800', label: t('invoices.status.refunded') },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', label: t('invoices.status.partiallyPaid') },
    };
    const config = statusConfig[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      unpaid: { color: 'bg-red-100 text-red-800', label: t('invoices.paymentStatus.unpaid'), icon: XCircle },
      paid: { color: 'bg-green-100 text-green-800', label: t('invoices.paymentStatus.paid'), icon: CheckCircle },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', label: t('invoices.paymentStatus.partiallyPaid'), icon: AlertCircle },
      refunded: { color: 'bg-purple-100 text-purple-800', label: t('invoices.paymentStatus.refunded'), icon: AlertCircle },
      failed: { color: 'bg-red-100 text-red-800', label: t('invoices.paymentStatus.failed'), icon: XCircle },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

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
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(invoice.invoice_date)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{invoice.customer_name}</div>
                  <div className="text-xs text-gray-500">{invoice.customer_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">
                        {t('invoices.due')}: {formatDate(invoice.due_date)}
                      </div>
                      {invoice.paid_date && (
                        <div className="text-xs text-green-600">
                          {t('invoices.paid')}: {formatDate(invoice.paid_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </div>
                  {invoice.amount_due > 0 && (
                    <div className="text-xs text-red-600">
                      {t('invoices.due')}: {formatCurrency(invoice.amount_due, invoice.currency)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPaymentStatusBadge(invoice.payment_status)}
                  {invoice.payment_method && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {invoice.payment_method}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/core/subscription-invoices/${invoice._id}`)}
                      title={t('common.viewDetails')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/core/subscription-invoices/edit/${invoice._id}`)}
                      title={t('common.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {invoice.status === 'draft' && onStatusChange && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStatusChange(invoice._id!, 'sent')}
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