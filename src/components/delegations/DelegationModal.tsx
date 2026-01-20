/**
 * DelegationModal Component
 * Shared modal for creating/editing delegations
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UserDelegation, CreateDelegationData, UpdateDelegationData } from '../../api/userDelegationsApi';
import { useTranslation } from 'react-i18next';

interface DelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDelegationData | UpdateDelegationData) => Promise<void>;
  delegation?: UserDelegation | null;
  users: Array<{ _id: string; email: string; full_name?: string }>;
  tenants?: Array<{ _id: string; name: string }>;
  currentUserId?: string;
  mode?: 'delegator' | 'delegate' | 'all'; // Limit selection based on context
  fixedDelegatorId?: string; // Fix delegator (user delegation tab)
  fixedDelegateId?: string; // Fix delegate
  fixedTenantId?: string; // Fix tenant (tenant delegation tab)
}

export function DelegationModal({
  isOpen,
  onClose,
  onSave,
  delegation,
  users,
  tenants = [],
  currentUserId,
  mode = 'all',
  fixedDelegatorId,
  fixedDelegateId,
  fixedTenantId,
}: DelegationModalProps) {
  const [formData, setFormData] = useState<Partial<CreateDelegationData>>({
    delegator_id: fixedDelegatorId || '',
    delegate_id: fixedDelegateId || '',
    tenant_id: fixedTenantId || undefined,
    scope: 'viewer',
    permissions: [],
    reason: '',
    notes: '',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: '',
    auto_expire: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (delegation) {
      setFormData({
        delegator_id: delegation.delegator_id,
        delegate_id: delegation.delegate_id,
        tenant_id: delegation.tenant_id,
        scope: delegation.scope,
        permissions: delegation.permissions || [],
        reason: delegation.reason,
        notes: delegation.notes,
        start_date: delegation.start_date.slice(0, 16),
        end_date: delegation.end_date?.slice(0, 16) || '',
        auto_expire: delegation.auto_expire,
      });
    } else {
      setFormData({
        delegator_id: fixedDelegatorId || '',
        delegate_id: fixedDelegateId || '',
        tenant_id: fixedTenantId || undefined,
        scope: 'viewer',
        permissions: [],
        reason: '',
        notes: '',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: '',
        auto_expire: true,
      });
    }
  }, [delegation, fixedDelegatorId, fixedDelegateId, fixedTenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Sanitize form data to prevent empty string timestamps
      const sanitizedData = {
        ...formData,
        // Convert empty string to undefined/null for optional timestamp fields
        end_date: formData.end_date && formData.end_date.trim() !== '' ? formData.end_date : undefined,
      };
      
      await onSave(sanitizedData as CreateDelegationRequest);
      onClose();
    } catch (err) {
      console.error('Error saving delegation:', err);
      alert(err instanceof Error ? err.message : 'Failed to save delegation');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const { t } = useTranslation();

  const availableScopes = [
    { value: 'admin', label: t('common.admin') },
    { value: 'manager', label: t('common.manager') },
    { value: 'editor', label: t('common.editor') },
    { value: 'viewer', label: t('common.viewer') },
    { value: 'approver', label: t('common.approver') },
    { value: 'reviewer', label: t('common.reviewer') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {delegation ? 'Edit Delegation' : 'Create Delegation'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Delegator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delegator *
              </label>
              <select
                value={formData.delegator_id}
                onChange={(e) => setFormData({ ...formData, delegator_id: e.target.value })}
                disabled={!!fixedDelegatorId || mode === 'delegate'}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value="">Select delegator</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Delegate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delegate *
              </label>
              <select
                value={formData.delegate_id}
                onChange={(e) => setFormData({ ...formData, delegate_id: e.target.value })}
                disabled={!!fixedDelegateId || mode === 'delegator'}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value="">Select delegate</option>
                {users.filter(u => u._id !== formData.delegator_id).map(user => (
                  <option key={user._id} value={user._id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tenant */}
          {tenants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant (Optional)
              </label>
              <select
                value={formData.tenant_id || ''}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value || undefined })}
                disabled={!!fixedTenantId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value="">All tenants</option>
                {tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {availableScopes.map(scope => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Nghỉ phép, công tác..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Auto expire */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.auto_expire}
              onChange={(e) => setFormData({ ...formData, auto_expire: e.target.checked })}
              id="auto_expire"
              className="rounded"
            />
            <label htmlFor="auto_expire" className="text-sm text-gray-700">
              Auto-expire when end date is reached
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? t('common.saving') : delegation ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DelegationModal;