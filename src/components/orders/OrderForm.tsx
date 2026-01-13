/**
 * Order Form Component
 * Form for creating/editing subscription orders
 */

import React, { useState, useEffect } from 'react';
import { SubscriptionOrder, BillingCycle, OrderStatus, PaymentStatus } from '../../api/subscriptionOrderApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface OrderFormProps {
  order?: SubscriptionOrder;
  onSubmit: (data: Partial<SubscriptionOrder>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function OrderForm({ order, onSubmit, onCancel, loading }: OrderFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<SubscriptionOrder>>({
    tenant_id: '00000000-0000-0000-0000-000000000001',
    product_id: '',
    order_code: '',
    order_date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    billing_cycle: 'MONTHLY' as BillingCycle,
    base_price: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: 'USD',
    payment_status: 'pending' as PaymentStatus,
    payment_method: '',
    status: 'pending' as OrderStatus,
    auto_renewal: true,
    renewal_count: 0,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: '',
    ...order,
  });

  // Calculate total amount
  useEffect(() => {
    const base = Number(formData.base_price) || 0;
    const discount = Number(formData.discount_amount) || 0;
    const tax = Number(formData.tax_amount) || 0;
    const total = base - discount + tax;
    setFormData(prev => ({ ...prev, total_amount: total }));
  }, [formData.base_price, formData.discount_amount, formData.tax_amount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">{t('subscriptionOrders.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="order_code">{t('subscriptionOrders.orderCode')} *</Label>
            <Input
              id="order_code"
              name="order_code"
              value={formData.order_code}
              onChange={handleChange}
              required
              placeholder="ORD-2026-001"
            />
          </div>

          <div>
            <Label htmlFor="order_date">{t('subscriptionOrders.orderDate')} *</Label>
            <Input
              id="order_date"
              name="order_date"
              type="date"
              value={formData.order_date?.split('T')[0]}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="start_date">{t('subscriptionOrders.startDate')} *</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={formData.start_date?.split('T')[0]}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="end_date">{t('subscriptionOrders.endDate')}</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={formData.end_date?.split('T')[0] || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="billing_cycle">{t('subscriptionOrders.billingCycle')} *</Label>
            <select
              id="billing_cycle"
              name="billing_cycle"
              value={formData.billing_cycle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              required
            >
              <option value="DAILY">{t('subscriptionOrders.daily')}</option>
              <option value="WEEKLY">{t('subscriptionOrders.weekly')}</option>
              <option value="MONTHLY">{t('subscriptionOrders.monthly')}</option>
              <option value="QUARTERLY">{t('subscriptionOrders.quarterly')}</option>
              <option value="YEARLY">{t('subscriptionOrders.yearly')}</option>
              <option value="LIFETIME">{t('subscriptionOrders.lifetime')}</option>
            </select>
          </div>

          <div>
            <Label htmlFor="status">{t('subscriptionOrders.status')} *</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              required
            >
              <option value="pending">{t('subscriptionOrders.statusPending')}</option>
              <option value="active">{t('subscriptionOrders.statusActive')}</option>
              <option value="cancelled">{t('subscriptionOrders.statusCancelled')}</option>
              <option value="expired">{t('subscriptionOrders.statusExpired')}</option>
              <option value="suspended">{t('subscriptionOrders.statusSuspended')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">{t('subscriptionOrders.customer')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer_name">{t('subscriptionOrders.customerName')} *</Label>
            <Input
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="customer_email">{t('subscriptionOrders.customerEmail')} *</Label>
            <Input
              id="customer_email"
              name="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="customer_phone">{t('subscriptionOrders.customerPhone')}</Label>
            <Input
              id="customer_phone"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">{t('subscriptionOrders.product')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="base_price">{t('subscriptionOrders.basePrice')} *</Label>
            <Input
              id="base_price"
              name="base_price"
              type="number"
              step="0.01"
              value={formData.base_price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="discount_amount">{t('subscriptionOrders.discountAmount')}</Label>
            <Input
              id="discount_amount"
              name="discount_amount"
              type="number"
              step="0.01"
              value={formData.discount_amount}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="tax_amount">{t('subscriptionOrders.taxAmount')}</Label>
            <Input
              id="tax_amount"
              name="tax_amount"
              type="number"
              step="0.01"
              value={formData.tax_amount}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="total_amount">{t('subscriptionOrders.totalAmount')}</Label>
            <Input
              id="total_amount"
              name="total_amount"
              type="number"
              step="0.01"
              value={formData.total_amount}
              disabled
              className="bg-gray-100 dark:bg-gray-900"
            />
          </div>

          <div>
            <Label htmlFor="currency">{t('subscriptionOrders.currency')}</Label>
            <Input
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              placeholder="USD"
            />
          </div>

          <div>
            <Label htmlFor="payment_method">{t('subscriptionOrders.paymentMethod')}</Label>
            <Input
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              placeholder="credit_card"
            />
          </div>

          <div>
            <Label htmlFor="payment_status">{t('subscriptionOrders.paymentStatus')} *</Label>
            <select
              id="payment_status"
              name="payment_status"
              value={formData.payment_status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
              required
            >
              <option value="pending">{t('subscriptionOrders.paymentPending')}</option>
              <option value="paid">{t('subscriptionOrders.paymentPaid')}</option>
              <option value="failed">{t('subscriptionOrders.paymentFailed')}</option>
              <option value="refunded">{t('subscriptionOrders.paymentRefunded')}</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="auto_renewal"
              name="auto_renewal"
              type="checkbox"
              checked={formData.auto_renewal}
              onChange={handleChange}
              className="mr-2"
            />
            <Label htmlFor="auto_renewal">{t('subscriptionOrders.autoRenewal')}</Label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <Label htmlFor="notes">{t('subscriptionOrders.notes')}</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}