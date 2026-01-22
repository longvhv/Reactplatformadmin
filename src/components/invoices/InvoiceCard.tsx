/**
 * InvoiceCard Component
 * Displays invoice in a card format for grid/list views
 * ✅ FIXED 2026-01-22: Changed react-router to Next.js navigation
 * ✅ FIXED 2026-01-22: Use helper functions for payment_status (computed field)
 * ✅ FIXED 2026-01-22: Use correct field names from schema
 */

import React from 'react';
import { useRouter } from '../../components/shim/next-navigation';
import { 
  FileText, Calendar, DollarSign, User, CreditCard, 
  Eye, Pencil, Trash2, AlertCircle 
} from 'lucide-react';
import { SubscriptionInvoice } from '../../api/subscriptionInvoiceApi';
import { 
  getPaymentStatusBadge, 
  getStatusBadge, 
  getCustomerName, 
  getCustomerEmail,
  getCustomerPhone,
  formatCurrency,
  formatDate,
  isInvoiceOverdue
} from '../../utils/invoiceHelpers';
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
  const router = useRouter();
  const { t } = useLanguage();

  // ✅ Use helper functions for computed values
  const statusBadge = getStatusBadge(invoice.status);
  const paymentBadge = getPaymentStatusBadge(invoice);
  const customerName = getCustomerName(invoice);
  const customerEmail = getCustomerEmail(invoice);
  const customerPhone = getCustomerPhone(invoice);
  const overdue = isInvoiceOverdue(invoice);

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
                {/* ✅ FIX: invoice_date doesn't exist, use created_at */}
                {formatDate(invoice.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <Badge className={statusBadge.color}>
              {statusBadge.label}
            </Badge>
            {overdue && (
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
              {customerName}
            </p>
            <p className="text-xs text-gray-500 truncate">{customerEmail}</p>
            {customerPhone !== '-' && (
              <p className="text-xs text-gray-500">{customerPhone}</p>
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
              {/* ✅ FIX: currency → currency_code */}
              {formatCurrency(invoice.total_amount, invoice.currency_code)}
            </span>
          </div>

          {invoice.amount_paid > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{t('invoices.amountPaid')}</span>
              <span className="text-green-600 font-medium">
                {formatCurrency(invoice.amount_paid, invoice.currency_code)}
              </span>
            </div>
          )}

          {invoice.amount_due > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{t('invoices.amountDue')}</span>
              <span className="text-red-600 font-medium">
                {formatCurrency(invoice.amount_due, invoice.currency_code)}
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
            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {formatDate(invoice.due_date)}
            </span>
          </div>

          {/* ✅ FIX: paid_date → paid_at */}
          {invoice.paid_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{t('invoices.paidDate')}</span>
              <span className="text-green-600 font-medium">
                {formatDate(invoice.paid_at)}
              </span>
            </div>
          )}
        </div>

        {/* Payment Info */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <Badge className={paymentBadge.color}>
              {paymentBadge.label}
            </Badge>
            {/* ✅ FIX: payment_method in metadata JSONB */}
            {invoice.metadata?.payment_method && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CreditCard className="h-3 w-3" />
                {invoice.metadata.payment_method}
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
              onClick={() => router.push(`/commerce/subscription-invoices/${invoice._id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('common.viewDetails')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/commerce/subscription-invoices/edit/${invoice._id}`)}
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
        {invoice.metadata?.notes && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            <p className="line-clamp-2">{invoice.metadata.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;
