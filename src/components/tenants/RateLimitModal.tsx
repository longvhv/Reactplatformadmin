/**
 * RateLimitModal Component
 * Modal for creating/editing tenant rate limits
 * 
 * ✅ UPDATED: Complete schema support
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
} from '../../api/tenantRateLimitsApi';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRateLimitData | UpdateRateLimitData) => Promise<void>;
  limit?: TenantRateLimit | null;
  tenantId?: string;
}

export function RateLimitModal({ isOpen, onClose, onSave, limit, tenantId }: RateLimitModalProps) {
  // Using Partial<CreateRateLimitData> as base, but we need to handle updates differently
  // Since UpdateRateLimitData has all optional fields, we can use a merged state strategy
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
    can_override: false,
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
        custom_error_message: limit.custom_error_message,
        custom_error_code: limit.custom_error_code,
        alert_threshold: limit.alert_threshold,
        alert_enabled: limit.alert_enabled,
        priority: limit.priority,
        can_override: limit.can_override,
        override_until: limit.override_until,
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
        can_override: false,
      });
    }
  }, [limit, tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Cast to correct type based on context (Create vs Update)
      // Note: for Update, we technically only need changed fields, but sending all is simpler for this modal logic
      // unless the API strictly forbids sending immutable fields (which it shouldn't for most except IDs)
      await onSave(formData as CreateRateLimitData);
      onClose();
    } catch (err) {
      console.error('Error saving rate limit:', err);
    } finally {
      setSaving(false);
    }
  };

  // Auto-generate limit_key from limit_name for NEW limits only
  const handleNameChange = (name: string) => {
    const updates: any = { limit_name: name };
    if (!limit) {
      updates.limit_key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    setFormData({ ...formData, ...updates });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {limit ? 'Edit Rate Limit' : 'Add Rate Limit'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.limit_name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. API Requests Limit"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Key * {limit && <span className="text-xs text-gray-500">(Can be modified)</span>}
              </label>
              <input
                type="text"
                value={formData.limit_key}
                onChange={(e) => setFormData({ ...formData, limit_key: e.target.value })}
                placeholder="unique_key_identifier"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resource Type
              </label>
              <select
                value={formData.resource_type || ''}
                onChange={(e) => setFormData({ ...formData, resource_type: e.target.value as ResourceType || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">None / Custom</option>
                {resourceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endpoint Pattern
              </label>
              <input
                type="text"
                value={formData.endpoint_pattern || ''}
                onChange={(e) => setFormData({ ...formData, endpoint_pattern: e.target.value })}
                placeholder="/api/v1/*"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>

          {/* Core Configuration */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Rate Limits</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Requests *
                </label>
                <input
                  type="number"
                  value={formData.max_requests}
                  onChange={(e) => setFormData({ ...formData, max_requests: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Window *
                </label>
                <input
                  type="number"
                  value={formData.time_window}
                  onChange={(e) => setFormData({ ...formData, time_window: parseInt(e.target.value) || 0 })}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit *
                </label>
                <select
                  value={formData.window_unit}
                  onChange={(e) => setFormData({ ...formData, window_unit: e.target.value as WindowUnit })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {windowUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Burst Limit
                </label>
                <input
                  type="number"
                  value={formData.burst_limit || ''}
                  onChange={(e) => setFormData({ ...formData, burst_limit: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Concurrent Limit
                </label>
                <input
                  type="number"
                  value={formData.concurrent_limit || ''}
                  onChange={(e) => setFormData({ ...formData, concurrent_limit: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limit Type *
              </label>
              <select
                value={formData.limit_type}
                onChange={(e) => setFormData({ ...formData, limit_type: e.target.value as LimitType })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {limitTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limit Scope *
              </label>
              <select
                value={formData.limit_scope}
                onChange={(e) => setFormData({ ...formData, limit_scope: e.target.value as LimitScope })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {limitScopes.map(scope => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Behavior & Enforcement */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
             <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Enforcement & Behavior</h3>
             
             <div className="flex flex-wrap gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_strict}
                    onChange={(e) => setFormData({ ...formData, is_strict: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Strict Mode (Reject Requests)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.can_override}
                    onChange={(e) => setFormData({ ...formData, can_override: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Allow Override</span>
                </label>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Block Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.block_duration || ''}
                    onChange={(e) => setFormData({ ...formData, block_duration: parseInt(e.target.value) || undefined })}
                    placeholder="Optional"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Retry After (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.retry_after || ''}
                    onChange={(e) => setFormData({ ...formData, retry_after: parseInt(e.target.value) || undefined })}
                    placeholder="Optional"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custom Error Code
                  </label>
                  <input
                    type="text"
                    value={formData.custom_error_code || ''}
                    onChange={(e) => setFormData({ ...formData, custom_error_code: e.target.value })}
                    placeholder="RATE_LIMIT_EXCEEDED"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custom Error Message
                  </label>
                  <input
                    type="text"
                    value={formData.custom_error_message || ''}
                    onChange={(e) => setFormData({ ...formData, custom_error_message: e.target.value })}
                    placeholder="Too many requests, please try again later."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
             </div>
          </div>

          {/* Alerts & Priority */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
             <div className="flex items-center justify-between mb-3">
               <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Alerts & Priority</h3>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.alert_enabled}
                    onChange={(e) => setFormData({ ...formData, alert_enabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Enable Alerts</span>
               </label>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={formData.alert_threshold || ''}
                    onChange={(e) => setFormData({ ...formData, alert_threshold: parseInt(e.target.value) || undefined })}
                    placeholder="80"
                    min="1"
                    max="100"
                    disabled={!formData.alert_enabled}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority (Higher = Enforced First)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
               </div>
             </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {limit ? 'Update Rate Limit' : 'Create Rate Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RateLimitModal;