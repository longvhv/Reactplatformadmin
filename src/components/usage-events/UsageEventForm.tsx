/**
 * Usage Event Form Component
 * Form for creating/editing usage events
 * ✅ Compliant with usage_events schema
 */

import React, { useState, useEffect } from 'react';
import { 
  UsageEvent, 
  CreateUsageEventRequest, 
  getEventTypeLabel 
} from '@/api/usageEventsApi';
import { tenantsApi, Tenant } from '@/api/tenantsApi';
import { tenantSubscriptionsApi, TenantSubscription } from '@/api/tenantSubscriptionsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Save, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UsageEventFormProps {
  initialData?: UsageEvent;
  onSubmit: (data: CreateUsageEventRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EVENT_TYPES = [
  'api_call',
  'storage',
  'bandwidth',
  'compute',
  'request',
  'user_login',
  'data_transfer',
  'function_execution'
];

const DATA_REGIONS = [
  'ap-southeast-1',
  'us-east-1',
  'eu-central-1'
];

export function UsageEventForm({ initialData, onSubmit, onCancel, loading }: UsageEventFormProps) {
  const isEdit = !!initialData;
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<CreateUsageEventRequest>({
    tenant_id: '',
    subscription_id: '',
    app_code: '',
    event_type: 'api_call',
    quantity: 0,
    unit: 'requests',
    metadata: {},
    data_region: 'ap-southeast-1',
    timestamp: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
  });

  const [jsonInput, setJsonInput] = useState('{}');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data and tenants
  useEffect(() => {
    loadTenants();
    if (initialData) {
      setFormData({
        tenant_id: initialData.tenant_id || '',
        subscription_id: initialData.subscription_id || '',
        app_code: initialData.app_code || '',
        event_type: initialData.event_type || 'api_call',
        quantity: initialData.quantity,
        unit: initialData.unit || '',
        metadata: initialData.metadata || {},
        data_region: initialData.data_region || 'ap-southeast-1',
        timestamp: initialData.timestamp ? new Date(initialData.timestamp).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      });
      setJsonInput(JSON.stringify(initialData.metadata || {}, null, 2));
    }
  }, [initialData]);

  // Fetch subscriptions when tenant changes
  useEffect(() => {
    if (formData.tenant_id) {
      loadSubscriptions(formData.tenant_id);
    } else {
      setSubscriptions([]);
    }
  }, [formData.tenant_id]);

  const loadTenants = async () => {
    try {
      const data = await tenantsApi.getAll();
      setTenants(data);
    } catch (error) {
      console.error('Failed to load tenants', error);
    }
  };

  const loadSubscriptions = async (tenantId: string) => {
    setLoadingSubscriptions(true);
    try {
      const data = await tenantSubscriptionsApi.getAll({ tenant_id: tenantId });
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to load subscriptions', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenant_id) {
      newErrors.tenant_id = 'Tenant is required';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity must be non-negative';
    }

    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }

    try {
      const parsed = JSON.parse(jsonInput);
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        newErrors.metadata = 'Metadata must be a JSON object {}';
      }
    } catch (e) {
      newErrors.metadata = 'Invalid JSON format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const metadata = JSON.parse(jsonInput);
      
      const submitData: CreateUsageEventRequest = {
        ...formData,
        metadata,
        timestamp: new Date(formData.timestamp as string).toISOString(),
        subscription_id: formData.subscription_id || undefined, // Send undefined if empty string
        app_code: formData.app_code || undefined,
      };

      onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error', error);
    }
  };

  const updateField = (field: keyof CreateUsageEventRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field as string];
        return newErrs;
      });
    }

    // Reset subscription if tenant changes
    if (field === 'tenant_id') {
      setFormData(prev => ({ ...prev, subscription_id: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            {isEdit ? 'Edit Usage Event' : 'Record Usage Event'}
          </CardTitle>
          <CardDescription>
            Manually record or correct usage events for billing and analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {isEdit && (
            <Alert variant="warning" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-500 [&>svg]:text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Immutable Data Warning</AlertTitle>
              <AlertDescription className="text-xs text-yellow-600/90 dark:text-yellow-500/90">
                Usage events are typically immutable. Editing this may cause discrepancies in billing reports generated prior to this change.
              </AlertDescription>
            </Alert>
          )}

          {/* TENANT & SUBSCRIPTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.tenant_id} 
                onValueChange={val => updateField('tenant_id', val)}
                disabled={isEdit} // Tenant usually shouldn't change on edit
              >
                <SelectTrigger className={errors.tenant_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant._id} value={tenant._id}>
                      {tenant.name} ({tenant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenant_id && <p className="text-sm text-destructive">{errors.tenant_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_id">Subscription</Label>
              <Select 
                value={formData.subscription_id} 
                onValueChange={val => updateField('subscription_id', val)}
                disabled={!formData.tenant_id || loadingSubscriptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingSubscriptions 
                      ? "Loading..." 
                      : (subscriptions.length === 0 && formData.tenant_id ? "No subscriptions found" : "Select subscription (Optional)")
                  } />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions.map(sub => (
                    <SelectItem key={sub._id} value={sub._id}>
                      {sub.subscription_name} ({sub.subscription_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* EVENT DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type <span className="text-destructive">*</span></Label>
              <Select 
                value={formData.event_type} 
                onValueChange={val => updateField('event_type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {getEventTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity <span className="text-destructive">*</span></Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={e => updateField('quantity', parseFloat(e.target.value))}
                className={errors.quantity ? 'border-destructive' : ''}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={e => updateField('unit', e.target.value)}
                placeholder="e.g. requests, GB, hours"
              />
            </div>
          </div>

          {/* CONTEXT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="app_code">App Code</Label>
              <Input
                id="app_code"
                value={formData.app_code}
                onChange={e => updateField('app_code', e.target.value)}
                placeholder="e.g. CRM, CMS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_region">Data Region</Label>
              <Select 
                value={formData.data_region} 
                onValueChange={val => updateField('data_region', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {DATA_REGIONS.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Timestamp</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp}
                onChange={e => updateField('timestamp', e.target.value)}
              />
            </div>
          </div>

          {/* METADATA */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON Object)</Label>
            <Textarea
              id="metadata"
              value={jsonInput}
              onChange={e => {
                setJsonInput(e.target.value);
                if (errors.metadata) {
                  setErrors(prev => {
                    const newErrs = { ...prev };
                    delete newErrs.metadata;
                    return newErrs;
                  });
                }
              }}
              className={`font-mono text-sm ${errors.metadata ? 'border-destructive' : ''}`}
              rows={5}
              placeholder="{}"
            />
            {errors.metadata && <p className="text-sm text-destructive">{errors.metadata}</p>}
            <p className="text-xs text-muted-foreground">
              Additional context for this event. Must be a JSON object.
            </p>
          </div>

        </CardContent>
      </Card>

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              {isEdit ? 'Update Event' : 'Record Event'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
