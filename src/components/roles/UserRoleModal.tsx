/**
 * UserRoleModal Component
 * Modal form để thêm/sửa user role với multi-scope support
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { UserRole, CreateUserRoleData } from '../../api/userRolesApi';
import { useRoles } from '../../hooks/useRoles';
import { useTenants } from '../../hooks/useTenants';
import { useUsers } from '../../hooks/useUsers';

interface ScopeAssignment {
  scope: 'global' | 'tenant' | 'department' | 'location' | 'custom';
  scope_id?: string;
  tenant_id?: string;
}

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRoleData[]) => Promise<void>;
  editData?: UserRole;
  fixedUserId?: string; // For user detail page
  fixedTenantId?: string; // For tenant detail page
}

export function UserRoleModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  fixedUserId,
  fixedTenantId,
}: UserRoleModalProps) {
  const { roles } = useRoles();
  const { tenants } = useTenants();
  const { users } = useUsers();

  const [selectedUserId, setSelectedUserId] = useState(fixedUserId || '');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [scopes, setScopes] = useState<ScopeAssignment[]>([
    { scope: 'global', scope_id: undefined, tenant_id: fixedTenantId },
  ]);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load edit data
  useEffect(() => {
    if (editData) {
      setSelectedUserId(editData.user_id);
      setSelectedRoleId(editData.role_id);
      setScopes([
        {
          scope: editData.scope,
          scope_id: editData.scope_id,
          tenant_id: editData.tenant_id,
        },
      ]);
      setExpiresAt(editData.expires_at ? editData.expires_at.split('T')[0] : '');
      setIsActive(editData.is_active);
    } else {
      resetForm();
    }
  }, [editData]);

  const resetForm = () => {
    setSelectedUserId(fixedUserId || '');
    setSelectedRoleId('');
    setScopes([{ scope: 'global', scope_id: undefined, tenant_id: fixedTenantId }]);
    setExpiresAt('');
    setIsActive(true);
  };

  const handleAddScope = () => {
    setScopes([...scopes, { scope: 'global', scope_id: undefined, tenant_id: fixedTenantId }]);
  };

  const handleRemoveScope = (index: number) => {
    if (scopes.length > 1) {
      setScopes(scopes.filter((_, i) => i !== index));
    }
  };

  const handleScopeChange = (index: number, field: keyof ScopeAssignment, value: any) => {
    const newScopes = [...scopes];
    newScopes[index] = { ...newScopes[index], [field]: value };
    
    // Auto-set tenant_id when scope is tenant and scope_id is selected
    if (field === 'scope_id' && newScopes[index].scope === 'tenant') {
      newScopes[index].tenant_id = value;
    }
    
    // Clear scope_id when scope is global
    if (field === 'scope' && value === 'global') {
      newScopes[index].scope_id = undefined;
    }
    
    setScopes(newScopes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !selectedRoleId) {
      alert('Vui lòng chọn người dùng và vai trò');
      return;
    }

    setSaving(true);
    try {
      // Create one assignment per scope
      const assignments: CreateUserRoleData[] = scopes.map((scope) => ({
        user_id: selectedUserId,
        role_id: selectedRoleId,
        tenant_id: scope.tenant_id || fixedTenantId,
        scope: scope.scope,
        scope_id: scope.scope_id,
        expires_at: expiresAt || undefined,
        is_active: isActive,
      }));

      await onSubmit(assignments);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error saving user role:', err);
      alert(err instanceof Error ? err.message : 'Failed to save user role');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {editData ? 'Sửa phân quyền' : 'Thêm phân quyền'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Selection */}
          {!fixedUserId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Người dùng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={!!editData}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Chọn người dùng...</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.full_name || user.email} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={!!editData}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Chọn vai trò...</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name} {role.description && `- ${role.description}`}
                </option>
              ))}
            </select>
          </div>

          {/* Scopes - Multi-scope support */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Phạm vi phân quyền <span className="text-red-500">*</span>
              </label>
              {!editData && (
                <button
                  type="button"
                  onClick={handleAddScope}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm phạm vi
                </button>
              )}
            </div>

            <div className="space-y-3">
              {scopes.map((scope, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={scope.scope}
                    onChange={(e) => handleScopeChange(index, 'scope', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="global">Global (Toàn hệ thống)</option>
                    <option value="tenant">Tenant (Tổ chức)</option>
                    <option value="department">Department (Phòng ban)</option>
                    <option value="location">Location (Địa điểm)</option>
                    <option value="custom">Custom (Tùy chỉnh)</option>
                  </select>

                  {scope.scope === 'tenant' && (
                    <select
                      value={scope.scope_id || ''}
                      onChange={(e) => handleScopeChange(index, 'scope_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Chọn tenant...</option>
                      {tenants.map((tenant) => (
                        <option key={tenant._id} value={tenant._id}>
                          {tenant.name} ({tenant.code})
                        </option>
                      ))}
                    </select>
                  )}

                  {!editData && scopes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveScope(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expires At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày hết hạn (tùy chọn)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Kích hoạt ngay
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Đang lưu...' : editData ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserRoleModal;
