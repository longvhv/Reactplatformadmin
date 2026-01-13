/**
 * Invoice Detail Page
 * Displays detailed information about a single invoice
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Send, DollarSign, 
  Download, Calendar, User, CreditCard, FileText 
} from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../api/subscriptionInvoiceApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [invoice, setInvoice] = useState<SubscriptionInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await subscriptionInvoiceApi.getById(id);
      if (data) {
        setInvoice(data);
      } else {
        toast.error(t('invoices.errors.notFound'));
        navigate('/core/subscription-invoices');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error(t('invoices.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice || !confirm(t('invoices.confirmDeleteMessage'))) return;
    
    try {
      await subscriptionInvoiceApi.softDelete(invoice._id!, 'current-user');
      toast.success(t('invoices.deleteSuccess'));
      navigate('/core/subscription-invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error(t('invoices.errors.deleteFailed'));
    }
  };

  const handleSend = async () => {
    if (!invoice) return;
    
    try {
      await subscriptionInvoiceApi.send(invoice._id!, invoice.version || 1);
      toast.success(t('invoices.sendSuccess'));
      loadInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(t('invoices.errors.sendFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      draft: { color: 'bg-gray-100 text-gray-800', label: t('invoices.status.draft') },
      sent: { color: 'bg-blue-100 text-blue-800', label: t('invoices.status.sent') },
      paid: { color: 'bg-green-100 text-green-800', label: t('invoices.status.paid') },
      overdue: { color: 'bg-red-100 text-red-800', label: t('invoices.status.overdue') },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: t('invoices.status.cancelled') },
      refunded: { color: 'bg-purple-100 text-purple-800', label: t('invoices.status.refunded') },
      partially_paid: { color: 'bg-yellow-100 text-yellow-800', label: t('invoices.status.partiallyPaid') },
    };
    const config = configs[status] || configs.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
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
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('invoices.notFound')}</h3>
          <div className="mt-6">
            <Button onClick={() => navigate('/core/subscription-invoices')}>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/core/subscription-invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-gray-500 mt-1">
              {t('invoices.createdOn')} {formatDate(invoice.created_at!)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <Button variant="outline" onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              {t('invoices.sendInvoice')}
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/core/subscription-invoices/edit/${invoice._id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('invoices.invoiceDetails')}</CardTitle>
                {getStatusBadge(invoice.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.invoiceNumber')}</p>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.currency')}</p>
                  <p className="font-medium">{invoice.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.invoiceDate')}</p>
                  <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.dueDate')}</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
                {invoice.paid_date && (
                  <div>
                    <p className="text-sm text-gray-600">{t('invoices.paidDate')}</p>
                    <p className="font-medium text-green-600">{formatDate(invoice.paid_date)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.lineItems')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoice.line_items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.amount, invoice.currency)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('invoices.subtotal')}</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('invoices.taxAmount')}</span>
                    <span className="font-medium">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('invoices.discount')}</span>
                    <span className="font-medium text-green-600">-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>{t('invoices.totalAmount')}</span>
                  <span className="text-indigo-600">{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                </div>
                {invoice.amount_paid > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('invoices.amountPaid')}</span>
                      <span className="font-medium text-green-600">{formatCurrency(invoice.amount_paid, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('invoices.amountDue')}</span>
                      <span className="font-medium text-red-600">{formatCurrency(invoice.amount_due, invoice.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <Card>
              <CardHeader>
                <CardTitle>{t('invoices.notesAndTerms')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{t('invoices.notes')}</p>
                    <p className="text-sm text-gray-900">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{t('invoices.terms')}</p>
                    <p className="text-sm text-gray-900">{invoice.terms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('invoices.customerInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">{t('invoices.customerName')}</p>
                <p className="font-medium">{invoice.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('invoices.customerEmail')}</p>
                <p className="font-medium">{invoice.customer_email}</p>
              </div>
              {invoice.customer_phone && (
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.customerPhone')}</p>
                  <p className="font-medium">{invoice.customer_phone}</p>
                </div>
              )}
              {invoice.billing_address && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('invoices.billingAddress')}</p>
                  <div className="text-sm">
                    {invoice.billing_address.street && <p>{invoice.billing_address.street}</p>}
                    {invoice.billing_address.city && (
                      <p>
                        {invoice.billing_address.city}
                        {invoice.billing_address.state && `, ${invoice.billing_address.state}`}
                        {invoice.billing_address.zip && ` ${invoice.billing_address.zip}`}
                      </p>
                    )}
                    {invoice.billing_address.country && <p>{invoice.billing_address.country}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('invoices.paymentInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">{t('invoices.paymentStatus.label')}</p>
                <p className="font-medium">{t(`invoices.paymentStatus.${invoice.payment_status}`)}</p>
              </div>
              {invoice.payment_method && (
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.paymentMethod')}</p>
                  <p className="font-medium">{invoice.payment_method}</p>
                </div>
              )}
              {invoice.payment_reference && (
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.paymentReference')}</p>
                  <p className="font-medium">{invoice.payment_reference}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.auditTrail')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">{t('common.createdAt')}</p>
                <p className="font-medium">{formatDate(invoice.created_at!)}</p>
                {invoice.created_by && <p className="text-xs text-gray-500">{invoice.created_by}</p>}
              </div>
              <div>
                <p className="text-gray-600">{t('common.updatedAt')}</p>
                <p className="font-medium">{formatDate(invoice.updated_at!)}</p>
                {invoice.updated_by && <p className="text-xs text-gray-500">{invoice.updated_by}</p>}
              </div>
              <div>
                <p className="text-gray-600">{t('common.version')}</p>
                <p className="font-medium">v{invoice.version}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;