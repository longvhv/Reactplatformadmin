/**
 * InvoiceCard Component
 * Displays invoice in a card format for grid/list views
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { 
  FileText, Calendar, DollarSign, User, CreditCard, 
  Eye, Pencil, Trash2, AlertCircle 
} from 'lucide-react';
import { SubscriptionInvoice, InvoiceStatus, PaymentStatus } from '../../api/subscriptionInvoiceApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useLanguage } from '../../providers/LanguageProvider';

interface InvoiceCardProps {
  invoice: SubscriptionInvoice;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onDelete,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getStatusConfig = (status: InvoiceStatus) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-800', label: t('invoices.status.draft') },
      sent: { color: 'bg-blue-100 text-blue-800', label: t('invoices.status.sent') },
      paid: { color: 'bg-green-100 text-green-800', label: t('invoices.status.paid') },
      overdue: { color: 'bg-red-100 text-red-800', label: t('invoices.status.overdue') },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: t('invoices.status.cancelled') },
      refunded: { color: 'bg-purple-100 text-purple-800', label: t('invoices.status.refunded') },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', label: t('invoices.status.partiallyPaid') },
    };
    return configs[status];
  };

  const getPaymentStatusConfig = (status: PaymentStatus) => {
    const configs = {
      unpaid: { color: 'bg-red-100 text-red-800', label: t('invoices.paymentStatus.unpaid') },
      paid: { color: 'bg-green-100 text-green-800', label: t('invoices.paymentStatus.paid') },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', label: t('invoices.paymentStatus.partiallyPaid') },
      refunded: { color: 'bg-purple-100 text-purple-800', label: t('invoices.paymentStatus.refunded') },
      failed: { color: 'bg-red-100 text-red-800', label: t('invoices.paymentStatus.failed') },
    };
    return configs[status];
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

  const isOverdue = () => {
    return new Date(invoice.due_date) < new Date() && 
           invoice.payment_status !== 'paid' && 
           invoice.status !== 'cancelled';
  };

  const statusConfig = getStatusConfig(invoice.status);
  const paymentConfig = getPaymentStatusConfig(invoice.payment_status);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {invoice.invoice_number}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(invoice.invoice_date)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            {isOverdue() && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs font-medium">{t('invoices.overdue')}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="flex items-start gap-2 pb-3 border-b border-gray-100">
          <User className="h-4 w-4 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {invoice.customer_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{invoice.customer_email}</p>
            {invoice.customer_phone && (
              <p className="text-xs text-gray-500">{invoice.customer_phone}</p>
            )}
          </div>
        </div>

        {/* Financial Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">{t('invoices.totalAmount')}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </span>
          </div>

          {invoice.amount_paid > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{t('invoices.amountPaid')}</span>
              <span className="text-green-600 font-medium">
                {formatCurrency(invoice.amount_paid, invoice.currency)}
              </span>
            </div>
          )}

          {invoice.amount_due > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{t('invoices.amountDue')}</span>
              <span className="text-red-600 font-medium">
                {formatCurrency(invoice.amount_due, invoice.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t('invoices.dueDate')}</span>
            </div>
            <span className={isOverdue() ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {formatDate(invoice.due_date)}
            </span>
          </div>

          {invoice.paid_date && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{t('invoices.paidDate')}</span>
              <span className="text-green-600 font-medium">
                {formatDate(invoice.paid_date)}
              </span>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <Badge className={paymentConfig.color}>
              {paymentConfig.label}
            </Badge>
            {invoice.payment_method && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CreditCard className="h-3 w-3" />
                {invoice.payment_method}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/core/subscription-invoices/${invoice._id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('common.viewDetails')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/core/subscription-invoices/edit/${invoice._id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(invoice._id!)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Notes preview */}
        {invoice.notes && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            <p className="line-clamp-2">{invoice.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;