/**
 * WebhookModal Component
 * Modal for creating/editing webhooks - Chuẩn Stripe/GitHub UI
 * 
 * ✅ ENHANCED 2026-01-21: Full DB schema support
 * - Added Signing Secret (secret_key)
 * - Added Custom Headers editor
 * - Added Event Filter (JSON)
 * - Added Tags management
 * - Improved Auth Config (Basic Auth support)
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
  CheckCircle2,
  RefreshCw,
  Tag,
  Code
} from 'lucide-react';
import { Button } from '../ui/button';
import { 
  Webhook, 
  CreateWebhookRequest, 
  UpdateWebhookRequest 
} from '../../api/webhooksApi';

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
    secret_key: '',
    tags: [],
    event_filter: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [customEvent, setCustomEvent] = useState('');
  
  // Auth state
  const [authSecret, setAuthSecret] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  // Custom Headers state
  const [headersList, setHeadersList] = useState<{key: string, value: string}[]>([]);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  // Tags state
  const [currentTag, setCurrentTag] = useState('');
  
  // Filter state
  const [filterJson, setFilterJson] = useState('{}');

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
        secret_key: webhook.secret_key,
        event_filter: webhook.event_filter,
      });
      setSelectedEvents(webhook.event_types);
      
      // Setup Auth
      if (webhook.auth_type === 'basic' && webhook.auth_config) {
        setAuthUsername(webhook.auth_config.username || '');
        setAuthPassword(webhook.auth_config.password || '');
      } else if (webhook.auth_config && webhook.auth_config.secret) {
        setAuthSecret(webhook.auth_config.secret);
      }
      
      // Setup Headers
      if (webhook.headers) {
        setHeadersList(Object.entries(webhook.headers).map(([key, value]) => ({ key, value: String(value) })));
      }
      
      // Setup Filter
      if (webhook.event_filter) {
        setFilterJson(JSON.stringify(webhook.event_filter, null, 2));
      }
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
      secret_key: generateSecret(),
      tags: [],
      event_filter: {},
    });
    setSelectedEvents([]);
    setAuthSecret('');
    setAuthUsername('');
    setAuthPassword('');
    setHeadersList([{ key: 'Content-Type', value: 'application/json' }]);
    setFilterJson('{}');
    setErrors({});
    setActiveTab('basic');
  };

  const generateSecret = () => {
    return 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

    // Validate JSON filter
    try {
      JSON.parse(filterJson);
    } catch (e) {
      newErrors.filter = 'Invalid JSON format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Find which tab has errors
      if (errors.name || errors.url || errors.timeout_ms) setActiveTab('basic');
      else if (errors.events) setActiveTab('events');
      else if (errors.filter) setActiveTab('advanced');
      return;
    }

    setSaving(true);
    try {
      const headers = headersList.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
      
      const submitData = { 
        ...formData, 
        event_types: selectedEvents,
        headers,
        event_filter: JSON.parse(filterJson)
      } as CreateWebhookRequest;

      // Handle Auth Config
      if (formData.auth_type === 'basic') {
        submitData.auth_config = { username: authUsername, password: authPassword };
      } else if (formData.auth_type !== 'none' && authSecret) {
        submitData.auth_config = { secret: authSecret };
      } else {
        submitData.auth_config = undefined;
      }

      await onSave(submitData);
      onClose();
    } catch (err) {
      console.error('Error saving webhook:', err);
      setErrors({ submit: 'Lỗi khi lưu webhook. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  // Tag handlers
  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // Header handlers
  const addHeader = () => {
    if (newHeaderKey.trim() && newHeaderValue.trim()) {
      setHeadersList(prev => [...prev, { key: newHeaderKey.trim(), value: newHeaderValue.trim() }]);
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeHeader = (index: number) => {
    setHeadersList(prev => prev.filter((_, i) => i !== index));
  };

  // Event handlers
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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
              { id: 'auth', label: 'Bảo mật & Auth', icon: Lock },
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
                </div>

                {/* Method & Timeout */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      HTTP Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.method}
                      onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="POST">POST</option>
                      <option value="GET">GET</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button type="button" onClick={addTag} variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags?.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                        <Tag className="w-3 h-3" /> {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
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
                </div>
              </div>
            )}

            {/* Auth & Security Tab */}
            {activeTab === 'auth' && (
              <div className="space-y-6">
                {/* Signing Secret */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Signing Secret
                    </label>
                    <button type="button" onClick={() => setFormData({...formData, secret_key: generateSecret()})} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.secret_key}
                      onChange={(e) => setFormData({...formData, secret_key: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-white"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    Dùng để ký payload (HMAC SHA256). Server của bạn nên verify chữ ký này.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phương thức xác thực (Authentication)
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Cách hệ thống xác thực với server của bạn.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {[
                      { value: 'none', label: 'Không xác thực' },
                      { value: 'bearer', label: 'Bearer Token' },
                      { value: 'api_key', label: 'API Key' },
                      { value: 'basic', label: 'Basic Auth' },
                    ].map((option) => (
                      <label 
                        key={option.value}
                        className={`
                          flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all
                          ${formData.auth_type === option.value
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="auth_type"
                          value={option.value}
                          checked={formData.auth_type === option.value}
                          onChange={(e) => setFormData({ ...formData, auth_type: e.target.value as any })}
                          className="text-indigo-600"
                        />
                        <span className="font-medium text-sm text-gray-900">{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Auth Config Inputs */}
                  {formData.auth_type !== 'none' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                      {formData.auth_type === 'basic' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-orange-900 mb-1">Username</label>
                            <input
                              type="text"
                              value={authUsername}
                              onChange={(e) => setAuthUsername(e.target.value)}
                              className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-orange-900 mb-1">Password</label>
                            <input
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-orange-900 mb-1">
                            {formData.auth_type === 'bearer' ? 'Token' : 'API Key'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={authSecret}
                            onChange={(e) => setAuthSecret(e.target.value)}
                            className="w-full px-3 py-2 border border-orange-300 rounded-md font-mono text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                {/* Headers */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Custom Headers
                  </h3>
                  <div className="space-y-2 mb-2">
                    {headersList.map((header, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={header.key}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-sm"
                        />
                        <input
                          type="text"
                          value={header.value}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-sm"
                        />
                        <button type="button" onClick={() => removeHeader(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHeaderKey}
                      onChange={(e) => setNewHeaderKey(e.target.value)}
                      placeholder="Header Key (e.g. X-Custom)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={newHeaderValue}
                      onChange={(e) => setNewHeaderValue(e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <Button type="button" onClick={addHeader} variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Retry Config */}
                <div className="border-t pt-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-600" />
                    Retry Policy
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Retries</label>
                      <input
                        type="number"
                        value={formData.retry_config?.max_retries}
                        onChange={(e) => setFormData({
                          ...formData,
                          retry_config: { ...formData.retry_config!, max_retries: parseInt(e.target.value) }
                        })}
                        min="0" max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Delay (ms)</label>
                      <input
                        type="number"
                        value={formData.retry_config?.retry_delay}
                        onChange={(e) => setFormData({
                          ...formData,
                          retry_config: { ...formData.retry_config!, retry_delay: parseInt(e.target.value) }
                        })}
                        min="100" step="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Multiplier</label>
                      <input
                        type="number"
                        value={formData.retry_config?.backoff_multiplier}
                        onChange={(e) => setFormData({
                          ...formData,
                          retry_config: { ...formData.retry_config!, backoff_multiplier: parseFloat(e.target.value) }
                        })}
                        min="1" step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Filter (JSON) */}
                <div className="border-t pt-5">
                   <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Event Filter (JSON)
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Lọc event dựa trên payload. Nếu để trống, tất cả event type đã chọn sẽ được gửi.
                  </p>
                  <textarea
                    value={filterJson}
                    onChange={(e) => {
                      setFilterJson(e.target.value);
                      setErrors(prev => ({ ...prev, filter: '' }));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg font-mono text-xs h-32 ${errors.filter ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder='{"data": {"status": "completed"}}'
                  />
                  {errors.filter && <p className="text-xs text-red-500 mt-1">{errors.filter}</p>}
                </div>

                {/* Performance */}
                <div className="border-t pt-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Batch Size</label>
                      <input
                        type="number"
                        value={formData.batch_size || ''}
                        onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value) || undefined })}
                        min="1" max="100"
                        placeholder="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rate Limit (req/min)</label>
                      <input
                        type="number"
                        value={formData.rate_limit || ''}
                        onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || undefined })}
                        min="1"
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Priority (0-10)</label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        min="0" max="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between sticky bottom-0">
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