/**
 * DelegationModal Component
 * Shared modal for creating/editing delegations
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { UserDelegation, CreateDelegationRequest, UpdateDelegationRequest, DelegationScope } from '../../api/userDelegationsApi';
import { useTranslation } from 'react-i18next';

interface DelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDelegationRequest | UpdateDelegationRequest) => Promise<void>;
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
  const [formData, setFormData] = useState<Partial<CreateDelegationRequest>>({
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
  const [error, setError] = useState<string | null>(null);

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
        start_date: delegation.start_date ? new Date(delegation.start_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        end_date: delegation.end_date ? new Date(delegation.end_date).toISOString().slice(0, 16) : '',
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
    setError(null);
  }, [delegation, fixedDelegatorId, fixedDelegateId, fixedTenantId, isOpen]);

  const validate = () => {
    if (!formData.delegator_id) return 'Vui lòng chọn người ủy quyền';
    if (!formData.delegate_id) return 'Vui lòng chọn người được ủy quyền';
    if (formData.delegator_id === formData.delegate_id) return 'Người ủy quyền và người được ủy quyền không thể là một';
    if (!formData.scope) return 'Vui lòng chọn phạm vi ủy quyền';
    if (!formData.start_date) return 'Vui lòng chọn ngày bắt đầu';
    
    if (formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        return 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      // Sanitize form data
      const sanitizedData = {
        ...formData,
        end_date: formData.end_date && formData.end_date.trim() !== '' 
          ? new Date(formData.end_date).toISOString() 
          : undefined,
        start_date: new Date(formData.start_date!).toISOString(),
      };
      
      await onSave(sanitizedData as CreateDelegationRequest);
      onClose();
    } catch (err) {
      console.error('Error saving delegation:', err);
      setError(err instanceof Error ? err.message : 'Failed to save delegation');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const { t } = useTranslation();

  const availableScopes: { value: DelegationScope; label: string }[] = [
    { value: 'admin', label: 'Admin (Quản trị viên)' },
    { value: 'manager', label: 'Manager (Quản lý)' },
    { value: 'editor', label: 'Editor (Biên tập viên)' },
    { value: 'viewer', label: 'Viewer (Người xem)' },
    { value: 'approver', label: 'Approver (Người phê duyệt)' },
    { value: 'reviewer', label: 'Reviewer (Người đánh giá)' },
    { value: 'auditor', label: 'Auditor (Kiểm toán viên)' },
    { value: 'custom', label: 'Custom (Tùy chỉnh)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {delegation ? 'Sửa thông tin ủy quyền' : 'Tạo ủy quyền mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delegator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người ủy quyền *
              </label>
              <select
                value={formData.delegator_id}
                onChange={(e) => setFormData({ ...formData, delegator_id: e.target.value })}
                disabled={!!fixedDelegatorId || mode === 'delegate' || !!delegation}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Chọn người ủy quyền</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.full_name || user.email} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Delegate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người được ủy quyền *
              </label>
              <select
                value={formData.delegate_id}
                onChange={(e) => setFormData({ ...formData, delegate_id: e.target.value })}
                disabled={!!fixedDelegateId || mode === 'delegator' || !!delegation}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Chọn người được ủy quyền</option>
                {users
                  .filter(u => u._id !== formData.delegator_id)
                  .map(user => (
                    <option key={user._id} value={user._id}>
                      {user.full_name || user.email} ({user.email})
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Tenant */}
          {tenants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant (Tổ chức)
              </label>
              <select
                value={formData.tenant_id || ''}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value || undefined })}
                disabled={!!fixedTenantId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tất cả / Global</option>
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
              Phạm vi ủy quyền *
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as DelegationScope })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availableScopes.map(scope => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu *
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Để trống nếu không có thời hạn</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lý do ủy quyền
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ví dụ: Nghỉ phép, công tác, hỗ trợ dự án..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Thông tin bổ sung..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Auto expire */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.auto_expire}
              onChange={(e) => setFormData({ ...formData, auto_expire: e.target.checked })}
              id="auto_expire"
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="auto_expire" className="text-sm text-gray-700 select-none cursor-pointer">
              Tự động hết hạn khi đến ngày kết thúc
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : delegation ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DelegationModal;
