/**
 * SubscriptionForm Component
 * Form for creating and editing tenant subscriptions
 */

import React, { useState, useEffect } from 'react';
import { 
  TenantSubscription, 
  SubscriptionStatus, 
  BillingCycle, 
  PaymentStatus,
  generateSubscriptionNumber 
} from '../../api/tenantSubscriptionsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useLanguage } from '../../providers/LanguageProvider';
import { 
  CreditCard, Calendar, DollarSign, Users, HardDrive,
  Save, X, Sparkles, AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface SubscriptionFormProps {
  subscription?: TenantSubscription;
  onSubmit: (data: Partial<TenantSubscription>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  subscription,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<TenantSubscription>>({
    tenant_id: '',
    subscription_number: '',
    subscription_name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending' as SubscriptionStatus,
    billing_cycle: 'monthly' as BillingCycle,
    payment_status: 'unpaid' as PaymentStatus,
    auto_renew: true,
    is_trial: false,
    base_price: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: 'USD',
    max_users: 1,
    current_users: 0,
    max_storage_gb: 10,
    current_storage_gb: 0,
    plan_name: '',
    billing_contact_name: '',
    billing_contact_email: '',
    billing_contact_phone: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subscription) {
      setFormData(subscription);
    } else {
      generateSubscriptionNumber().then(number => {
        setFormData(prev => ({ ...prev, subscription_number: number }));
      });
    }
  }, [subscription]);

  // Auto-calculate total amount
  useEffect(() => {
    const base = Number(formData.base_price) || 0;
    const discount = Number(formData.discount_amount) || 0;
    const tax = Number(formData.tax_amount) || 0;
    const total = base - discount + tax;
    setFormData(prev => ({ ...prev, total_amount: Math.max(0, total) }));
  }, [formData.base_price, formData.discount_amount, formData.tax_amount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) || 0 : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subscription_name?.trim()) {
      newErrors.subscription_name = t('subscriptions.errors.nameRequired');
    }
    if (!formData.subscription_number?.trim()) {
      newErrors.subscription_number = t('subscriptions.errors.numberRequired');
    }
    if (!formData.tenant_id?.trim()) {
      newErrors.tenant_id = t('subscriptions.errors.tenantRequired');
    }
    if (!formData.start_date) {
      newErrors.start_date = t('subscriptions.errors.startDateRequired');
    }
    if (!formData.end_date) {
      newErrors.end_date = t('subscriptions.errors.endDateRequired');
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = t('subscriptions.errors.endDateInvalid');
    }
    if (formData.base_price < 0) {
      newErrors.base_price = t('subscriptions.errors.priceInvalid');
    }
    if (formData.max_users <= 0) {
      newErrors.max_users = t('subscriptions.errors.maxUsersInvalid');
    }
    if (formData.current_users > formData.max_users) {
      newErrors.current_users = t('subscriptions.errors.currentUsersExceeded');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('subscriptions.basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subscription Number */}
            <div>
              <Label htmlFor="subscription_number">{t('subscriptions.subscriptionNumber')} *</Label>
              <Input
                id="subscription_number"
                name="subscription_number"
                value={formData.subscription_number}
                onChange={handleChange}
                disabled
                className="bg-gray-50"
              />
              {errors.subscription_number && (
                <p className="text-red-600 text-sm mt-1">{errors.subscription_number}</p>
              )}
            </div>

            {/* Subscription Name */}
            <div>
              <Label htmlFor="subscription_name">{t('subscriptions.subscriptionName')} *</Label>
              <Input
                id="subscription_name"
                name="subscription_name"
                value={formData.subscription_name}
                onChange={handleChange}
                placeholder={t('subscriptions.subscriptionNamePlaceholder')}
              />
              {errors.subscription_name && (
                <p className="text-red-600 text-sm mt-1">{errors.subscription_name}</p>
              )}
            </div>

            {/* Tenant ID */}
            <div>
              <Label htmlFor="tenant_id">{t('subscriptions.tenantId')} *</Label>
              <Input
                id="tenant_id"
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleChange}
                placeholder="UUID"
              />
              {errors.tenant_id && (
                <p className="text-red-600 text-sm mt-1">{errors.tenant_id}</p>
              )}
            </div>

            {/* Plan Name */}
            <div>
              <Label htmlFor="plan_name">{t('subscriptions.planName')}</Label>
              <select
                id="plan_name"
                name="plan_name"
                value={formData.plan_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('subscriptions.selectPlan')}</option>
                <option value="Basic">Basic</option>
                <option value="Startup">Startup</option>
                <option value="Professional">Professional</option>
                <option value="Business">Business</option>
                <option value="Growth">Growth</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('subscriptions.period')} & {t('subscriptions.status')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <Label htmlFor="start_date">{t('subscriptions.startDate')} *</Label>
              <Input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
              />
              {errors.start_date && (
                <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="end_date">{t('subscriptions.endDate')} *</Label>
              <Input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
              />
              {errors.end_date && (
                <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">{t('subscriptions.status')} *</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">{t('subscriptions.status.pending')}</option>
                <option value="trial">{t('subscriptions.status.trial')}</option>
                <option value="active">{t('subscriptions.status.active')}</option>
                <option value="suspended">{t('subscriptions.status.suspended')}</option>
                <option value="expired">{t('subscriptions.status.expired')}</option>
                <option value="cancelled">{t('subscriptions.status.cancelled')}</option>
              </select>
            </div>

            {/* Billing Cycle */}
            <div>
              <Label htmlFor="billing_cycle">{t('subscriptions.billingCycle')} *</Label>
              <select
                id="billing_cycle"
                name="billing_cycle"
                value={formData.billing_cycle}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="monthly">{t('subscriptions.billingCycle.monthly')}</option>
                <option value="quarterly">{t('subscriptions.billingCycle.quarterly')}</option>
                <option value="yearly">{t('subscriptions.billingCycle.yearly')}</option>
                <option value="custom">{t('subscriptions.billingCycle.custom')}</option>
              </select>
            </div>

            {/* Trial End Date (if trial) */}
            {formData.is_trial && (
              <div>
                <Label htmlFor="trial_end_date">{t('subscriptions.trialEndDate')}</Label>
                <Input
                  type="date"
                  id="trial_end_date"
                  name="trial_end_date"
                  value={formData.trial_end_date || ''}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_trial"
                  name="is_trial"
                  checked={formData.is_trial}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="is_trial" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  {t('subscriptions.isTrial')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto_renew"
                  name="auto_renew"
                  checked={formData.auto_renew}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="auto_renew">{t('subscriptions.autoRenew')}</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {t('subscriptions.pricing')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency */}
            <div>
              <Label htmlFor="currency">{t('subscriptions.currency')}</Label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="VND">VND</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            {/* Base Price */}
            <div>
              <Label htmlFor="base_price">{t('subscriptions.basePrice')} *</Label>
              <Input
                type="number"
                id="base_price"
                name="base_price"
                value={formData.base_price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
              {errors.base_price && (
                <p className="text-red-600 text-sm mt-1">{errors.base_price}</p>
              )}
            </div>

            {/* Discount Amount */}
            <div>
              <Label htmlFor="discount_amount">{t('subscriptions.discountAmount')}</Label>
              <Input
                type="number"
                id="discount_amount"
                name="discount_amount"
                value={formData.discount_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            {/* Tax Amount */}
            <div>
              <Label htmlFor="tax_amount">{t('subscriptions.taxAmount')}</Label>
              <Input
                type="number"
                id="tax_amount"
                name="tax_amount"
                value={formData.tax_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>

            {/* Total Amount (Read-only) */}
            <div className="md:col-span-2">
              <Label htmlFor="total_amount">{t('subscriptions.totalAmount')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  id="total_amount"
                  name="total_amount"
                  value={formData.total_amount}
                  disabled
                  className="bg-gray-50 font-bold text-lg"
                />
                <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1">
                  {formData.currency}
                </Badge>
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <Label htmlFor="payment_status">{t('subscriptions.paymentStatus')}</Label>
              <select
                id="payment_status"
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="unpaid">{t('subscriptions.paymentStatus.unpaid')}</option>
                <option value="paid">{t('subscriptions.paymentStatus.paid')}</option>
                <option value="partially_paid">{t('subscriptions.paymentStatus.partiallyPaid')}</option>
                <option value="failed">{t('subscriptions.paymentStatus.failed')}</option>
                <option value="refunded">{t('subscriptions.paymentStatus.refunded')}</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="payment_method">{t('subscriptions.paymentMethod')}</Label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t('subscriptions.selectPaymentMethod')}</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="wire_transfer">Wire Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity & Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('subscriptions.capacity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Users */}
            <div>
              <Label htmlFor="max_users">{t('subscriptions.maxUsers')} *</Label>
              <Input
                type="number"
                id="max_users"
                name="max_users"
                value={formData.max_users}
                onChange={handleChange}
                min="1"
              />
              {errors.max_users && (
                <p className="text-red-600 text-sm mt-1">{errors.max_users}</p>
              )}
            </div>

            {/* Current Users */}
            <div>
              <Label htmlFor="current_users">{t('subscriptions.currentUsers')}</Label>
              <Input
                type="number"
                id="current_users"
                name="current_users"
                value={formData.current_users}
                onChange={handleChange}
                min="0"
              />
              {errors.current_users && (
                <p className="text-red-600 text-sm mt-1">{errors.current_users}</p>
              )}
            </div>

            {/* Max Storage GB */}
            <div>
              <Label htmlFor="max_storage_gb">{t('subscriptions.maxStorage')} (GB)</Label>
              <Input
                type="number"
                id="max_storage_gb"
                name="max_storage_gb"
                value={formData.max_storage_gb}
                onChange={handleChange}
                min="0"
              />
            </div>

            {/* Current Storage GB */}
            <div>
              <Label htmlFor="current_storage_gb">{t('subscriptions.currentStorage')} (GB)</Label>
              <Input
                type="number"
                id="current_storage_gb"
                name="current_storage_gb"
                value={formData.current_storage_gb}
                onChange={handleChange}
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.billingContact')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="billing_contact_name">{t('subscriptions.contactName')}</Label>
              <Input
                id="billing_contact_name"
                name="billing_contact_name"
                value={formData.billing_contact_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="billing_contact_email">{t('subscriptions.contactEmail')}</Label>
              <Input
                type="email"
                id="billing_contact_email"
                name="billing_contact_email"
                value={formData.billing_contact_email}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="billing_contact_phone">{t('subscriptions.contactPhone')}</Label>
              <Input
                id="billing_contact_phone"
                name="billing_contact_phone"
                value={formData.billing_contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('subscriptions.notes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={t('subscriptions.notesPlaceholder')}
          />
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="w-4 h-4 mr-2" />
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="w-4 h-4 mr-2" />
          {loading ? t('common.saving') : subscription ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
};
