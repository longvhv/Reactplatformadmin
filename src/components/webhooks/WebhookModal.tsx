/**
 * WebhookModal Component
 * Modal for creating/editing webhooks - Chuẩn Stripe/GitHub UI
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Info, 
  Lock,
  Zap,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Webhook, 
  CreateWebhookRequest, 
  UpdateWebhookRequest 
} from '@/api/webhooksApi';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateWebhookRequest | UpdateWebhookRequest) => Promise<void>;
  webhook?: Webhook | null;
  tenantId?: string;
}

const EVENT_TYPES = [
  { category: 'User', events: ['user.created', 'user.updated', 'user.deleted'] },
  { category: 'Order', events: ['order.created', 'order.updated', 'order.completed', 'order.cancelled'] },
  { category: 'Payment', events: ['payment.succeeded', 'payment.failed', 'payment.refunded'] },
  { category: 'Subscription', events: ['subscription.created', 'subscription.updated', 'subscription.cancelled'] },
  { category: 'Invoice', events: ['invoice.created', 'invoice.paid', 'invoice.overdue'] },
  { category: 'Tenant', events: ['tenant.created', 'tenant.updated', 'tenant.suspended'] },
  { category: 'Notification', events: ['notification.sent', 'notification.failed'] },
  { category: 'Auth', events: ['auth.login', 'auth.logout', 'auth.failed'] },
];

export function WebhookModal({ isOpen, onClose, onSave, webhook, tenantId }: WebhookModalProps) {
  const [formData, setFormData] = useState<Partial<CreateWebhookRequest>>({
    tenant_id: tenantId || '',
    name: '',
    url: '',
    method: 'POST',
    event_types: [],
    auth_type: 'none',
    headers: { 'Content-Type': 'application/json' },
    timeout_ms: 5000,
    retry_config: { max_retries: 3, retry_delay: 1000, backoff_multiplier: 2 },
    priority: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [customEvent, setCustomEvent] = useState('');
  const [authSecret, setAuthSecret] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'events' | 'auth' | 'advanced'>('basic');

  useEffect(() => {
    if (webhook) {
      setFormData({
        tenant_id: webhook.tenant_id,
        name: webhook.name,
        description: webhook.description,
        url: webhook.url,
        method: webhook.method,
        event_types: webhook.event_types,
        auth_type: webhook.auth_type,
        auth_config: webhook.auth_config,
        headers: webhook.headers,
        timeout_ms: webhook.timeout_ms,
        retry_config: webhook.retry_config,
        priority: webhook.priority,
        tags: webhook.tags,
        batch_size: webhook.batch_size,
        rate_limit: webhook.rate_limit,
      });
      setSelectedEvents(webhook.event_types);
    } else {
      resetForm();
    }
  }, [webhook, tenantId, isOpen]);

  const resetForm = () => {
    setFormData({
      tenant_id: tenantId || '',
      name: '',
      url: '',
      method: 'POST',
      event_types: [],
      auth_type: 'none',
      headers: { 'Content-Type': 'application/json' },
      timeout_ms: 5000,
      retry_config: { max_retries: 3, retry_delay: 1000, backoff_multiplier: 2 },
      priority: 0,
    });
    setSelectedEvents([]);
    setAuthSecret('');
    setErrors({});
    setActiveTab('basic');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên webhook là bắt buộc';
    }

    if (!formData.url?.trim()) {
      newErrors.url = 'URL là bắt buộc';
    } else {
      try {
        const url = new URL(formData.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.url = 'URL phải bắt đầu bằng http:// hoặc https://';
        }
      } catch {
        newErrors.url = 'URL không hợp lệ';
      }
    }

    if (selectedEvents.length === 0) {
      newErrors.events = 'Vui lòng chọn ít nhất một event type';
    }

    if (!formData.timeout_ms || formData.timeout_ms < 1000 || formData.timeout_ms > 60000) {
      newErrors.timeout_ms = 'Timeout phải từ 1000ms đến 60000ms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setActiveTab('basic'); // Switch to basic tab to show errors
      return;
    }

    setSaving(true);
    try {
      const submitData = { 
        ...formData, 
        event_types: selectedEvents 
      } as CreateWebhookRequest;

      // Add auth secret if provided
      if (formData.auth_type !== 'none' && authSecret) {
        submitData.auth_config = { secret: authSecret };
      }

      await onSave(submitData);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error saving webhook:', err);
      setErrors({ submit: 'Lỗi khi lưu webhook. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
    setErrors(prev => ({ ...prev, events: '' }));
  };

  const addCustomEvent = () => {
    if (customEvent.trim() && !selectedEvents.includes(customEvent.trim())) {
      setSelectedEvents(prev => [...prev, customEvent.trim()]);
      setCustomEvent('');
      setErrors(prev => ({ ...prev, events: '' }));
    }
  };

  const removeEvent = (event: string) => {
    setSelectedEvents(prev => prev.filter(e => e !== event));
  };

  const selectAllInCategory = (category: { category: string; events: string[] }) => {
    const categoryEvents = category.events;
    const allSelected = categoryEvents.every(e => selectedEvents.includes(e));
    
    if (allSelected) {
      setSelectedEvents(prev => prev.filter(e => !categoryEvents.includes(e)));
    } else {
      setSelectedEvents(prev => [...new Set([...prev, ...categoryEvents])]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {webhook ? 'Chỉnh sửa Webhook' : 'Thêm Webhook'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cấu hình endpoint nhận thông báo sự kiện
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6 flex gap-1">
            {[
              { id: 'basic', label: 'Cơ bản', icon: Globe },
              { id: 'events', label: 'Events', icon: Zap },
              { id: 'auth', label: 'Xác thực', icon: Lock },
              { id: 'advanced', label: 'Nâng cao', icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${isActive 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên webhook <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="VD: Webhook đồng bộ đơn hàng"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Endpoint URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => {
                      setFormData({ ...formData, url: e.target.value });
                      setErrors(prev => ({ ...prev, url: '' }));
                    }}
                    placeholder="https://api.example.com/webhooks/receiver"
                    className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.url ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.url && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.url}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500">
                    URL nhận POST request chứa event data
                  </p>
                </div>

                {/* Method & Timeout */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      HTTP Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Timeout (ms) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.timeout_ms}
                      onChange={(e) => {
                        setFormData({ ...formData, timeout_ms: parseInt(e.target.value) });
                        setErrors(prev => ({ ...prev, timeout_ms: '' }));
                      }}
                      min="1000"
                      max="60000"
                      step="1000"
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.timeout_ms ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.timeout_ms && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.timeout_ms}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả mục đích và chức năng của webhook..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Webhook hoạt động như thế nào?</p>
                      <p className="text-blue-800">
                        Khi có event xảy ra, hệ thống sẽ gửi HTTP request đến URL bạn cấu hình.
                        Request chứa thông tin chi tiết về event dưới dạng JSON.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Event Types <span className="text-red-500">*</span>
                    </label>
                    <span className="text-sm text-gray-600">
                      Đã chọn: <span className="font-semibold text-indigo-600">{selectedEvents.length}</span>
                    </span>
                  </div>

                  {errors.events && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.events}
                      </p>
                    </div>
                  )}

                  {/* Event Categories */}
                  <div className="space-y-4">
                    {EVENT_TYPES.map((category) => {
                      const categorySelected = category.events.filter(e => selectedEvents.includes(e)).length;
                      const allSelected = categorySelected === category.events.length;

                      return (
                        <div key={category.category} className="border border-gray-200 rounded-lg">
                          {/* Category Header */}
                          <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {category.category}
                              </h4>
                              <span className="text-xs text-gray-500">
                                ({categorySelected}/{category.events.length})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => selectAllInCategory(category)}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                          </div>

                          {/* Category Events */}
                          <div className="p-3 grid grid-cols-2 gap-2">
                            {category.events.map(event => {
                              const isSelected = selectedEvents.includes(event);
                              return (
                                <label 
                                  key={event} 
                                  className={`
                                    flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors
                                    ${isSelected 
                                      ? 'bg-indigo-50 border border-indigo-200' 
                                      : 'hover:bg-gray-50 border border-transparent'
                                    }
                                  `}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleEvent(event)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className={`text-sm font-mono ${isSelected ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                                    {event}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Event */}
                  <div className="mt-4 border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Event
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customEvent}
                        onChange={(e) => setCustomEvent(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEvent())}
                        placeholder="app.custom_event"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <Button
                        type="button"
                        onClick={addCustomEvent}
                        variant="outline"
                        className="px-4"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Selected Events Display */}
                  {selectedEvents.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                        Events đã chọn ({selectedEvents.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvents.map(event => (
                          <span 
                            key={event} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-mono"
                          >
                            {event}
                            <button 
                              type="button" 
                              onClick={() => removeEvent(event)} 
                              className="hover:text-indigo-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auth Tab */}
            {activeTab === 'auth' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phương thức xác thực
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'none', label: 'Không xác thực', desc: 'Endpoint công khai, không yêu cầu auth' },
                      { value: 'bearer', label: 'Bearer Token', desc: 'Gửi token trong Authorization header' },
                      { value: 'api_key', label: 'API Key', desc: 'Gửi API key trong X-API-Key header' },
                      { value: 'basic', label: 'Basic Auth', desc: 'Username/password authentication' },
                    ].map((option) => (
                      <label 
                        key={option.value}
                        className={`
                          flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all
                          ${formData.auth_type === option.value
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="auth_type"
                          value={option.value}
                          checked={formData.auth_type === option.value}
                          onChange={(e) => setFormData({ ...formData, auth_type: e.target.value })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {option.value !== 'none' && <Lock className="w-4 h-4 text-gray-400" />}
                            <span className="font-medium text-gray-900">{option.label}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Auth Secret Input */}
                {formData.auth_type !== 'none' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-orange-900 mb-2">
                      Secret Key / Token <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={authSecret}
                      onChange={(e) => setAuthSecret(e.target.value)}
                      placeholder={
                        formData.auth_type === 'bearer' ? 'Bearer token...' :
                        formData.auth_type === 'api_key' ? 'API key...' :
                        'Secret...'
                      }
                      className="w-full px-3 py-2.5 border border-orange-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="mt-2 text-xs text-orange-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Secret được mã hóa và lưu trữ an toàn
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Bảo mật webhook</p>
                      <ul className="space-y-1 text-blue-800 list-disc list-inside">
                        <li>Bearer Token: Gửi trong header <code className="bg-blue-100 px-1 rounded">Authorization: Bearer YOUR_TOKEN</code></li>
                        <li>API Key: Gửi trong header <code className="bg-blue-100 px-1 rounded">X-API-Key: YOUR_KEY</code></li>
                        <li>Basic Auth: Credentials được encode base64</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* Retry Config */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    Retry Configuration
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Max Retries
                      </label>
                      <input
                        type="number"
                        value={formData.retry_config?.max_retries}
                        onChange={(e) => setFormData({
                          ...formData,
                          retry_config: { ...formData.retry_config!, max_retries: parseInt(e.target.value) }
                        })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">Số lần thử lại khi thất bại</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Retry Delay (ms)
                      </label>
                      <input
                        type="number"
                        value={formData.retry_config?.retry_delay}
                        onChange={(e) => setFormData({
                          ...formData,
                          retry_config: { ...formData.retry_config!, retry_delay: parseInt(e.target.value) }
                        })}
                        min="100"
                        step="100"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">Delay giữa các lần thử</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Backoff Multiplier
                      </label>
                      <input
                        type="number"
                        value={formData.retry_config?.backoff_multiplier}
                        onChange={(e) => setFormData({
                          ...formData,
                          retry_config: { ...formData.retry_config!, backoff_multiplier: parseFloat(e.target.value) }
                        })}
                        min="1"
                        step="0.1"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">Hệ số tăng delay</p>
                    </div>
                  </div>
                </div>

                {/* Performance Settings */}
                <div className="border-t pt-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Batch Size
                      </label>
                      <input
                        type="number"
                        value={formData.batch_size || ''}
                        onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value) || undefined })}
                        placeholder="Mặc định: 1"
                        min="1"
                        max="100"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Rate Limit (per min)
                      </label>
                      <input
                        type="number"
                        value={formData.rate_limit || ''}
                        onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || undefined })}
                        placeholder="Không giới hạn"
                        min="1"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Priority
                      </label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        min="0"
                        max="10"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">0 = thấp nhất, 10 = cao nhất</p>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="text-sm text-green-900">
                      <p className="font-medium mb-1">Exponential Backoff</p>
                      <p className="text-green-800">
                        Với max_retries=3, delay=1000ms, multiplier=2:<br />
                        Retry 1 sau 1s, Retry 2 sau 2s, Retry 3 sau 4s
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              {errors.submit && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.submit}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={onClose}
                disabled={saving}
                variant="outline"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saving ? 'Đang lưu...' : webhook ? 'Cập nhật Webhook' : 'Tạo Webhook'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WebhookModal;
