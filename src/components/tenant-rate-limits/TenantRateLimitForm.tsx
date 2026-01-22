'use client';

import React, { useState, useEffect } from 'react';
import { 
  TenantRateLimit, 
  CreateRateLimitRequest, 
  UpdateRateLimitRequest,
  LimitType,
  LimitScope,
  ResourceType,
  WindowUnit
} from '../../api/tenantRateLimitsApi';
import { tenantsApi, Tenant } from '../../api/tenantsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Activity, Shield, Settings, Code, AlertTriangle } from 'lucide-react';
import { showToast } from '../../lib/toast';

interface TenantRateLimitFormProps {
  initialData?: TenantRateLimit;
  isEdit?: boolean;
  onSubmit: (data: CreateRateLimitRequest | UpdateRateLimitRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TenantRateLimitForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  loading = false 
}: TenantRateLimitFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(initialData?.metadata || {}, null, 2)
  );

  const [formData, setFormData] = useState<Partial<CreateRateLimitRequest>>({
    tenant_id: initialData?.tenant_id || '',
    limit_name: initialData?.limit_name || '',
    limit_key: initialData?.limit_key || '',
    description: initialData?.description || '',
    resource_type: initialData?.resource_type || 'api',
    endpoint_pattern: initialData?.endpoint_pattern || '/*',
    
    max_requests: initialData?.max_requests ?? 1000,
    time_window: initialData?.time_window ?? 60,
    window_unit: initialData?.window_unit || 'second',
    burst_limit: initialData?.burst_limit ?? 0,
    concurrent_limit: initialData?.concurrent_limit ?? 0,
    
    limit_type: initialData?.limit_type || 'sliding_window',
    limit_scope: initialData?.limit_scope || 'tenant',
    
    is_enabled: initialData?.is_enabled ?? true,
    is_strict: initialData?.is_strict ?? true,
    block_duration: initialData?.block_duration ?? 0,
    retry_after: initialData?.retry_after ?? 0,
    custom_error_code: initialData?.custom_error_code || '429',
    custom_error_message: initialData?.custom_error_message || 'Too Many Requests',
  });

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const data = await tenantsApi.getAll();
        setTenants(data);
      } catch (err) {
        console.error('Failed to load tenants', err);
        showToast.error('Error', 'Failed to load tenants list');
      }
    };
    if (!isEdit) {
      loadTenants();
    }
  }, [isEdit]);

  const handleChange = (field: keyof CreateRateLimitRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJsonChange = (value: string) => {
    setMetadataJson(value);
  };

  const validate = () => {
    if (!formData.limit_name?.trim()) return 'Limit Name is required';
    if (!formData.limit_key?.trim()) return 'Limit Key is required';
    if (!formData.tenant_id && !isEdit) return 'Tenant is required';
    if ((formData.max_requests || 0) <= 0) return 'Max Requests must be > 0';
    if ((formData.time_window || 0) <= 0) return 'Time Window must be > 0';
    
    try {
      JSON.parse(metadataJson);
    } catch (e) {
      return 'Invalid JSON metadata';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      showToast.error('Validation Error', error);
      return;
    }

    try {
      const payload = {
        ...formData,
        metadata: JSON.parse(metadataJson),
      };
      await onSubmit(payload as any);
    } catch (err: any) {
      // Error handled by parent usually, but just in case
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-10">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="basic">Basic Config</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* --- BASIC CONFIG --- */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                General Information
              </CardTitle>
              <CardDescription>Define the scope and target of this rate limit</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <Label className="required">Tenant</Label>
                {isEdit ? (
                  <Input value={initialData?.tenant_id} disabled className="bg-gray-100" />
                ) : (
                  <Select 
                    value={formData.tenant_id} 
                    onValueChange={(v) => handleChange('tenant_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tenant..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label className="required">Limit Name</Label>
                <Input 
                  placeholder="e.g. Standard API Tier"
                  value={formData.limit_name}
                  onChange={e => handleChange('limit_name', e.target.value)}
                />
              </div>

              <div>
                <Label className="required">Limit Key (Unique)</Label>
                <Input 
                  placeholder="e.g. limit_api_std_v1"
                  value={formData.limit_key}
                  onChange={e => handleChange('limit_key', e.target.value)}
                  className="font-mono"
                />
              </div>

              <div>
                <Label>Resource Type</Label>
                <Select 
                  value={formData.resource_type} 
                  onValueChange={(v) => handleChange('resource_type', v as ResourceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">API Endpoint</SelectItem>
                    <SelectItem value="storage">Storage Access</SelectItem>
                    <SelectItem value="database">Database Query</SelectItem>
                    <SelectItem value="compute">Compute/Job</SelectItem>
                    <SelectItem value="email">Email Sending</SelectItem>
                    <SelectItem value="sms">SMS Sending</SelectItem>
                    <SelectItem value="network">Network Bandwidth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Endpoint Pattern</Label>
                <Input 
                  placeholder="e.g. /api/v1/*"
                  value={formData.endpoint_pattern}
                  onChange={e => handleChange('endpoint_pattern', e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Glob pattern to match resources</p>
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Internal notes about this limit..."
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 md:col-span-2">
                <div>
                  <Label className="text-base">Enabled</Label>
                  <p className="text-xs text-gray-500">Master switch for this rule</p>
                </div>
                <Switch 
                  checked={formData.is_enabled}
                  onCheckedChange={c => handleChange('is_enabled', c)}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* --- THRESHOLDS --- */}
        <TabsContent value="thresholds" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Rate Limits & Windows
              </CardTitle>
              <CardDescription>Configure the actual numbers for the rate limiter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="required">Max Requests</Label>
                  <Input 
                    type="number" 
                    min={1}
                    value={formData.max_requests}
                    onChange={e => handleChange('max_requests', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Requests allowed in window</p>
                </div>

                <div>
                  <Label className="required">Time Window</Label>
                  <Input 
                    type="number" 
                    min={1}
                    value={formData.time_window}
                    onChange={e => handleChange('time_window', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Duration value</p>
                </div>

                <div>
                  <Label className="required">Window Unit</Label>
                  <Select 
                    value={formData.window_unit} 
                    onValueChange={(v) => handleChange('window_unit', v as WindowUnit)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="second">Seconds</SelectItem>
                      <SelectItem value="minute">Minutes</SelectItem>
                      <SelectItem value="hour">Hours</SelectItem>
                      <SelectItem value="day">Days</SelectItem>
                      <SelectItem value="month">Months</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Duration unit</p>
                </div>
              </div>

              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                  <Label>Algorithm (Strategy)</Label>
                  <Select 
                    value={formData.limit_type} 
                    onValueChange={(v) => handleChange('limit_type', v as LimitType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_window">Fixed Window</SelectItem>
                      <SelectItem value="sliding_window">Sliding Window</SelectItem>
                      <SelectItem value="token_bucket">Token Bucket</SelectItem>
                      <SelectItem value="leaky_bucket">Leaky Bucket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Limit Scope</Label>
                  <Select 
                    value={formData.limit_scope} 
                    onValueChange={(v) => handleChange('limit_scope', v as LimitScope)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">Tenant Wide</SelectItem>
                      <SelectItem value="user">Per User</SelectItem>
                      <SelectItem value="ip">Per IP Address</SelectItem>
                      <SelectItem value="api_key">Per API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div>
                   <Label>Burst Limit (Optional)</Label>
                   <Input 
                    type="number"
                    min={0}
                    placeholder="0 = No burst"
                    value={formData.burst_limit || ''}
                    onChange={e => handleChange('burst_limit', parseInt(e.target.value) || 0)}
                   />
                   <p className="text-xs text-gray-500 mt-1">Extra requests allowed over limit (Token Bucket)</p>
                </div>
                <div>
                   <Label>Concurrent Limit (Optional)</Label>
                   <Input 
                    type="number"
                    min={0}
                    placeholder="0 = Unlimited"
                    value={formData.concurrent_limit || ''}
                    onChange={e => handleChange('concurrent_limit', parseInt(e.target.value) || 0)}
                   />
                   <p className="text-xs text-gray-500 mt-1">Max simultaneous connections</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADVANCED --- */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Enforcement Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Strict Enforcement</Label>
                  <p className="text-xs text-gray-500">If disabled, requests are just logged, not blocked (Audit Mode)</p>
                </div>
                <Switch 
                  checked={formData.is_strict}
                  onCheckedChange={c => handleChange('is_strict', c)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Error Code</Label>
                  <Input 
                    value={formData.custom_error_code}
                    onChange={e => handleChange('custom_error_code', e.target.value)}
                    placeholder="429"
                  />
                </div>
                <div>
                  <Label>Error Message</Label>
                  <Input 
                    value={formData.custom_error_message}
                    onChange={e => handleChange('custom_error_message', e.target.value)}
                    placeholder="Too Many Requests"
                  />
                </div>
                <div>
                  <Label>Block Duration (Seconds)</Label>
                  <Input 
                    type="number"
                    min={0}
                    value={formData.block_duration || ''}
                    onChange={e => handleChange('block_duration', parseInt(e.target.value))}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time to ban client after violation</p>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4" /> Metadata (JSON)
                </Label>
                <Textarea 
                  value={metadataJson}
                  onChange={e => handleJsonChange(e.target.value)}
                  className="font-mono text-xs"
                  rows={6}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : (isEdit ? 'Update Limit' : 'Create Limit')}
        </Button>
      </div>
    </form>
  );
}