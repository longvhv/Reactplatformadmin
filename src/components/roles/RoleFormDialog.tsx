/**
 * Role Form Dialog
 * Create/Edit role with validation
 * 
 * ✅ UPDATED 2026-01-14: Uses new Role interface with 9 fields
 */

import React, { useState, useEffect } from 'react';
import { Role, RoleType, CreateRoleRequest, UpdateRoleRequest } from '../../api/rolesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Shield, Plus, Trash2 } from 'lucide-react';

interface RoleFormDialogProps {
  role?: Role | null;
  tenantId?: string | null;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  onClose: () => void;
}

const COMMON_PERMISSIONS = [
  'users:read',
  'users:write',
  'users:delete',
  'roles:read',
  'roles:write',
  'roles:delete',
  'tenants:read',
  'tenants:write',
  'tenants:delete',
  'members:read',
  'members:write',
  'members:delete',
  'settings:read',
  'settings:write',
];

export function RoleFormDialog({
  role,
  tenantId,
  onSubmit,
  onClose,
}: RoleFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CUSTOM' as RoleType,
    permission_codes: [] as string[],
  });

  const [customPermission, setCustomPermission] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        type: role.type || 'CUSTOM',
        permission_codes: role.permission_codes || [],
      });
    } else {
      // Reset to default when creating new
      setFormData({
        name: '',
        description: '',
        type: 'CUSTOM',
        permission_codes: [],
      });
    }
  }, [role]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên vai trò là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (role) {
        // Update existing role
        const updateData: UpdateRoleRequest = {
          name: formData.name,
          description: formData.description || undefined,
          permission_codes: formData.permission_codes,
        };
        await onSubmit(updateData);
      } else {
        // Create new role
        if (!tenantId) {
          setErrors({ submit: 'Tenant ID is required' });
          setSubmitting(false);
          return;
        }
        
        const createData: CreateRoleRequest = {
          tenant_id: tenantId,
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          permission_codes: formData.permission_codes,
        };
        await onSubmit(createData);
      }
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permission_codes: prev.permission_codes.includes(perm)
        ? prev.permission_codes.filter(p => p !== perm)
        : [...prev.permission_codes, perm],
    }));
  };

  const addCustomPermission = () => {
    if (!customPermission.trim()) return;
    
    if (formData.permission_codes.includes(customPermission.trim())) {
      setCustomPermission('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      permission_codes: [...prev.permission_codes, customPermission.trim()],
    }));
    setCustomPermission('');
  };

  const removePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permission_codes: prev.permission_codes.filter(p => p !== perm),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {role ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
              </h2>
              <p className="text-sm text-gray-500">
                {tenantId ? 'Vai trò tenant' : 'Vai trò hệ thống'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">
                Tên vai trò <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="VD: HR Manager"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Mô tả chi tiết về vai trò này..."
              />
            </div>

            {/* Type (only for create) */}
            {!role && (
              <div>
                <Label htmlFor="type">Loại vai trò</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as RoleType })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="CUSTOM">Custom (Tùy chỉnh)</option>
                  <option value="SYSTEM">System (Hệ thống)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  SYSTEM roles không thể xóa sau khi tạo
                </p>
              </div>
            )}

            {/* Common Permissions */}
            <div>
              <Label>Quyền hạn phổ biến</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {COMMON_PERMISSIONS.map(perm => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permission_codes.includes(perm)}
                      onChange={() => togglePermission(perm)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {perm}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Permission Input */}
            <div>
              <Label>Thêm quyền tùy chỉnh</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="text"
                  value={customPermission}
                  onChange={e => setCustomPermission(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomPermission();
                    }
                  }}
                  placeholder="VD: reports:export"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addCustomPermission}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm
                </Button>
              </div>
            </div>

            {/* Selected Permissions */}
            {formData.permission_codes.length > 0 && (
              <div>
                <Label>Quyền đã chọn ({formData.permission_codes.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.permission_codes.map(perm => (
                    <span
                      key={perm}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-sm font-mono"
                    >
                      {perm}
                      <button
                        type="button"
                        onClick={() => removePermission(perm)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <Button onClick={onClose} variant="outline" disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu...' : role ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RoleFormDialog;
