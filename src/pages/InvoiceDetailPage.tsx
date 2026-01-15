/**
 * Invoice Detail Page
 * Displays detailed information about a subscription invoice
 * 
 * ✅ REWRITTEN 2026-01-14: Now matches subscription_invoices schema
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, Edit, Trash2, Send, DollarSign, 
  Download, Calendar, FileText, Receipt, Package, User, ShoppingCart, Calculator
} from 'lucide-react';
import { subscriptionInvoiceApi, SubscriptionInvoice } from '../api/subscriptionInvoiceApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

const InvoiceDetailPage: React.FC = () => {
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
      await subscriptionInvoiceApi.send(invoice._id!, invoice.version);
      toast.success(t('invoices.sendSuccess'));
      loadInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(t('invoices.errors.sendFailed'));
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    
    try {
      await subscriptionInvoiceApi.markAsPaid(invoice._id!, invoice.version);
      toast.success('Invoice marked as paid');
      loadInvoice();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to mark invoice as paid');
    }
  };

  const handleVoid = async () => {
    if (!invoice || !confirm('Are you sure you want to void this invoice?')) return;
    
    try {
      await subscriptionInvoiceApi.voidInvoice(invoice._id!, invoice.version);
      toast.success('Invoice voided successfully');
      loadInvoice();
    } catch (error) {
      console.error('Error voiding invoice:', error);
      toast.error('Failed to void invoice');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currencyCode || 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      OPEN: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
      PAID: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      VOID: { color: 'bg-red-100 text-red-800', label: 'Void' },
      UNCOLLECTIBLE: { color: 'bg-orange-100 text-orange-800', label: 'Uncollectible' },
    };
    const config = configs[status] || configs.DRAFT;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const calculateFinalAmount = () => {
    if (!invoice) return 0;
    return subscriptionInvoiceApi.calculateTotal(invoice.amount, invoice.price_adjustments);
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
          {invoice.status === 'DRAFT' && (
            <Button variant="outline" onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          )}
          {invoice.status === 'OPEN' && (
            <Button variant="outline" onClick={handleMarkAsPaid} className="text-green-600">
              <DollarSign className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          {(invoice.status === 'DRAFT' || invoice.status === 'OPEN') && (
            <Button variant="outline" onClick={handleVoid} className="text-orange-600">
              Void Invoice
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
                  <p className="font-medium font-mono">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subscription ID</p>
                  <p className="font-medium font-mono text-xs">{invoice.subscription_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Period Start</p>
                  <p className="font-medium">{formatDate(invoice.billing_period_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Period End</p>
                  <p className="font-medium">{formatDate(invoice.billing_period_end)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.dueDate')}</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
                {invoice.paid_at && (
                  <div>
                    <p className="text-sm text-gray-600">Paid Date</p>
                    <p className="font-medium text-green-600">{formatDate(invoice.paid_at)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">{t('invoices.currency')}</p>
                  <p className="font-medium">{invoice.currency_code}</p>
                </div>
                {invoice.partner_id && (
                  <div>
                    <p className="text-sm text-gray-600">Partner ID</p>
                    <p className="font-medium font-mono text-xs">{invoice.partner_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Snapshot - NEW */}
          {invoice.customer_snapshot && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {invoice.customer_snapshot.name && (
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-medium">{invoice.customer_snapshot.name}</p>
                    </div>
                  )}
                  {invoice.customer_snapshot.tax_id && (
                    <div>
                      <p className="text-sm text-gray-600">Tax ID</p>
                      <p className="font-medium font-mono">{invoice.customer_snapshot.tax_id}</p>
                    </div>
                  )}
                  {invoice.customer_snapshot.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-blue-600">{invoice.customer_snapshot.email}</p>
                    </div>
                  )}
                  {invoice.customer_snapshot.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{invoice.customer_snapshot.phone}</p>
                    </div>
                  )}
                  {invoice.customer_snapshot.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{invoice.customer_snapshot.address}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line Items - NEW */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Line Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left text-sm font-medium text-gray-600 pb-2">Item</th>
                        <th className="text-right text-sm font-medium text-gray-600 pb-2">Qty</th>
                        <th className="text-right text-sm font-medium text-gray-600 pb-2">Price</th>
                        <th className="text-right text-sm font-medium text-gray-600 pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items.map((item, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-gray-500">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="text-right py-3 font-mono">{item.qty}</td>
                          <td className="text-right py-3">
                            {formatCurrency(item.price, invoice.currency_code)}
                          </td>
                          <td className="text-right py-3 font-semibold">
                            {formatCurrency(item.total, invoice.currency_code)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Amount Breakdown - UPDATED */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between text-base">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.subtotal || invoice.amount || 0, invoice.currency_code)}
                  </span>
                </div>

                {/* Tax Amount */}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700">Tax</span>
                    <span className="font-semibold">
                      {formatCurrency(invoice.tax_amount, invoice.currency_code)}
                    </span>
                  </div>
                )}

                {/* Discount */}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-base">
                    <span className="text-gray-700">Discount</span>
                    <span className="text-green-600 font-semibold">
                      -{formatCurrency(invoice.discount_amount, invoice.currency_code)}
                    </span>
                  </div>
                )}

                {/* Price Adjustments (if any) */}
                {invoice.price_adjustments && invoice.price_adjustments.length > 0 && (
                  <>
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-600">Additional Adjustments</p>
                      {invoice.price_adjustments.map((adj, index) => (
                        <div key={index} className="flex justify-between items-center text-sm pl-4">
                          <span className="text-gray-600">
                            {adj.description || adj.type || 'Adjustment'}
                            {adj.type && <span className="ml-2 text-xs text-gray-400">({adj.type})</span>}
                          </span>
                          <span className={
                            adj.type === 'discount' || adj.type === 'credit' 
                              ? 'text-green-600 font-medium' 
                              : 'text-gray-900 font-medium'
                          }>
                            {adj.type === 'discount' || adj.type === 'credit' ? '-' : '+'}
                            {formatCurrency(adj.amount || 0, invoice.currency_code)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Total Amount */}
                <div className="flex justify-between text-xl font-bold pt-3 border-t">
                  <span>Total Amount</span>
                  <span className="text-indigo-600">
                    {formatCurrency(invoice.total_amount || calculateFinalAmount(), invoice.currency_code)}
                  </span>
                </div>

                {/* Amount Paid */}
                {invoice.amount_paid > 0 && (
                  <div className="flex justify-between text-base pt-2">
                    <span className="text-gray-700">Amount Paid</span>
                    <span className="text-green-600 font-semibold">
                      -{formatCurrency(invoice.amount_paid, invoice.currency_code)}
                    </span>
                  </div>
                )}

                {/* Amount Due */}
                {invoice.amount_due !== undefined && invoice.amount_due > 0 && (
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-orange-200 bg-orange-50 -mx-6 px-6 py-3 rounded-lg">
                    <span className="text-orange-700">Amount Due</span>
                    <span className="text-orange-600">
                      {formatCurrency(invoice.amount_due, invoice.currency_code)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tax Breakdown - NEW */}
          {invoice.tax_breakdown && invoice.tax_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Tax Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.tax_breakdown.map((tax, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{tax.name}</p>
                        {tax.tax_type && (
                          <p className="text-sm text-gray-500">{tax.tax_type}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(tax.amount, invoice.currency_code)}
                        </p>
                        <p className="text-sm text-gray-500">{tax.rate}%</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total Tax</span>
                    <span className="text-indigo-600">
                      {formatCurrency(
                        invoice.tax_breakdown.reduce((sum, tax) => sum + tax.amount, 0),
                        invoice.currency_code
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amount Breakdown */}
          <Card className="hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 h-5" />
                Amount Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-gray-700">Base Amount</span>
                  <span className="font-semibold">{formatCurrency(invoice.amount, invoice.currency_code)}</span>
                </div>

                {invoice.price_adjustments && invoice.price_adjustments.length > 0 && (
                  <>
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-600">Price Adjustments</p>
                      {invoice.price_adjustments.map((adj, index) => (
                        <div key={index} className="flex justify-between items-center text-sm pl-4">
                          <span className="text-gray-600">
                            {adj.description || adj.type || 'Adjustment'}
                            {adj.type && <span className="ml-2 text-xs text-gray-400">({adj.type})</span>}
                          </span>
                          <span className={
                            adj.type === 'discount' || adj.type === 'credit' 
                              ? 'text-green-600 font-medium' 
                              : 'text-gray-900 font-medium'
                          }>
                            {adj.type === 'discount' || adj.type === 'credit' ? '-' : '+'}
                            {formatCurrency(adj.amount || 0, invoice.currency_code)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex justify-between text-xl font-bold pt-3 border-t">
                  <span>Total Amount</span>
                  <span className="text-indigo-600">{formatCurrency(calculateFinalAmount(), invoice.currency_code)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {invoice.metadata && Object.keys(invoice.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-900 overflow-x-auto">
                    {JSON.stringify(invoice.metadata, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <div className="mt-1">{getStatusBadge(invoice.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status Description</p>
                <p className="text-sm text-gray-900 mt-1">
                  {invoice.status === 'DRAFT' && 'Invoice is being prepared and not yet sent'}
                  {invoice.status === 'OPEN' && 'Invoice has been sent and awaiting payment'}
                  {invoice.status === 'PAID' && 'Invoice has been paid in full'}
                  {invoice.status === 'VOID' && 'Invoice has been voided and cancelled'}
                  {invoice.status === 'UNCOLLECTIBLE' && 'Invoice is marked as uncollectible'}
                </p>
              </div>
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
              </div>
              <div>
                <p className="text-gray-600">{t('common.updatedAt')}</p>
                <p className="font-medium">{formatDate(invoice.updated_at!)}</p>
              </div>
              <div>
                <p className="text-gray-600">{t('common.version')}</p>
                <p className="font-medium">v{invoice.version}</p>
              </div>
              <div>
                <p className="text-gray-600">Invoice ID</p>
                <p className="font-mono text-xs break-all">{invoice._id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;