/**
 * SubscriptionForm Component
 * Form for creating and editing tenant subscriptions
 * 
 * ✅ UPDATED 2026-01-20:
 * - Integrated with Service Packages (Plans)
 * - Integrated with Tenants
 * - Auto-fill pricing and limits from selected plan
 * - Strict type checking with tenantSubscriptionsApi
 */

import React, { useState, useEffect } from 'react';
import { 
  TenantSubscription, 
  SubscriptionStatus, 
  BillingCycle, 
  PaymentStatus,
  generateSubscriptionNumber,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest
} from '../../api/tenantSubscriptionsApi';
import { tenantsApi, Tenant } from '../../api/tenantsApi';
import { packagesApi, Package } from '../../api/packagesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useLanguage } from '../../providers/LanguageProvider';
import { 
  CreditCard, Calendar, DollarSign, Users,
  Save, X, Sparkles, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface SubscriptionFormProps {
  subscription?: TenantSubscription;
  onSubmit: (data: any) => void;
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
  
  // Data Sources
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<Partial<CreateSubscriptionRequest>>({
    tenant_id: '',
    plan_id: '',
    subscription_number: '',
    subscription_name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active' as SubscriptionStatus,
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

  // Load Tenants and Packages
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [tenantsData, packagesData] = await Promise.all([
          tenantsApi.getAll(),
          packagesApi.getAll({ status: 'ACTIVE' })
        ]);
        setTenants(tenantsData);
        setPackages(packagesData);
      } catch (err) {
        console.error('Failed to load form data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Initialize Form Data
  useEffect(() => {
    if (subscription) {
      setFormData({
        ...subscription,
        plan_id: subscription.plan_id || '', // Ensure string for select
      });
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

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const packageId = e.target.value;
    const selectedPkg = packages.find(p => p._id === packageId);

    if (selectedPkg) {
      setFormData(prev => ({
        ...prev,
        plan_id: selectedPkg._id,
        plan_name: selectedPkg.name,
        base_price: selectedPkg.price_amount,
        currency: selectedPkg.currency_code,
        billing_cycle: (selectedPkg.billing_cycle?.toLowerCase() || 'monthly') as BillingCycle,
        max_users: selectedPkg.features?.max_users || prev.max_users,
        max_storage_gb: selectedPkg.features?.max_storage || prev.max_storage_gb,
        is_trial: !!selectedPkg.features?.trial_days,
        trial_end_date: selectedPkg.features?.trial_days 
          ? new Date(Date.now() + selectedPkg.features.trial_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
          : prev.trial_end_date
      }));
    } else {
      setFormData(prev => ({ ...prev, plan_id: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subscription_name?.trim()) newErrors.subscription_name = t('subscriptions.errors.nameRequired');
    if (!formData.subscription_number?.trim()) newErrors.subscription_number = t('subscriptions.errors.numberRequired');
    if (!formData.tenant_id?.trim()) newErrors.tenant_id = t('subscriptions.errors.tenantRequired');
    if (!formData.start_date) newErrors.start_date = t('subscriptions.errors.startDateRequired');
    if (!formData.end_date) newErrors.end_date = t('subscriptions.errors.endDateRequired');
    
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = t('subscriptions.errors.endDateInvalid');
    }
    
    if ((formData.base_price || 0) < 0) newErrors.base_price = t('subscriptions.errors.priceInvalid');
    if ((formData.max_users || 0) <= 0) newErrors.max_users = t('subscriptions.errors.maxUsersInvalid');
    
    if ((formData.current_users || 0) > (formData.max_users || 1)) {
      newErrors.current_users = t('subscriptions.errors.currentUsersExceeded');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        ...formData,
        // Ensure plan_id is strictly null if empty string
        plan_id: formData.plan_id || null,
      };
      
      if (subscription) {
        // Include version for optimistic locking
        (submitData as any).version = subscription.version;
      }
      
      onSubmit(submitData);
    }
  };

  if (loadingData) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

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
            </div>

            {/* Tenant Selection */}
            <div>
              <Label htmlFor="tenant_id">{t('subscriptions.tenant')} *</Label>
              <select
                id="tenant_id"
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!!subscription} // Cannot change tenant on edit
              >
                <option value="">{t('common.select')}...</option>
                {tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} ({tenant.code})
                  </option>
                ))}
              </select>
              {errors.tenant_id && <p className="text-red-600 text-sm mt-1">{errors.tenant_id}</p>}
            </div>

            {/* Subscription Name */}
            <div>
              <Label htmlFor="subscription_name">{t('subscriptions.subscriptionName')} *</Label>
              <Input
                id="subscription_name"
                name="subscription_name"
                value={formData.subscription_name}
                onChange={handleChange}
                placeholder="Ex: Standard Monthly Plan"
              />
              {errors.subscription_name && <p className="text-red-600 text-sm mt-1">{errors.subscription_name}</p>}
            </div>

            {/* Plan Selection */}
            <div>
              <Label htmlFor="plan_id">{t('subscriptions.plan')}</Label>
              <select
                id="plan_id"
                name="plan_id"
                value={formData.plan_id || ''}
                onChange={handlePackageChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- {t('subscriptions.selectPlan')} --</option>
                {packages.map(pkg => (
                  <option key={pkg._id} value={pkg._id}>
                    {pkg.name} ({pkg.price_amount} {pkg.currency_code})
                  </option>
                ))}
              </select>
              {formData.plan_name && <p className="text-xs text-gray-500 mt-1">Current: {formData.plan_name}</p>}
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
              {errors.start_date && <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>}
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
              {errors.end_date && <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>}
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
                <option value="pending">Pending</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
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
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Trial End Date */}
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
            <div className="space-y-2 pt-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_trial"
                  name="is_trial"
                  checked={formData.is_trial}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="is_trial" className="flex items-center gap-2 cursor-pointer">
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
                <Label htmlFor="auto_renew" className="cursor-pointer">{t('subscriptions.autoRenew')}</Label>
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
              {errors.base_price && <p className="text-red-600 text-sm mt-1">{errors.base_price}</p>}
            </div>

            {/* Discount */}
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

            {/* Tax */}
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

            {/* Total */}
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
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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
              {errors.max_users && <p className="text-red-600 text-sm mt-1">{errors.max_users}</p>}
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
              {errors.current_users && <p className="text-red-600 text-sm mt-1">{errors.current_users}</p>}
            </div>

            {/* Max Storage */}
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

            {/* Current Storage */}
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
