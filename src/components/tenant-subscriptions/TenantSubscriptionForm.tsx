/**
 * Tenant Subscription Form Component
 * Form for creating/editing tenant subscriptions
 * 
 * Compliant with tenant_subscriptions schema (42 fields)
 */

import React, { useState, useEffect } from 'react';
import { 
  TenantSubscription, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest, 
  SubscriptionStatus,
  BillingCycle
} from '../../api/tenantSubscriptionsApi';
import { servicePackagesApi, ServicePackage } from '../../api/servicePackagesApi';
import { tenantsApi } from '../../api/tenantsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Calendar } from 'lucide-react';

interface TenantSubscriptionFormProps {
  initialData?: TenantSubscription | null;
  onSubmit: (data: CreateSubscriptionRequest | UpdateSubscriptionRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const STATUSES: { value: SubscriptionStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'pending', label: 'Pending' },
];

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

export function TenantSubscriptionForm({ initialData, onSubmit, onCancel, loading }: TenantSubscriptionFormProps) {
  // Related Data
  const [plans, setPlans] = useState<ServicePackage[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    tenant_id: '',
    plan_id: '',
    subscription_name: '',
    status: 'active' as SubscriptionStatus,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    trial_end_date: '',
    renewal_date: '',
    auto_renew: true,
    is_trial: false,
    billing_cycle: 'monthly' as BillingCycle,
    base_price: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: 'USD',
    max_users: 1,
    current_users: 0,
    max_storage_gb: 10,
    current_storage_gb: 0,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, tenantsData] = await Promise.all([
          servicePackagesApi.getAll({ is_active: true }),
          tenantsApi.getAll()
        ]);
        setPlans(plansData);
        setTenants(tenantsData);
        
        // Auto-fill tenant if not editing and tenants exist
        if (!initialData && tenantsData.length > 0) {
            setFormData(prev => ({ ...prev, tenant_id: tenantsData[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load form data', err);
      }
    };
    fetchData();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        tenant_id: initialData.tenant_id,
        plan_id: initialData.plan_id || '',
        subscription_name: initialData.subscription_name,
        status: initialData.status,
        start_date: initialData.start_date.split('T')[0],
        end_date: initialData.end_date.split('T')[0],
        trial_end_date: initialData.trial_end_date ? initialData.trial_end_date.split('T')[0] : '',
        renewal_date: initialData.renewal_date ? initialData.renewal_date.split('T')[0] : '',
        auto_renew: initialData.auto_renew,
        is_trial: initialData.is_trial,
        billing_cycle: initialData.billing_cycle,
        base_price: initialData.base_price,
        discount_amount: initialData.discount_amount,
        tax_amount: initialData.tax_amount,
        total_amount: initialData.total_amount,
        currency: initialData.currency,
        max_users: initialData.max_users,
        current_users: initialData.current_users,
        max_storage_gb: initialData.max_storage_gb,
        current_storage_gb: initialData.current_storage_gb,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  // Handle plan selection to auto-fill details
  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p._id === planId);
    if (plan) {
      setFormData(prev => ({
        ...prev,
        plan_id: planId,
        subscription_name: plan.package_name,
        base_price: plan.price,
        total_amount: plan.price, // Reset discounts/tax
        billing_cycle: plan.billing_cycle as BillingCycle,
        // Also could parse limits/features here
      }));
    } else {
      setFormData(prev => ({ ...prev, plan_id: planId }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.tenant_id) newErrors.tenant_id = 'Tenant is required';
    if (!formData.subscription_name) newErrors.subscription_name = 'Name is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const commonData = {
        subscription_name: formData.subscription_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        trial_end_date: formData.trial_end_date || null,
        renewal_date: formData.renewal_date || null,
        status: formData.status,
        auto_renew: formData.auto_renew,
        is_trial: formData.is_trial,
        billing_cycle: formData.billing_cycle,
        base_price: formData.base_price,
        discount_amount: formData.discount_amount,
        tax_amount: formData.tax_amount,
        total_amount: formData.total_amount,
        currency: formData.currency,
        max_users: formData.max_users,
        current_users: formData.current_users,
        max_storage_gb: formData.max_storage_gb,
        current_storage_gb: formData.current_storage_gb,
        notes: formData.notes || null,
        plan_id: formData.plan_id || null,
      };

      if (initialData) {
        await onSubmit({
          ...commonData,
          version: initialData.version
        } as UpdateSubscriptionRequest);
      } else {
        await onSubmit({
          tenant_id: formData.tenant_id,
          ...commonData
        } as CreateSubscriptionRequest);
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
     setFormData(prev => ({ ...prev, [field]: value }));
     if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
       {/* 1. Identity & Plan */}
       <div className="space-y-4">
         <h3 className="text-lg font-semibold border-b pb-2">Identity & Plan</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <Label htmlFor="tenant">Tenant <span className="text-red-500">*</span></Label>
             <Select 
               value={formData.tenant_id} 
               onValueChange={(v) => handleChange('tenant_id', v)}
               disabled={!!initialData}
             >
               <SelectTrigger id="tenant" className={errors.tenant_id ? 'border-red-500' : ''}>
                 <SelectValue placeholder="Select Tenant" />
               </SelectTrigger>
               <SelectContent>
                 {tenants.map(t => (
                   <SelectItem key={t._id} value={t._id}>{t.name} ({t.code})</SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {errors.tenant_id && <p className="text-sm text-red-500 mt-1">{errors.tenant_id}</p>}
           </div>

           <div>
             <Label htmlFor="plan">Service Plan</Label>
             <Select 
               value={formData.plan_id} 
               onValueChange={handlePlanChange}
             >
               <SelectTrigger id="plan">
                 <SelectValue placeholder="Select Plan (Optional)" />
               </SelectTrigger>
               <SelectContent>
                 {plans.map(p => (
                   <SelectItem key={p._id} value={p._id}>{p.package_name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>

         <div>
           <Label htmlFor="name">Subscription Name <span className="text-red-500">*</span></Label>
           <Input
             id="name"
             value={formData.subscription_name}
             onChange={(e) => handleChange('subscription_name', e.target.value)}
             className={errors.subscription_name ? 'border-red-500' : ''}
           />
           {errors.subscription_name && <p className="text-sm text-red-500 mt-1">{errors.subscription_name}</p>}
         </div>
       </div>

       {/* 2. Dates & Status */}
       <div className="space-y-4">
         <h3 className="text-lg font-semibold border-b pb-2">Dates & Status</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Start Date <span className="text-red-500">*</span></Label>
              <Input 
                type="date" 
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className={errors.start_date ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label>End Date <span className="text-red-500">*</span></Label>
              <Input 
                type="date" 
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className={errors.end_date ? 'border-red-500' : ''}
              />
            </div>
            <div>
              <Label>Renewal Date</Label>
              <Input 
                type="date" 
                value={formData.renewal_date}
                onChange={(e) => handleChange('renewal_date', e.target.value)}
              />
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
             <Label htmlFor="status">Status</Label>
             <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
               <SelectTrigger id="status"><SelectValue /></SelectTrigger>
               <SelectContent>
                 {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           
           <div className="flex items-center gap-2 pt-8">
             <Switch 
               id="auto_renew" 
               checked={formData.auto_renew}
               onCheckedChange={(c) => handleChange('auto_renew', c)}
             />
             <Label htmlFor="auto_renew">Auto Renew</Label>
           </div>

           <div className="flex items-center gap-2 pt-8">
             <Switch 
               id="is_trial" 
               checked={formData.is_trial}
               onCheckedChange={(c) => handleChange('is_trial', c)}
             />
             <Label htmlFor="is_trial">Is Trial</Label>
           </div>
         </div>
       </div>

       {/* 3. Pricing */}
       <div className="space-y-4">
         <h3 className="text-lg font-semibold border-b pb-2">Pricing</h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Base Price</Label>
              <Input 
                type="number" 
                min="0"
                value={formData.base_price}
                onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Discount</Label>
              <Input 
                type="number" 
                min="0"
                value={formData.discount_amount}
                onChange={(e) => handleChange('discount_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Tax</Label>
              <Input 
                type="number" 
                min="0"
                value={formData.tax_amount}
                onChange={(e) => handleChange('tax_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Total Amount</Label>
              <Input 
                type="number" 
                min="0"
                value={formData.total_amount}
                onChange={(e) => handleChange('total_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <Label>Billing Cycle</Label>
             <Select value={formData.billing_cycle} onValueChange={(v) => handleChange('billing_cycle', v)}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 {BILLING_CYCLES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
           <div>
             <Label>Currency</Label>
             <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="USD">USD</SelectItem>
                 <SelectItem value="VND">VND</SelectItem>
                 <SelectItem value="EUR">EUR</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </div>
       </div>

       {/* 4. Limits */}
       <div className="space-y-4">
         <h3 className="text-lg font-semibold border-b pb-2">Limits & Usage</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Max Users</Label>
              <Input 
                type="number" 
                min="1"
                value={formData.max_users}
                onChange={(e) => handleChange('max_users', parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Max Storage (GB)</Label>
              <Input 
                type="number" 
                min="0"
                value={formData.max_storage_gb}
                onChange={(e) => handleChange('max_storage_gb', parseInt(e.target.value) || 0)}
              />
            </div>
         </div>
       </div>

       {/* 5. Notes */}
       <div className="space-y-4">
         <Label>Notes</Label>
         <Textarea 
           rows={3}
           value={formData.notes}
           onChange={(e) => handleChange('notes', e.target.value)}
         />
       </div>

       {/* Actions */}
       <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || loading}>
            {submitting || loading ? 'Saving...' : initialData ? 'Update Subscription' : 'Create Subscription'}
          </Button>
       </div>
    </form>
  );
}
