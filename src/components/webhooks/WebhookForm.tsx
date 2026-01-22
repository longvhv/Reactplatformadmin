/**
 * WebhookForm Component
 * Reusable form for creating/editing webhooks
 * Includes tenant selection, event filtering, and metadata
 */

import React, { useState, useEffect } from 'react';
import { Webhook, CreateWebhookRequest, UpdateWebhookRequest } from '../../api/webhooksApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Webhook as WebhookIcon, 
  Link as LinkIcon, 
  Shield, 
  Clock,
  Zap,
  Tag,
  Settings,
  AlertCircle,
  Database,
  FileJson
} from 'lucide-react';
import { DEFAULT_TENANT_ID } from '../../constants/tenant-constants';
import { useTenants } from '../../hooks/useTenants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface WebhookFormProps {
  initialData?: Webhook;
  onSubmit: (data: CreateWebhookRequest | UpdateWebhookRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

// Common webhook events
const COMMON_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'tenant.created',
  'tenant.updated',
  'tenant.deleted',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
  'order.created',
  'order.completed',
  'order.failed',
  'payment.succeeded',
  'payment.failed',
  'invoice.created',
  'invoice.paid',
];

export function WebhookForm({ initialData, onSubmit, onCancel, isLoading, mode }: WebhookFormProps) {
  const { tenants } = useTenants();
  
  const [formData, setFormData] = useState({
    tenant_id: initialData?.tenant_id || DEFAULT_TENANT_ID,
    name: initialData?.name || '',
    description: initialData?.description || '',
    url: initialData?.url || '',
    method: initialData?.method || 'POST' as const,
    event_types: initialData?.event_types || [],
    event_filter: initialData?.event_filter ? JSON.stringify(initialData.event_filter, null, 2) : '',
    secret_key: initialData?.secret_key || '',
    auth_type: initialData?.auth_type || 'none' as const,
    auth_config: initialData?.auth_config ? JSON.stringify(initialData.auth_config, null, 2) : '',
    headers: initialData?.headers || {},
    timeout_ms: initialData?.timeout_ms || 30000,
    retry_config: {
      max_retries: initialData?.retry_config?.max_retries || 3,
      retry_delay: initialData?.retry_config?.retry_delay || 1000,
      backoff_multiplier: initialData?.retry_config?.backoff_multiplier || 2,
    },
    batch_size: initialData?.batch_size || 1,
    rate_limit: initialData?.rate_limit || 100,
    priority: initialData?.priority || 0,
    tags: initialData?.tags || [],
    metadata: initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '',
    is_active: initialData?.is_active ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(
    new Set(initialData?.event_types || [])
  );
  const [customEvent, setCustomEvent] = useState('');
  const [customHeader, setCustomHeader] = useState({ key: '', value: '' });
  const [customTag, setCustomTag] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRetryConfigChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      retry_config: { ...prev.retry_config, [field]: value }
    }));
  };

  const toggleEvent = (event: string) => {
    const newEvents = new Set(selectedEvents);
    if (newEvents.has(event)) {
      newEvents.delete(event);
    } else {
      newEvents.add(event);
    }
    setSelectedEvents(newEvents);
    handleChange('event_types', Array.from(newEvents));
  };

  const addCustomEvent = () => {
    if (customEvent && !selectedEvents.has(customEvent)) {
      toggleEvent(customEvent);
      setCustomEvent('');
    }
  };

  const addCustomHeader = () => {
    if (customHeader.key && customHeader.value) {
      handleChange('headers', {
        ...formData.headers,
        [customHeader.key]: customHeader.value,
      });
      setCustomHeader({ key: '', value: '' });
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    handleChange('headers', newHeaders);
  };

  const addTag = () => {
    if (customTag && !formData.tags.includes(customTag)) {
      handleChange('tags', [...formData.tags, customTag]);
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    handleChange('tags', formData.tags.filter(t => t !== tag));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên webhook là bắt buộc';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL là bắt buộc';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'URL không hợp lệ';
      }
    }

    if (selectedEvents.size === 0) {
      newErrors.event_types = 'Chọn ít nhất 1 event';
    }

    if (formData.timeout_ms < 1000 || formData.timeout_ms > 300000) {
      newErrors.timeout_ms = 'Timeout phải từ 1000ms đến 300000ms';
    }

    // Validate JSON fields
    const validateJson = (field: string, value: string) => {
      if (!value) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        newErrors[field] = 'Invalid JSON format';
        return false;
      }
    };

    validateJson('event_filter', formData.event_filter);
    validateJson('auth_config', formData.auth_config);
    validateJson('metadata', formData.metadata);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const submitData: any = {
      ...formData,
      event_types: Array.from(selectedEvents),
      event_filter: formData.event_filter ? JSON.parse(formData.event_filter) : undefined,
      auth_config: formData.auth_config ? JSON.parse(formData.auth_config) : undefined,
      metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined,
      secret_key: formData.secret_key || undefined,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <WebhookIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Thông tin cơ bản
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Tenant Selection */}
            {mode === 'create' && tenants.length > 0 && (
              <div>
                <Label htmlFor="tenant_id">Tenant</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(value) => handleChange('tenant_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant._id} value={tenant._id}>
                        {tenant.name} ({tenant.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name */}
            <div>
              <Label htmlFor="name">
                Tên webhook <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="vd: User Notification Webhook"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Mô tả chi tiết về webhook này..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Is Active */}
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
               <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Kích hoạt webhook này</Label>
            </div>

            {/* Secret Key */}
            <div>
              <Label htmlFor="secret_key">Secret Key (HMAC)</Label>
              <Input
                id="secret_key"
                value={formData.secret_key}
                onChange={(e) => handleChange('secret_key', e.target.value)}
                placeholder="Optional: Used for signature verification"
                type="password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-generate or if not using HMAC signatures.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <LinkIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cấu hình đích
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Method */}
            <div className="md:col-span-1">
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => handleChange('method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL */}
            <div className="md:col-span-3">
              <Label htmlFor="url">
                Target URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com/webhooks/handler"
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.url}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Events <span className="text-red-500">*</span>
          </h2>
        </div>

        {errors.event_types && (
          <p className="text-sm text-red-500 mb-4 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.event_types}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {COMMON_EVENTS.map(event => (
            <label
              key={event}
              className="flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedEvents.has(event)}
                onChange={() => toggleEvent(event)}
                className="rounded text-indigo-600"
              />
              <span className="text-sm text-gray-900 dark:text-white break-all">{event}</span>
            </label>
          ))}
        </div>

        {/* Custom Event */}
        <div className="flex gap-2 max-w-md mb-6">
          <Input
            placeholder="Custom event (e.g. custom.event.type)"
            value={customEvent}
            onChange={(e) => setCustomEvent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEvent())}
          />
          <Button type="button" onClick={addCustomEvent} variant="outline">
            Thêm
          </Button>
        </div>

        {/* Selected Events Summary */}
        {selectedEvents.size > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Selected Events ({selectedEvents.size}):
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedEvents).map(event => (
                <span
                  key={event}
                  className="px-2 py-1 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs rounded flex items-center gap-1 shadow-sm"
                >
                  {event}
                  <button
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className="hover:text-red-600 dark:hover:text-red-400 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Event Filter (JSON) */}
        <div className="mt-6">
            <Label htmlFor="event_filter" className="flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                Event Filter (JSON)
            </Label>
            <Textarea
                id="event_filter"
                value={formData.event_filter}
                onChange={(e) => handleChange('event_filter', e.target.value)}
                placeholder='{"source": "mobile_app"}'
                className={`font-mono mt-2 ${errors.event_filter ? 'border-red-500' : ''}`}
                rows={4}
            />
            {errors.event_filter && (
                <p className="text-sm text-red-500 mt-1">{errors.event_filter}</p>
            )}
             <p className="text-xs text-gray-500 mt-1">Optional: Filter events based on payload properties using JSON logic.</p>
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Xác thực
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="auth_type">Loại xác thực</Label>
            <Select
              value={formData.auth_type}
              onValueChange={(value) => handleChange('auth_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auth Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auth Config (JSON) */}
          {formData.auth_type !== 'none' && (
              <div>
                <Label htmlFor="auth_config" className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    Auth Config (JSON)
                </Label>
                <Textarea
                    id="auth_config"
                    value={formData.auth_config}
                    onChange={(e) => handleChange('auth_config', e.target.value)}
                    placeholder='{"username": "user", "password": "..."}'
                    className={`font-mono mt-2 ${errors.auth_config ? 'border-red-500' : ''}`}
                    rows={4}
                />
                 {errors.auth_config && (
                    <p className="text-sm text-red-500 mt-1">{errors.auth_config}</p>
                )}
              </div>
          )}

          {/* Custom Headers */}
          <div>
            <Label>Custom Headers</Label>
            <div className="space-y-3 mt-2">
              {Object.entries(formData.headers).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono break-all">
                    {key}: {value as string}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeHeader(key)}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Header Key"
                  value={customHeader.key}
                  onChange={(e) => setCustomHeader(prev => ({ ...prev, key: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  placeholder="Header Value"
                  value={customHeader.value}
                  onChange={(e) => setCustomHeader(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1"
                />
                <Button type="button" onClick={addCustomHeader} variant="outline">
                  Thêm
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cài đặt nâng cao
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Timeout */}
          <div>
            <Label htmlFor="timeout_ms">
              Timeout (ms) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="timeout_ms"
              type="number"
              value={formData.timeout_ms}
              onChange={(e) => handleChange('timeout_ms', parseInt(e.target.value))}
              min={1000}
              max={300000}
              className={`mt-1 ${errors.timeout_ms ? 'border-red-500' : ''}`}
            />
            {errors.timeout_ms && (
              <p className="text-sm text-red-500 mt-1">{errors.timeout_ms}</p>
            )}
          </div>

          {/* Max Retries */}
          <div>
            <Label htmlFor="max_retries">Max Retries</Label>
            <Input
              id="max_retries"
              type="number"
              value={formData.retry_config.max_retries}
              onChange={(e) => handleRetryConfigChange('max_retries', parseInt(e.target.value))}
              min={0}
              max={10}
              className="mt-1"
            />
          </div>

          {/* Retry Delay */}
          <div>
            <Label htmlFor="retry_delay">Retry Delay (ms)</Label>
            <Input
              id="retry_delay"
              type="number"
              value={formData.retry_config.retry_delay}
              onChange={(e) => handleRetryConfigChange('retry_delay', parseInt(e.target.value))}
              min={100}
              className="mt-1"
            />
          </div>

          {/* Backoff Multiplier */}
          <div>
            <Label htmlFor="backoff_multiplier">Backoff Multiplier</Label>
            <Input
              id="backoff_multiplier"
              type="number"
              step="0.1"
              value={formData.retry_config.backoff_multiplier}
              onChange={(e) => handleRetryConfigChange('backoff_multiplier', parseFloat(e.target.value))}
              min={1}
              max={5}
              className="mt-1"
            />
          </div>

          {/* Batch Size */}
          <div>
            <Label htmlFor="batch_size">Batch Size</Label>
            <Input
              id="batch_size"
              type="number"
              value={formData.batch_size}
              onChange={(e) => handleChange('batch_size', parseInt(e.target.value))}
              min={1}
              max={1000}
              className="mt-1"
            />
          </div>

          {/* Rate Limit */}
          <div>
            <Label htmlFor="rate_limit">Rate Limit (requests/minute)</Label>
            <Input
              id="rate_limit"
              type="number"
              value={formData.rate_limit}
              onChange={(e) => handleChange('rate_limit', parseInt(e.target.value))}
              min={1}
              className="mt-1"
            />
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => handleChange('priority', parseInt(e.target.value))}
              min={0}
              max={10}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              0 = lowest, 10 = highest
            </p>
          </div>
        </div>
      </div>
      
       {/* Metadata */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Metadata
          </h2>
        </div>
         <div>
            <Label htmlFor="metadata" className="flex items-center gap-2">
                <FileJson className="w-4 h-4" />
                JSON Metadata
            </Label>
            <Textarea
                id="metadata"
                value={formData.metadata}
                onChange={(e) => handleChange('metadata', e.target.value)}
                placeholder='{"source": "internal", "version": "1.0"}'
                className={`font-mono mt-2 ${errors.metadata ? 'border-red-500' : ''}`}
                rows={3}
            />
            {errors.metadata && (
                <p className="text-sm text-red-500 mt-1">{errors.metadata}</p>
            )}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Tag className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tags
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Add tag (e.g. production, critical)"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline">
              Thêm
            </Button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-sm rounded flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isLoading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Đang {mode === 'create' ? 'tạo' : 'cập nhật'}...
            </>
          ) : (
            <>
              {mode === 'create' ? 'Tạo webhook' : 'Cập nhật webhook'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}