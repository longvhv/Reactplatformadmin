/**
 * WebhookForm Component
 * Reusable form for creating/editing webhooks
 * Under 500 lines, follows DRY principle
 */

import React, { useState } from 'react';
import { Webhook, CreateWebhookRequest, UpdateWebhookRequest } from '@/api/webhooksApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Webhook as WebhookIcon, 
  Link as LinkIcon, 
  Key, 
  Shield, 
  Clock,
  Zap,
  Tag,
  Settings,
  AlertCircle
} from 'lucide-react';
import { DEFAULT_TENANT_ID } from '@/constants/tenant-constants';

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
  const [formData, setFormData] = useState({
    tenant_id: initialData?.tenant_id || DEFAULT_TENANT_ID,
    name: initialData?.name || '',
    description: initialData?.description || '',
    url: initialData?.url || '',
    method: initialData?.method || 'POST' as const,
    event_types: initialData?.event_types || [],
    auth_type: initialData?.auth_type || 'none' as const,
    auth_config: initialData?.auth_config || {},
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const submitData = {
      ...formData,
      event_types: Array.from(selectedEvents),
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

        <div className="space-y-4">
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
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Mô tả chi tiết về webhook này..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
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
          {/* URL */}
          <div>
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

          {/* Method */}
          <div>
            <Label htmlFor="method">HTTP Method</Label>
            <select
              id="method"
              value={formData.method}
              onChange={(e) => handleChange('method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {COMMON_EVENTS.map(event => (
            <label
              key={event}
              className="flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <input
                type="checkbox"
                checked={selectedEvents.has(event)}
                onChange={() => toggleEvent(event)}
                className="rounded"
              />
              <span className="text-sm text-gray-900 dark:text-white">{event}</span>
            </label>
          ))}
        </div>

        {/* Custom Event */}
        <div className="flex gap-2">
          <Input
            placeholder="Custom event (vd: custom.event.type)"
            value={customEvent}
            onChange={(e) => setCustomEvent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEvent())}
          />
          <Button type="button" onClick={addCustomEvent} variant="outline">
            Thêm
          </Button>
        </div>

        {/* Selected Events */}
        {selectedEvents.size > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Đã chọn {selectedEvents.size} events:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedEvents).map(event => (
                <span
                  key={event}
                  className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-xs rounded flex items-center gap-1"
                >
                  {event}
                  <button
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Authentication */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Xác thực
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="auth_type">Loại xác thực</Label>
            <select
              id="auth_type"
              value={formData.auth_type}
              onChange={(e) => handleChange('auth_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="none">None</option>
              <option value="basic">Basic Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
            </select>
          </div>

          {/* Custom Headers */}
          <div>
            <Label>Custom Headers</Label>
            <div className="space-y-2">
              {Object.entries(formData.headers).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                    {key}: {value}
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
                  placeholder="Header key"
                  value={customHeader.key}
                  onChange={(e) => setCustomHeader(prev => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="Header value"
                  value={customHeader.value}
                  onChange={(e) => setCustomHeader(prev => ({ ...prev, value: e.target.value }))}
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

        <div className="grid md:grid-cols-2 gap-4">
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
              className={errors.timeout_ms ? 'border-red-500' : ''}
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
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              0 = lowest, 10 = highest
            </p>
          </div>
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
          <div className="flex gap-2">
            <Input
              placeholder="Thêm tag (vd: production, critical)"
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
                    className="hover:text-red-600"
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
      <div className="flex justify-end gap-3">
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