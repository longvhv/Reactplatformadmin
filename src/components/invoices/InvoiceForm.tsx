/**
 * InvoiceForm Component
 * Form for creating and editing invoices with full validation
 * Follows DRY principle and SonarQube standards
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Save, X, Plus, Trash2, Calculator } from 'lucide-react';
import { 
  SubscriptionInvoice, 
  InvoiceLineItem, 
  BillingAddress,
  InvoiceStatus,
  PaymentStatus 
} from '../../api/subscriptionInvoiceApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useLanguage } from '../../providers/LanguageProvider';

interface InvoiceFormProps {
  initialData?: SubscriptionInvoice;
  onSubmit: (data: Omit<SubscriptionInvoice, '_id' | 'created_at' | 'updated_at' | 'version'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Basic Information
  const [tenantId, setTenantId] = useState(initialData?.tenant_id || '00000000-0000-0000-0000-000000000001');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number || '');
  const [invoiceDate, setInvoiceDate] = useState(
    initialData?.invoice_date ? new Date(initialData.invoice_date).toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : 
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [status, setStatus] = useState<InvoiceStatus>(initialData?.status || 'draft');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialData?.payment_status || 'unpaid');

  // Customer Information
  const [customerName, setCustomerName] = useState(initialData?.customer_name || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customer_email || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone || '');

  // Billing Address
  const [billingStreet, setBillingStreet] = useState(initialData?.billing_address?.street || '');
  const [billingCity, setBillingCity] = useState(initialData?.billing_address?.city || '');
  const [billingState, setBillingState] = useState(initialData?.billing_address?.state || '');
  const [billingZip, setBillingZip] = useState(initialData?.billing_address?.zip || '');
  const [billingCountry, setBillingCountry] = useState(initialData?.billing_address?.country || '');

  // Line Items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    initialData?.line_items || [{ description: '', quantity: 1, unit_price: 0, amount: 0 }]
  );

  // Financial
  const [subtotal, setSubtotal] = useState(initialData?.subtotal || 0);
  const [taxAmount, setTaxAmount] = useState(initialData?.tax_amount || 0);
  const [discountAmount, setDiscountAmount] = useState(initialData?.discount_amount || 0);
  const [totalAmount, setTotalAmount] = useState(initialData?.total_amount || 0);
  const [amountPaid, setAmountPaid] = useState(initialData?.amount_paid || 0);
  const [amountDue, setAmountDue] = useState(initialData?.amount_due || 0);

  // Payment Information
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || '');
  const [paymentReference, setPaymentReference] = useState(initialData?.payment_reference || '');

  // Notes
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [terms, setTerms] = useState(initialData?.terms || '');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate totals when line items change
  useEffect(() => {
    const newSubtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    setSubtotal(newSubtotal);
    
    const newTotal = newSubtotal + taxAmount - discountAmount;
    setTotalAmount(newTotal);
    setAmountDue(newTotal - amountPaid);
  }, [lineItems, taxAmount, discountAmount, amountPaid]);

  // Update line item
  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!invoiceNumber.trim()) {
      newErrors.invoice_number = t('invoices.errors.invoiceNumberRequired');
    }
    if (!customerName.trim()) {
      newErrors.customer_name = t('invoices.errors.customerNameRequired');
    }
    if (!customerEmail.trim()) {
      newErrors.customer_email = t('invoices.errors.customerEmailRequired');
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      newErrors.customer_email = t('invoices.errors.invalidEmail');
    }
    if (lineItems.some(item => !item.description.trim())) {
      newErrors.line_items = t('invoices.errors.lineItemDescriptionRequired');
    }
    if (totalAmount <= 0) {
      newErrors.total_amount = t('invoices.errors.totalAmountMustBePositive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const billingAddress: BillingAddress = {
      street: billingStreet,
      city: billingCity,
      state: billingState,
      zip: billingZip,
      country: billingCountry,
    };

    const formData: Omit<SubscriptionInvoice, '_id' | 'created_at' | 'updated_at' | 'version'> = {
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      invoice_date: new Date(invoiceDate).toISOString(),
      due_date: new Date(dueDate).toISOString(),
      paid_date: initialData?.paid_date || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      amount_due: amountDue,
      currency,
      status,
      payment_status: paymentStatus,
      payment_method: paymentMethod || undefined,
      payment_reference: paymentReference || undefined,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || undefined,
      billing_address: billingAddress,
      line_items: lineItems,
      notes: notes || undefined,
      terms: terms || undefined,
      created_by: initialData?.created_by,
      updated_by: 'current-user',
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('invoices.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="invoice_number">{t('invoices.invoiceNumber')} *</Label>
            <Input
              id="invoice_number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-2026-0001"
            />
            {errors.invoice_number && (
              <p className="text-xs text-red-600 mt-1">{errors.invoice_number}</p>
            )}
          </div>

          <div>
            <Label htmlFor="currency">{t('invoices.currency')}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="VND">VND - Vietnamese Dong</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="invoice_date">{t('invoices.invoiceDate')}</Label>
            <Input
              id="invoice_date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="due_date">{t('invoices.dueDate')}</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="status">{t('common.status')}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('invoices.status.draft')}</SelectItem>
                <SelectItem value="sent">{t('invoices.status.sent')}</SelectItem>
                <SelectItem value="paid">{t('invoices.status.paid')}</SelectItem>
                <SelectItem value="overdue">{t('invoices.status.overdue')}</SelectItem>
                <SelectItem value="cancelled">{t('invoices.status.cancelled')}</SelectItem>
                <SelectItem value="partially_paid">{t('invoices.status.partiallyPaid')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_status">{t('invoices.paymentStatus.label')}</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">{t('invoices.paymentStatus.unpaid')}</SelectItem>
                <SelectItem value="paid">{t('invoices.paymentStatus.paid')}</SelectItem>
                <SelectItem value="partially_paid">{t('invoices.paymentStatus.partiallyPaid')}</SelectItem>
                <SelectItem value="refunded">{t('invoices.paymentStatus.refunded')}</SelectItem>
                <SelectItem value="failed">{t('invoices.paymentStatus.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('invoices.customerInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer_name">{t('invoices.customerName')} *</Label>
            <Input
              id="customer_name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            {errors.customer_name && (
              <p className="text-xs text-red-600 mt-1">{errors.customer_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customer_email">{t('invoices.customerEmail')} *</Label>
            <Input
              id="customer_email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
            {errors.customer_email && (
              <p className="text-xs text-red-600 mt-1">{errors.customer_email}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="customer_phone">{t('invoices.customerPhone')}</Label>
            <Input
              id="customer_phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="billing_street">{t('invoices.billingAddress')}</Label>
            <Input
              id="billing_street"
              value={billingStreet}
              onChange={(e) => setBillingStreet(e.target.value)}
              placeholder={t('invoices.street')}
            />
          </div>

          <div>
            <Input
              value={billingCity}
              onChange={(e) => setBillingCity(e.target.value)}
              placeholder={t('invoices.city')}
            />
          </div>

          <div>
            <Input
              value={billingState}
              onChange={(e) => setBillingState(e.target.value)}
              placeholder={t('invoices.state')}
            />
          </div>

          <div>
            <Input
              value={billingZip}
              onChange={(e) => setBillingZip(e.target.value)}
              placeholder={t('invoices.zip')}
            />
          </div>

          <div>
            <Input
              value={billingCountry}
              onChange={(e) => setBillingCountry(e.target.value)}
              placeholder={t('invoices.country')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('invoices.lineItems')}</CardTitle>
          <Button type="button" size="sm" onClick={addLineItem} variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            {t('invoices.addItem')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
              <div className="col-span-5">
                <Label className="text-xs">{t('invoices.description')}</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  placeholder={t('invoices.itemDescription')}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t('invoices.quantity')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t('invoices.unitPrice')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value))}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t('invoices.amount')}</Label>
                <Input
                  type="number"
                  value={item.amount.toFixed(2)}
                  readOnly
                  className="text-sm bg-gray-50"
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {errors.line_items && (
            <p className="text-xs text-red-600">{errors.line_items}</p>
          )}

          {/* Financial Summary */}
          <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('invoices.subtotal')}</span>
              <span className="text-sm font-medium">
                {subtotal.toFixed(2)} {currency}
              </span>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <Label className="text-sm text-gray-600">{t('invoices.taxAmount')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                  className="w-24 text-sm text-right"
                />
                <span className="text-sm">{currency}</span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2">
              <Label className="text-sm text-gray-600">{t('invoices.discount')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-24 text-sm text-right"
                />
                <span className="text-sm">{currency}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">{t('invoices.totalAmount')}</span>
              <span className="text-lg font-bold text-indigo-600">
                {totalAmount.toFixed(2)} {currency}
              </span>
            </div>

            {amountPaid > 0 && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('invoices.amountPaid')}</span>
                  <span className="text-green-600 font-medium">
                    {amountPaid.toFixed(2)} {currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('invoices.amountDue')}</span>
                  <span className="text-red-600 font-medium">
                    {amountDue.toFixed(2)} {currency}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('invoices.paymentInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="payment_method">{t('invoices.paymentMethod')}</Label>
            <Input
              id="payment_method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Credit Card, Bank Transfer, etc."
            />
          </div>

          <div>
            <Label htmlFor="payment_reference">{t('invoices.paymentReference')}</Label>
            <Input
              id="payment_reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('invoices.notesAndTerms')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">{t('invoices.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('invoices.notesPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="terms">{t('invoices.terms')}</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              placeholder={t('invoices.termsPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;