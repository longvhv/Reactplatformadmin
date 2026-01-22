/**
 * RoleForm Component
 * Reusable form for Add/Edit Role pages
 * 
 * ✅ UPDATED 2026-01-20: Strict schema compliance
 */

import React, { useState, useEffect } from 'react';
import { Role, RoleType, CreateRoleRequest, UpdateRoleRequest } from '../../api/rolesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Shield, Plus, X, Info, AlertCircle } from 'lucide-react';

interface RoleFormProps {
  role?: Role | null;
  tenantId?: string | null;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Common permission categories
const PERMISSION_CATEGORIES = {
  'Users': [
    { code: 'users:read', label: 'View Users', description: 'View user list and details' },
    { code: 'users:write', label: 'Manage Users', description: 'Create and edit users' },
    { code: 'users:delete', label: 'Delete Users', description: 'Delete users' },
  ],
  'Roles': [
    { code: 'roles:read', label: 'View Roles', description: 'View role list and details' },
    { code: 'roles:write', label: 'Manage Roles', description: 'Create and edit roles' },
    { code: 'roles:delete', label: 'Delete Roles', description: 'Delete roles' },
  ],
  'Tenants': [
    { code: 'tenants:read', label: 'View Tenants', description: 'View tenant information' },
    { code: 'tenants:write', label: 'Manage Tenants', description: 'Create and edit tenants' },
    { code: 'tenants:delete', label: 'Delete Tenants', description: 'Delete tenants' },
  ],
  'Settings': [
    { code: 'settings:read', label: 'View Settings', description: 'View system settings' },
    { code: 'settings:write', label: 'Manage Settings', description: 'Modify system settings' },
  ],
  'Products': [
    { code: 'products:read', label: 'View Products', description: 'View product list' },
    { code: 'products:write', label: 'Manage Products', description: 'Create and edit products' },
    { code: 'products:delete', label: 'Delete Products', description: 'Delete products' },
  ],
};

export function RoleForm({ role, tenantId, onSubmit, onCancel, isLoading = false }: RoleFormProps) {
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
      newErrors.name = 'Role name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Role name too long (max 100 chars)';
    }

    if (!role && !tenantId) {
      newErrors.tenant = 'Tenant ID is required for new roles';
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
        // Note: 'type' cannot be updated
        const updateData: UpdateRoleRequest = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          permission_codes: formData.permission_codes,
        };
        await onSubmit(updateData);
      } else {
        // Create new role
        if (!tenantId) {
          setErrors({ submit: 'Tenant ID is required' });
          return;
        }

        const createData: CreateRoleRequest = {
          tenant_id: tenantId,
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          type: formData.type,
          permission_codes: formData.permission_codes,
        };
        await onSubmit(createData);
      }
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const togglePermission = (code: string) => {
    setFormData(prev => ({
      ...prev,
      permission_codes: prev.permission_codes.includes(code)
        ? prev.permission_codes.filter(p => p !== code)
        : [...prev.permission_codes, code],
    }));
  };

  const addCustomPermission = () => {
    const trimmed = customPermission.trim();
    if (!trimmed) return;

    if (formData.permission_codes.includes(trimmed)) {
      setCustomPermission('');
      return;
    }

    // Validate format (should be like "module:action")
    if (!/^[a-z0-9_]+:[a-z0-9_]+$/.test(trimmed)) {
      setErrors({ ...errors, customPermission: 'Format: module:action (e.g., users:read)' });
      return;
    }

    setFormData(prev => ({
      ...prev,
      permission_codes: [...prev.permission_codes, trimmed],
    }));
    setCustomPermission('');
    setErrors({ ...errors, customPermission: '' });
  };

  const removePermission = (code: string) => {
    setFormData(prev => ({
      ...prev,
      permission_codes: prev.permission_codes.filter(p => p !== code),
    }));
  };

  const customPermissions = formData.permission_codes.filter(code => {
    return !Object.values(PERMISSION_CATEGORIES)
      .flat()
      .some(p => p.code === code);
  });

  const isSystemRole = role?.type === 'SYSTEM';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Banner */}
      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div className="text-sm text-red-800 dark:text-red-300">
              <p className="font-semibold">Error</p>
              <p>{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Basic Information
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">
              Role Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="e.g. HR Manager, Team Lead"
              disabled={isLoading || submitting || isSystemRole} // System roles name cannot be changed usually, but let's allow it if API allows? Schema says NO specific constraint on update, but logic usually protects system roles. Let's disable for SYSTEM.
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
            )}
            {isSystemRole && (
              <p className="text-xs text-gray-500 mt-1">System role names cannot be changed.</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Role description and responsibilities..."
              rows={3}
              disabled={isLoading || submitting}
            />
          </div>

          {/* Type (only for create) */}
          {!role && (
            <div>
              <Label htmlFor="type">Role Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as RoleType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={isLoading || submitting}
              >
                <option value="CUSTOM">Custom</option>
                <option value="SYSTEM">System</option>
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <Info className="w-4 h-4 inline mr-1" />
                SYSTEM roles cannot be deleted.
              </p>
            </div>
          )}

          {role && (
             <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium">Type:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  role.type === 'SYSTEM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {role.type}
                </span>
             </div>
          )}

          {isSystemRole && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <Info className="w-4 h-4" />
                This is a System Role. Only permissions can be modified (or nothing if protected). 
                Assuming permissions are editable.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Permissions ({formData.permission_codes.length} selected)
        </h3>

        <div className="space-y-6">
          {/* Permission Categories */}
          {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">{category}</h4>
              <div className="space-y-2">
                {permissions.map(perm => (
                  <label
                    key={perm.code}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permission_codes.includes(perm.code)}
                      onChange={() => togglePermission(perm.code)}
                      className="mt-1"
                      disabled={isLoading || submitting}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {perm.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {perm.description}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                        {perm.code}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Permissions */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Custom Permissions</h4>
            
            {/* Add Custom Permission */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <Input
                  value={customPermission}
                  onChange={e => setCustomPermission(e.target.value)}
                  placeholder="module:action (e.g., reports:read)"
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomPermission();
                    }
                  }}
                  className={errors.customPermission ? 'border-red-500' : ''}
                  disabled={isLoading || submitting}
                />
                {errors.customPermission && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.customPermission}
                  </p>
                )}
              </div>
              <Button
                type="button"
                onClick={addCustomPermission}
                variant="outline"
                disabled={isLoading || submitting}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Custom Permission List */}
            {customPermissions.length > 0 && (
              <div className="space-y-2">
                {customPermissions.map(code => (
                  <div
                    key={code}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <code className="text-sm font-mono text-gray-900 dark:text-white">
                      {code}
                    </code>
                    <button
                      type="button"
                      onClick={() => removePermission(code)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      disabled={isLoading || submitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {customPermissions.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No custom permissions. Add if needed.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || isLoading}
          className="min-w-[120px]"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>{role ? 'Update Role' : 'Create Role'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
