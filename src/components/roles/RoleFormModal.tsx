/**
 * RoleFormModal Component
 * Modal for creating/editing roles - Chuẩn Stripe/GitHub UI
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Shield, 
  AlertCircle, 
  Info, 
  Search,
  CheckCircle2,
  Lock,
  Plus,
  Zap,
  Users,
  Settings,
  Database,
  Key,
  FileText,
  Globe,
  Building2
} from 'lucide-react';
import { Button } from '../ui/button';
import { 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest,
  RoleType
} from '../../api/rolesApi';
import { TenantSelect } from '../common/TenantSelect';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  role?: Role | null;
  tenantId: string;
}

// Permission categories with icons
const PERMISSION_CATEGORIES = [
  {
    id: 'users',
    name: 'Người dùng',
    icon: Users,
    permissions: [
      { code: 'users.create', name: 'Tạo người dùng', description: 'Cho phép tạo tài khoản người dùng mới' },
      { code: 'users.read', name: 'Xem người dùng', description: 'Cho phép xem thông tin người dùng' },
      { code: 'users.update', name: 'Cập nhật người dùng', description: 'Cho phép chỉnh sửa thông tin người dùng' },
      { code: 'users.delete', name: 'Xóa người dùng', description: 'Cho phép xóa tài khoản người dùng', dangerous: true },
      { code: 'users.manage_roles', name: 'Quản lý vai trò', description: 'Cho phép gán/xóa vai trò của người dùng' },
    ]
  },
  {
    id: 'tenants',
    name: 'Tenants',
    icon: Globe,
    permissions: [
      { code: 'tenants.create', name: 'Tạo tenant', description: 'Cho phép tạo tenant mới' },
      { code: 'tenants.read', name: 'Xem tenant', description: 'Cho phép xem thông tin tenant' },
      { code: 'tenants.update', name: 'Cập nhật tenant', description: 'Cho phép chỉnh sửa cấu hình tenant' },
      { code: 'tenants.delete', name: 'Xóa tenant', description: 'Cho phép xóa tenant', dangerous: true },
      { code: 'tenants.suspend', name: 'Đình chỉ tenant', description: 'Cho phép tạm ngưng hoạt động tenant' },
    ]
  },
  {
    id: 'roles',
    name: 'Vai trò & Quyền',
    icon: Shield,
    permissions: [
      { code: 'roles.create', name: 'Tạo vai trò', description: 'Cho phép tạo vai trò mới' },
      { code: 'roles.read', name: 'Xem vai trò', description: 'Cho phép xem danh sách vai trò' },
      { code: 'roles.update', name: 'Cập nhật vai trò', description: 'Cho phép chỉnh sửa vai trò' },
      { code: 'roles.delete', name: 'Xóa vai trò', description: 'Cho phép xóa vai trò', dangerous: true },
      { code: 'roles.manage_permissions', name: 'Quản lý quyền', description: 'Cho phép thêm/xóa quyền trong vai trò' },
    ]
  },
  {
    id: 'content',
    name: 'Nội dung',
    icon: FileText,
    permissions: [
      { code: 'content.create', name: 'Tạo nội dung', description: 'Cho phép tạo bài viết, trang' },
      { code: 'content.read', name: 'Xem nội dung', description: 'Cho phép xem nội dung' },
      { code: 'content.update', name: 'Cập nhật nội dung', description: 'Cho phép chỉnh sửa nội dung' },
      { code: 'content.delete', name: 'Xóa nội dung', description: 'Cho phép xóa nội dung' },
      { code: 'content.publish', name: 'Xuất bản', description: 'Cho phép xuất bản nội dung' },
    ]
  },
  {
    id: 'settings',
    name: 'Cài đặt',
    icon: Settings,
    permissions: [
      { code: 'settings.read', name: 'Xem cài đặt', description: 'Cho phép xem cài đặt hệ thống' },
      { code: 'settings.update', name: 'Cập nhật cài đặt', description: 'Cho phép thay đổi cài đặt' },
      { code: 'settings.manage_api_keys', name: 'Quản lý API keys', description: 'Cho phép tạo/xóa API keys' },
      { code: 'settings.manage_webhooks', name: 'Quản lý webhooks', description: 'Cho phép cấu hình webhooks' },
    ]
  },
  {
    id: 'data',
    name: 'Dữ liệu',
    icon: Database,
    permissions: [
      { code: 'data.export', name: 'Export dữ liệu', description: 'Cho phép xuất dữ liệu' },
      { code: 'data.import', name: 'Import dữ liệu', description: 'Cho phép nhập dữ liệu' },
      { code: 'data.backup', name: 'Backup', description: 'Cho phép tạo bản sao lưu' },
      { code: 'data.restore', name: 'Restore', description: 'Cho phép khôi phục dữ liệu', dangerous: true },
    ]
  },
  {
    id: 'advanced',
    name: 'Nâng cao',
    icon: Zap,
    permissions: [
      { code: 'admin.full_access', name: 'Toàn quyền Admin', description: 'Quyền quản trị viên tối cao', dangerous: true },
      { code: 'system.manage', name: 'Quản lý hệ thống', description: 'Cho phép quản lý cấu hình hệ thống', dangerous: true },
      { code: 'audit.read', name: 'Xem audit logs', description: 'Cho phép xem nhật ký hệ thống' },
      { code: 'billing.manage', name: 'Quản lý thanh toán', description: 'Cho phép quản lý gói và thanh toán' },
    ]
  },
];

export function RoleFormModal({ isOpen, onClose, onSave, role, tenantId }: RoleFormModalProps) {
  const [formData, setFormData] = useState<Partial<CreateRoleRequest>>({
    tenant_id: tenantId,
    name: '',
    description: '',
    type: 'CUSTOM',
    permission_codes: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'permissions'>('basic');

  useEffect(() => {
    if (role) {
      setFormData({
        tenant_id: role.tenant_id,
        name: role.name,
        description: role.description,
        type: role.type,
        permission_codes: role.permission_codes,
      });
      setSelectedPermissions(new Set(role.permission_codes));
    } else {
      resetForm();
    }
  }, [role, tenantId, isOpen]);

  const resetForm = () => {
    setFormData({
      tenant_id: tenantId,
      name: '',
      description: '',
      type: 'CUSTOM',
      permission_codes: [],
    });
    setSelectedPermissions(new Set());
    setErrors({});
    setActiveTab('basic');
    setSearchQuery('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên vai trò là bắt buộc';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên vai trò không được vượt quá 100 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setActiveTab('basic');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        permission_codes: Array.from(selectedPermissions),
      } as CreateRoleRequest;

      await onSave(submitData);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error saving role:', err);
      setErrors({ submit: 'Lỗi khi lưu vai trò. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(code)) {
        newSet.delete(code);
      } else {
        newSet.add(code);
      }
      return newSet;
    });
  };

  const selectAllInCategory = (categoryId: string) => {
    const category = PERMISSION_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    const categoryPermissions = category.permissions.map(p => p.code);
    const allSelected = categoryPermissions.every(code => selectedPermissions.has(code));

    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        categoryPermissions.forEach(code => newSet.delete(code));
      } else {
        categoryPermissions.forEach(code => newSet.add(code));
      }
      return newSet;
    });
  };

  // Filter permissions by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return PERMISSION_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return PERMISSION_CATEGORIES.map(category => ({
      ...category,
      permissions: category.permissions.filter(p =>
        p.code.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      ),
    })).filter(category => category.permissions.length > 0);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {role ? 'Chỉnh sửa Vai trò' : 'Thêm Vai trò'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cấu hình vai trò và phân quyền cho người dùng
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
              { id: 'basic', label: 'Thông tin cơ bản', icon: Shield },
              { id: 'permissions', label: `Quyền hạn (${selectedPermissions.size})`, icon: Lock },
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
                    Tên vai trò <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="VD: Quản lý nội dung, Biên tập viên..."
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

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại vai trò
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'CUSTOM', label: 'Custom', desc: 'Vai trò tùy chỉnh cho tenant', icon: Shield },
                      { value: 'SYSTEM', label: 'System', desc: 'Vai trò hệ thống, được bảo vệ', icon: Lock },
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <label 
                          key={option.value}
                          className={`
                            flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all
                            ${formData.type === option.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                            ${role && role.type === 'SYSTEM' ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={option.value}
                            checked={formData.type === option.value}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as RoleType })}
                            disabled={role && role.type === 'SYSTEM'}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{option.label}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {role && role.type === 'SYSTEM' && (
                    <p className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Không thể thay đổi loại của vai trò SYSTEM
                    </p>
                  )}
                </div>

                {/* Tenant Selector - Only show if NOT SYSTEM type */}
                {formData.type !== 'SYSTEM' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tenant <span className="text-red-500">*</span>
                    </label>
                    <TenantSelect
                      value={formData.tenant_id}
                      onChange={(tenantId) => setFormData({ ...formData, tenant_id: tenantId })}
                      placeholder="Chọn tenant..."
                      disabled={!!role} // Cannot change tenant when editing
                      className="w-full"
                    />
                    {role && (
                      <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Không thể thay đổi tenant sau khi tạo vai trò
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả vai trò và phạm vi trách nhiệm..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Vai trò hoạt động như thế nào?</p>
                      <p className="text-blue-800">
                        Vai trò là tập hợp các quyền hạn. Gán vai trò cho người dùng để cấp quyền truy cập vào các tính năng và dữ liệu của hệ thống.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
              <div className="space-y-5">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm quyền..."
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Selected Count */}
                <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-indigo-900">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">
                      {selectedPermissions.size} quyền đã chọn
                    </span>
                  </div>
                  {selectedPermissions.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(new Set())}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                {/* Permission Categories */}
                <div className="space-y-4">
                  {filteredCategories.map((category) => {
                    const Icon = category.icon;
                    const categoryPermissions = category.permissions.map(p => p.code);
                    const selectedCount = categoryPermissions.filter(code => selectedPermissions.has(code)).length;
                    const allSelected = selectedCount === categoryPermissions.length;

                    return (
                      <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Category Header */}
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-gray-600" />
                            <h4 className="text-sm font-semibold text-gray-900">
                              {category.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              ({selectedCount}/{categoryPermissions.length})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => selectAllInCategory(category.id)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                          </button>
                        </div>

                        {/* Permissions List */}
                        <div className="p-3 space-y-2">
                          {category.permissions.map((permission) => {
                            const isSelected = selectedPermissions.has(permission.code);
                            return (
                              <label
                                key={permission.code}
                                className={`
                                  flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                                  ${isSelected
                                    ? 'bg-indigo-50 border border-indigo-200'
                                    : 'hover:bg-gray-50 border border-transparent'
                                  }
                                  ${permission.dangerous ? 'ring-1 ring-red-200' : ''}
                                `}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePermission(permission.code)}
                                  className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                      {permission.name}
                                    </span>
                                    {permission.dangerous && (
                                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                        Nguy hiểm
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                    {permission.code}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredCategories.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Không tìm thấy quyền phù hợp</p>
                  </div>
                )}
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
                {saving ? 'Đang lưu...' : role ? 'Cập nhật Vai trò' : 'Tạo Vai trò'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoleFormModal;