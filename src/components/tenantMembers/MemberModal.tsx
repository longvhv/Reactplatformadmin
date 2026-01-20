/**
 * MemberModal Component
 * Modal for creating/editing tenant members
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  TenantMember,
  CreateTenantMemberRequest,
  UpdateTenantMemberRequest,
  MemberRole,
  MemberStatus,
} from '@/api/tenantMembersApi';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTenantMemberRequest | UpdateTenantMemberRequest) => Promise<void>;
  member?: TenantMember | null;
  tenantId: string;
}

export function MemberModal({ isOpen, onClose, onSave, member, tenantId }: MemberModalProps) {
  const [formData, setFormData] = useState<Partial<CreateTenantMemberRequest>>({
    tenant_id: tenantId,
    user_id: '',
    employee_code: '',
    internal_email: '',
    job_title: '',
    manager_id: '',
    role: 'MEMBER',
    status: 'ACTIVE',
    permissions: [],
    joined_at: new Date().toISOString().split('T')[0],
    metadata: {},
  });

  const [saving, setSaving] = useState(false);
  const [customPermission, setCustomPermission] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({
        user_id: member.user_id,
        employee_code: member.employee_code || '',
        internal_email: member.internal_email || '',
        job_title: member.job_title || '',
        manager_id: member.manager_id || '',
        role: member.role,
        status: member.status,
        permissions: member.permissions || [],
        joined_at: member.joined_at?.split('T')[0] || '',
        metadata: member.metadata || {},
      });
    } else {
      setFormData({
        tenant_id: tenantId,
        user_id: '',
        employee_code: '',
        internal_email: '',
        job_title: '',
        manager_id: '',
        role: 'MEMBER',
        status: 'ACTIVE',
        permissions: [],
        joined_at: new Date().toISOString().split('T')[0],
        metadata: {},
      });
    }
  }, [member, tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Clean up empty strings
      const cleanData = { ...formData };
      if (!cleanData.employee_code) delete cleanData.employee_code;
      if (!cleanData.internal_email) delete cleanData.internal_email;
      if (!cleanData.job_title) delete cleanData.job_title;
      if (!cleanData.manager_id) delete cleanData.manager_id;
      if (!cleanData.joined_at) delete cleanData.joined_at;

      await onSave(cleanData);
      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPermission = () => {
    if (!customPermission.trim()) return;
    
    const newPermissions = [...(formData.permissions || []), customPermission.trim()];
    setFormData({ ...formData, permissions: newPermissions });
    setCustomPermission('');
  };

  const handleRemovePermission = (index: number) => {
    const newPermissions = [...(formData.permissions || [])];
    newPermissions.splice(index, 1);
    setFormData({ ...formData, permissions: newPermissions });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {member ? 'Chỉnh Sửa Thành Viên' : 'Thêm Thành Viên Mới'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Selection */}
          {!member && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="UUID của user"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID của user trong hệ thống (UUID format)
              </p>
            </div>
          )}

          {/* Employee Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã Nhân Viên
              </label>
              <input
                type="text"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="VD: EMP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Nội Bộ
              </label>
              <input
                type="email"
                value={formData.internal_email}
                onChange={(e) => setFormData({ ...formData, internal_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chức Vụ
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="VD: Senior Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager ID
            </label>
            <input
              type="text"
              value={formData.manager_id}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="UUID của manager (optional)"
            />
            <p className="text-xs text-gray-500 mt-1">
              ID của tenant member làm manager
            </p>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai Trò <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng Thái <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ACTIVE">{t('common.active')}</option>
                <option value="ONBOARDING">{t('common.onboarding')}</option>
                <option value="SUSPENDED">{t('common.suspended')}</option>
                <option value="OFFBOARDED">Offboarded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày Tham Gia
            </label>
            <input
              type="date"
              value={formData.joined_at}
              onChange={(e) => setFormData({ ...formData, joined_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quyền Hạn (Permissions)
            </label>
            
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={customPermission}
                onChange={(e) => setCustomPermission(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPermission();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="VD: users.read, tenants.write"
              />
              <button
                type="button"
                onClick={handleAddPermission}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Thêm
              </button>
            </div>

            {formData.permissions && formData.permissions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.permissions.map((perm, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm"
                  >
                    {perm}
                    <button
                      type="button"
                      onClick={() => handleRemovePermission(index)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : member ? 'Cập Nhật' : 'Tạo Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MemberModal;