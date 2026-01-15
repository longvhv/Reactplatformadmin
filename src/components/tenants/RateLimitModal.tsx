/**
 * RateLimitModal Component
 * Modal for creating/editing tenant rate limits
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  TenantRateLimit, 
  CreateRateLimitData, 
  UpdateRateLimitData,
  WindowUnit,
  LimitType,
  LimitScope,
  ResourceType 
} from '@/api/tenantRateLimitsApi';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRateLimitData | UpdateRateLimitData) => Promise<void>;
  limit?: TenantRateLimit | null;
  tenantId?: string;
}

export function RateLimitModal({ isOpen, onClose, onSave, limit, tenantId }: RateLimitModalProps) {
  const [formData, setFormData] = useState<Partial<CreateRateLimitData>>({
    tenant_id: tenantId || '',
    limit_name: '',
    limit_key: '',
    resource_type: 'api',
    max_requests: 100,
    time_window: 60,
    window_unit: 'second',
    limit_type: 'sliding_window',
    limit_scope: 'tenant',
    is_enabled: true,
    is_strict: true,
    alert_enabled: false,
    priority: 0,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (limit) {
      setFormData({
        tenant_id: limit.tenant_id,
        limit_name: limit.limit_name,
        limit_key: limit.limit_key,
        resource_type: limit.resource_type,
        endpoint_pattern: limit.endpoint_pattern,
        max_requests: limit.max_requests,
        time_window: limit.time_window,
        window_unit: limit.window_unit,
        burst_limit: limit.burst_limit,
        concurrent_limit: limit.concurrent_limit,
        limit_type: limit.limit_type,
        limit_scope: limit.limit_scope,
        is_enabled: limit.is_enabled,
        is_strict: limit.is_strict,
        block_duration: limit.block_duration,
        retry_after: limit.retry_after,
        alert_threshold: limit.alert_threshold,
        alert_enabled: limit.alert_enabled,
        priority: limit.priority,
        description: limit.description,
      });
    } else {
      setFormData({
        tenant_id: tenantId || '',
        limit_name: '',
        limit_key: '',
        resource_type: 'api',
        max_requests: 100,
        time_window: 60,
        window_unit: 'second',
        limit_type: 'sliding_window',
        limit_scope: 'tenant',
        is_enabled: true,
        is_strict: true,
        alert_enabled: false,
        priority: 0,
      });
    }
  }, [limit, tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData as CreateRateLimitData);
      onClose();
    } catch (err) {
      console.error('Error saving rate limit:', err);
    } finally {
      setSaving(false);
    }
  };

  // Auto-generate limit_key from limit_name
  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      limit_name: name,
      limit_key: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    });
  };

  if (!isOpen) return null;

  const resourceTypes: { value: ResourceType; label: string }[] = [
    { value: 'api', label: 'API' },
    { value: 'storage', label: 'Storage' },
    { value: 'database', label: 'Database' },
    { value: 'compute', label: 'Compute' },
    { value: 'network', label: 'Network' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
  ];

  const windowUnits: { value: WindowUnit; label: string }[] = [
    { value: 'second', label: 'Second' },
    { value: 'minute', label: 'Minute' },
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'month', label: 'Month' },
  ];

  const limitTypes: { value: LimitType; label: string }[] = [
    { value: 'sliding_window', label: 'Sliding Window' },
    { value: 'fixed_window', label: 'Fixed Window' },
    { value: 'token_bucket', label: 'Token Bucket' },
    { value: 'leaky_bucket', label: 'Leaky Bucket' },
  ];

  const limitScopes: { value: LimitScope; label: string }[] = [
    { value: 'tenant', label: 'Tenant' },
    { value: 'user', label: 'User' },
    { value: 'ip', label: 'IP Address' },
    { value: 'api_key', label: 'API Key' },
    { value: 'global', label: 'Global' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {limit ? 'Chỉnh sửa Rate Limit' : 'Thêm Rate Limit'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên Rate Limit *
              </label>
              <input
                type="text"
                value={formData.limit_name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="API Requests Limit"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit Key *
              </label>
              <input
                type="text"
                value={formData.limit_key}
                onChange={(e) => setFormData({ ...formData, limit_key: e.target.value })}
                placeholder="api_requests_limit"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type
              </label>
              <select
                value={formData.resource_type || ''}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value as ResourceType || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">None</option>
                {resourceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint Pattern
              </label>
              <input
                type="text"
                value={formData.endpoint_pattern || ''}
                onChange={(e) => setFormData({ ...formData, endpoint_pattern: e.target.value })}
                placeholder="/api/v1/*, /uploads/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          {/* Rate Configuration */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Rate Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Requests *
                </label>
                <input
                  type="number"
                  value={formData.max_requests}
                  onChange={(e) => setFormData({ ...formData, max_requests: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Window *
                </label>
                <input
                  type="number"
                  value={formData.time_window}
                  onChange={(e) => setFormData({ ...formData, time_window: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Window Unit *
                </label>
                <select
                  value={formData.window_unit}
                  onChange={(e) => setFormData({ ...formData, window_unit: e.target.value as WindowUnit })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {windowUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Burst Limit
              </label>
              <input
                type="number"
                value={formData.burst_limit || ''}
                onChange={(e) => setFormData({ ...formData, burst_limit: parseInt(e.target.value) || undefined })}
                placeholder="Optional"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concurrent Limit
              </label>
              <input
                type="number"
                value={formData.concurrent_limit || ''}
                onChange={(e) => setFormData({ ...formData, concurrent_limit: parseInt(e.target.value) || undefined })}
                placeholder="Optional"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit Type *
              </label>
              <select
                value={formData.limit_type}
                onChange={(e) => setFormData({ ...formData, limit_type: e.target.value as LimitType })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {limitTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit Scope *
              </label>
              <select
                value={formData.limit_scope}
                onChange={(e) => setFormData({ ...formData, limit_scope: e.target.value as LimitScope })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {limitScopes.map(scope => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Enforcement */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Enforcement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  id="is_enabled"
                  className="rounded"
                />
                <label htmlFor="is_enabled" className="text-sm text-gray-700">
                  Enabled
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_strict}
                  onChange={(e) => setFormData({ ...formData, is_strict: e.target.checked })}
                  id="is_strict"
                  className="rounded"
                />
                <label htmlFor="is_strict" className="text-sm text-gray-700">
                  Strict Mode (Reject)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block Duration (seconds)
                </label>
                <input
                  type="number"
                  value={formData.block_duration || ''}
                  onChange={(e) => setFormData({ ...formData, block_duration: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retry After (seconds)
                </label>
                <input
                  type="number"
                  value={formData.retry_after || ''}
                  onChange={(e) => setFormData({ ...formData, retry_after: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={formData.alert_enabled}
                onChange={(e) => setFormData({ ...formData, alert_enabled: e.target.checked })}
                id="alert_enabled"
                className="rounded"
              />
              <label htmlFor="alert_enabled" className="text-sm font-semibold text-gray-900">
                Enable Alerts
              </label>
            </div>

            {formData.alert_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={formData.alert_threshold || ''}
                    onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) || undefined })}
                    placeholder="80"
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : limit ? 'Cập nhật' : 'Tạo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RateLimitModal;