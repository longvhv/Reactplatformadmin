/**
 * InvoiceForm Component
 * Form for creating and editing invoices with full validation
 * Follows DRY principle and SonarQube standards
 * ✅ UPDATED 2026-01-15: Schema compliance fixes
 *   - JSONB structure for billing_info
 *   - billing_period fields instead of invoice_date
 *   - metadata JSONB for notes, terms, payment info
 *   - Correct field names (currency_code, items_snapshot, paid_at)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from '../../shim/next-navigation';
import { Save, X, Plus, Trash2, Calculator } from 'lucide-react';
import { Invoice } from '../../api/invoiceApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useLanguage } from '../../providers/LanguageProvider';

// ✅ Item structure for items_snapshot JSONB
interface ItemSnapshot {
  name: string;
  qty: number;
  price: number;
  amount: number;
  description?: string;
}

// ✅ Billing info structure for billing_info JSONB
interface BillingInfo {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  tax_id?: string;
  address?: string;
  company_name?: string;
}

interface InvoiceFormProps {
  initialData?: Invoice;
  onSubmit: (data: Omit<Invoice, '_id' | 'created_at' | 'updated_at' | 'version'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const router = useRouter();
  const { t } = useLanguage();

  // Basic Information
  const [tenantId, setTenantId] = useState(initialData?.tenant_id || '00000000-0000-0000-0000-000000000001');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number || '');
  
  // ✅ FIX: Replace invoice_date with billing_period
  const [billingPeriodStart, setBillingPeriodStart] = useState(
    initialData?.billing_period_start || new Date().toISOString()
  );
  const [billingPeriodEnd, setBillingPeriodEnd] = useState(
    initialData?.billing_period_end || (() => {
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      return end.toISOString();
    })()
  );
  
  const [dueDate, setDueDate] = useState(
    initialData?.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : 
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  // ✅ FIX: currency → currency_code
  const [currencyCode, setCurrencyCode] = useState(initialData?.currency_code || 'VND');
  
  // ✅ FIX: UPPERCASE status values
  const [status, setStatus] = useState<Invoice['status']>(initialData?.status || 'DRAFT');
  
  // ❌ REMOVE: payment_status is derived, not stored in DB

  // ✅ FIX: Consolidate into billing_info JSONB
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(
    initialData?.billing_info || {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      tax_id: '',
      address: '',
      company_name: '',
    }
  );

  // ✅ Helper for billing info updates
  const handleBillingInfoChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  // ✅ FIX: line_items → items_snapshot (JSONB array)
  const [itemsSnapshot, setItemsSnapshot] = useState<ItemSnapshot[]>(
    initialData?.items_snapshot || [{ name: '', qty: 1, price: 0, amount: 0, description: '' }]
  );

  // Financial
  const [subtotal, setSubtotal] = useState(initialData?.subtotal || 0);
  const [taxAmount, setTaxAmount] = useState(initialData?.tax_amount || 0);
  const [discountAmount, setDiscountAmount] = useState(initialData?.discount_amount || 0);
  const [totalAmount, setTotalAmount] = useState(initialData?.total_amount || 0);
  const [amountPaid, setAmountPaid] = useState(initialData?.amount_paid || 0);

  // ✅ FIX: Move to metadata JSONB
  const [metadata, setMetadata] = useState<Record<string, any>>(
    initialData?.metadata || {
      notes: '',
      terms: '',
      payment_method: '',
      payment_reference: '',
    }
  );

  const updateMetadata = (key: string, value: any) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate totals when items change
  useEffect(() => {
    const newSubtotal = itemsSnapshot.reduce((sum, item) => sum + (item.amount || 0), 0);
    setSubtotal(newSubtotal);
    
    const newTotal = newSubtotal + taxAmount - discountAmount;
    setTotalAmount(newTotal);
  }, [itemsSnapshot, taxAmount, discountAmount]);

  // Update item
  const updateItem = (index: number, field: keyof ItemSnapshot, value: any) => {
    const updated = [...itemsSnapshot];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'qty' || field === 'price') {
      updated[index].amount = updated[index].qty * updated[index].price;
    }
    
    setItemsSnapshot(updated);
  };

  const addItem = () => {
    setItemsSnapshot([...itemsSnapshot, { name: '', qty: 1, price: 0, amount: 0, description: '' }]);
  };

  const removeItem = (index: number) => {
    if (itemsSnapshot.length > 1) {
      setItemsSnapshot(itemsSnapshot.filter((_, i) => i !== index));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Invoice number
    if (!invoiceNumber.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
    }
    
    // Billing period validation
    if (!billingPeriodStart) {
      newErrors.billing_period_start = 'Billing period start is required';
    }
    if (!billingPeriodEnd) {
      newErrors.billing_period_end = 'Billing period end is required';
    }
    if (billingPeriodStart && billingPeriodEnd) {
      const start = new Date(billingPeriodStart);
      const end = new Date(billingPeriodEnd);
      if (end <= start) {
        newErrors.billing_period_end = 'Billing period end must be after start';
      }
    }
    
    // Due date validation
    if (!dueDate) {
      newErrors.due_date = 'Due date is required';
    }
    
    // Billing info validation
    if (!billingInfo.customer_name && !billingInfo.customer_email) {
      newErrors.billing_info = 'At least customer name or email is required';
    }
    if (billingInfo.customer_email && !/\S+@\S+\.\S+/.test(billingInfo.customer_email)) {
      newErrors.billing_info = 'Invalid email format';
    }
    
    // Items validation
    if (!itemsSnapshot || itemsSnapshot.length === 0) {
      newErrors.items_snapshot = 'At least one line item is required';
    }
    if (itemsSnapshot.some(item => !item.name || !item.name.trim())) {
      newErrors.items_snapshot = 'All line items must have a name/description';
    }
    if (itemsSnapshot.some(item => item.qty <= 0)) {
      newErrors.items_snapshot = 'All line items must have quantity > 0';
    }
    if (itemsSnapshot.some(item => item.price < 0)) {
      newErrors.items_snapshot = 'Line item prices cannot be negative';
    }
    
    // Amount validation
    if (totalAmount <= 0) {
      newErrors.total_amount = 'Total amount must be greater than 0';
    }
    if (subtotal < 0) {
      newErrors.subtotal = 'Subtotal cannot be negative';
    }
    if (taxAmount < 0) {
      newErrors.tax_amount = 'Tax amount cannot be negative';
    }
    if (discountAmount < 0) {
      newErrors.discount_amount = 'Discount amount cannot be negative';
    }
    if (amountPaid < 0) {
      newErrors.amount_paid = 'Amount paid cannot be negative';
    }
    if (amountPaid > totalAmount) {
      newErrors.amount_paid = 'Amount paid cannot exceed total amount';
    }
    
    // Currency code validation (must be 3 chars)
    if (!currencyCode || currencyCode.length !== 3) {
      newErrors.currency_code = 'Currency code must be exactly 3 characters (e.g., VND, USD)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // ✅ FIX: Use correct field names and structure
    const formData: Omit<Invoice, '_id' | 'created_at' | 'updated_at' | 'version'> = {
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      status: status,
      currency_code: currencyCode,
      
      subtotal: subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      amount_due: totalAmount - amountPaid,
      
      billing_info: billingInfo,
      items_snapshot: itemsSnapshot,
      
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      due_date: new Date(dueDate).toISOString(),
      paid_at: initialData?.paid_at || undefined,
      
      metadata: metadata,
      
      subscription_id: initialData?.subscription_id,
      order_id: initialData?.order_id,
      tax_breakdown: initialData?.tax_breakdown || [],
      price_adjustments: initialData?.price_adjustments || [],
      pdf_url: initialData?.pdf_url,
      
      created_by: initialData?.created_by,
      updated_by: 'current-user',
      deleted_at: initialData?.deleted_at,
      deleted_by: initialData?.deleted_by,
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
            <Label htmlFor="currency_code">{t('invoices.currency')}</Label>
            <Select value={currencyCode} onValueChange={setCurrencyCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VND">VND - Vietnamese Dong</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              </SelectContent>
            </Select>
            {errors.currency_code && (
              <p className="text-xs text-red-600 mt-1">{errors.currency_code}</p>
            )}
          </div>

          <div>
            <Label htmlFor="status">{t('common.status')}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Invoice['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">{t('common.draft')}</SelectItem>
                <SelectItem value="OPEN">{t('common.open')}</SelectItem>
                <SelectItem value="PAID">{t('common.paid')}</SelectItem>
                <SelectItem value="VOID">{t('common.void')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="due_date">{t('invoices.dueDate')} *</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.due_date && (
              <p className="text-xs text-red-600 mt-1">{errors.due_date}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Billing Period *</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="billing_period_start">Period Start *</Label>
            <Input
              id="billing_period_start"
              type="date"
              value={billingPeriodStart.split('T')[0]}
              onChange={(e) => setBillingPeriodStart(e.target.value + 'T00:00:00Z')}
              required
            />
            {errors.billing_period_start && (
              <p className="text-xs text-red-600 mt-1">{errors.billing_period_start}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="billing_period_end">Period End *</Label>
            <Input
              id="billing_period_end"
              type="date"
              value={billingPeriodEnd.split('T')[0]}
              onChange={(e) => setBillingPeriodEnd(e.target.value + 'T23:59:59Z')}
              required
            />
            {errors.billing_period_end && (
              <p className="text-xs text-red-600 mt-1">{errors.billing_period_end}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Information (Billing Info JSONB) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('invoices.customerInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={billingInfo.customer_name || ''}
                onChange={(e) => handleBillingInfoChange('customer_name', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="customer_email">Customer Email *</Label>
              <Input
                id="customer_email"
                type="email"
                value={billingInfo.customer_email || ''}
                onChange={(e) => handleBillingInfoChange('customer_email', e.target.value)}
              />
            </div>
          </div>

          {errors.billing_info && (
            <p className="text-xs text-red-600">{errors.billing_info}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={billingInfo.customer_phone || ''}
                onChange={(e) => handleBillingInfoChange('customer_phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                value={billingInfo.tax_id || ''}
                onChange={(e) => handleBillingInfoChange('tax_id', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={billingInfo.company_name || ''}
              onChange={(e) => handleBillingInfoChange('company_name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={billingInfo.address || ''}
              onChange={(e) => handleBillingInfoChange('address', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items (items_snapshot JSONB) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('invoices.lineItems')}</CardTitle>
          <Button type="button" size="sm" onClick={addItem} variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            {t('invoices.addItem')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemsSnapshot.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
              <div className="col-span-5">
                <Label className="text-xs">Item Name / Description</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  placeholder="Item name"
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Amount</Label>
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
                  onClick={() => removeItem(index)}
                  disabled={itemsSnapshot.length === 1}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {errors.items_snapshot && (
            <p className="text-xs text-red-600">{errors.items_snapshot}</p>
          )}

          {/* Financial Summary */}
          <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('invoices.subtotal')}</span>
              <span className="text-sm font-medium">
                {subtotal.toFixed(2)} {currencyCode}
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
                <span className="text-sm">{currencyCode}</span>
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
                <span className="text-sm">{currencyCode}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">{t('invoices.totalAmount')}</span>
              <span className="text-lg font-bold text-indigo-600">
                {totalAmount.toFixed(2)} {currencyCode}
              </span>
            </div>

            {amountPaid > 0 && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('invoices.amountPaid')}</span>
                  <span className="text-green-600 font-medium">
                    {amountPaid.toFixed(2)} {currencyCode}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('invoices.amountDue')}</span>
                  <span className="text-red-600 font-medium">
                    {(totalAmount - amountPaid).toFixed(2)} {currencyCode}
                  </span>
                </div>
              </>
            )}
            
            {errors.total_amount && (
              <p className="text-xs text-red-600">{errors.total_amount}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Information & Notes (metadata JSONB) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={metadata.payment_method || ''}
                onChange={(e) => updateMetadata('payment_method', e.target.value)}
                placeholder="Credit Card, Bank Transfer, etc."
              />
            </div>

            <div>
              <Label htmlFor="payment_reference">Payment Reference</Label>
              <Input
                id="payment_reference"
                value={metadata.payment_reference || ''}
                onChange={(e) => updateMetadata('payment_reference', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={metadata.notes || ''}
              onChange={(e) => updateMetadata('notes', e.target.value)}
              rows={3}
              placeholder="Internal notes about this invoice"
            />
          </div>

          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={metadata.terms || ''}
              onChange={(e) => updateMetadata('terms', e.target.value)}
              rows={3}
              placeholder="Payment terms and conditions"
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