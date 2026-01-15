/**
 * UserRoleDialog - Dialog gán/sửa phân quyền
 * Kế thừa pattern từ các Dialog khác
 * 
 * ✅ FIXED 2026-01-14:
 * - All fields now exist in interface
 * - Added scope selector
 * - Added tenant_id field
 */

import { useState, useEffect } from 'react';
import { X, Shield, Save, AlertCircle, Globe, Building2, Users, Folder } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { userRolesApi, UserRole, UserRoleScope } from '../../api/userRolesApi';
import { supabase } from '../../utils/supabase/client';

interface UserRoleDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole?: UserRole | null;
}

export function UserRoleDialog({ open, onClose, onSuccess, userRole }: UserRoleDialogProps) {
  const [formData, setFormData] = useState({
    user_id: '',
    role_id: '',
    tenant_id: '',
    scope: 'global' as UserRoleScope,
    scope_id: '',
    expires_at: '',
    is_active: true,
  });
  
  const [users, setUsers] = useState<Array<{ _id: string; email: string; full_name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load users, roles, and tenants từ Supabase
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Populate form khi edit
  useEffect(() => {
    if (userRole) {
      setFormData({
        user_id: userRole.user_id,
        role_id: userRole.role_id,
        tenant_id: userRole.tenant_id || '',
        scope: userRole.scope,
        scope_id: userRole.scope_id || '',
        expires_at: userRole.expires_at ? userRole.expires_at.split('T')[0] : '',
        is_active: userRole.is_active !== false,
      });
    } else {
      setFormData({
        user_id: '',
        role_id: '',
        tenant_id: '',
        scope: 'global',
        scope_id: '',
        expires_at: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [userRole, open]);

  const loadData = async () => {
    try {
      // Load users
      const { data: usersData } = await supabase
        .from('users')
        .select('_id, email, full_name')
        .is('deleted_at', null)
        .order('full_name');
      
      if (usersData) setUsers(usersData);

      // Load roles
      const { data: rolesData } = await supabase
        .from('roles')
        .select('_id, name, slug')
        .is('deleted_at', null)
        .order('name');
      
      if (rolesData) setRoles(rolesData);

      // Load tenants
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('_id, name')
        .is('deleted_at', null)
        .order('name');
      
      if (tenantsData) setTenants(tenantsData);
    } catch (error: any) {
      toast.error('❌ Failed to load data: ' + error.message);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_id) newErrors.user_id = 'Vui lòng chọn người dùng';
    if (!formData.role_id) newErrors.role_id = 'Vui lòng chọn vai trò';
    
    // Validate scope-specific requirements
    if (formData.scope === 'tenant' && !formData.tenant_id) {
      newErrors.tenant_id = 'Vui lòng chọn tenant cho scope tenant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      if (userRole) {
        // Update
        await userRolesApi.update(userRole._id, {
          scope: formData.scope,
          scope_id: formData.scope_id || undefined,
          is_active: formData.is_active,
          expires_at: formData.expires_at || undefined,
        });
        toast.success('✅ Cập nhật phân quyền thành công!');
      } else {
        // Create
        await userRolesApi.create({
          user_id: formData.user_id,
          role_id: formData.role_id,
          tenant_id: formData.tenant_id || undefined,
          scope: formData.scope,
          scope_id: formData.scope_id || undefined,
          expires_at: formData.expires_at || undefined,
          is_active: formData.is_active,
          metadata: {},
        });
        toast.success('✅ Thêm phân quyền thành công!');
      }

      onSuccess();
    } catch (error: any) {
      toast.error('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getScopeIcon = (scope: UserRoleScope) => {
    switch (scope) {
      case 'global': return Globe;
      case 'tenant': return Building2;
      case 'department': return Users;
      case 'project': return Folder;
      default: return Shield;
    }
  };

  const ScopeIcon = getScopeIcon(formData.scope);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <DialogTitle>
              {userRole ? 'Sửa phân quyền' : 'Thêm phân quyền'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* User */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Người dùng <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              disabled={!!userRole}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.user_id ? 'border-red-500' : 'border-gray-300'
              } ${userRole ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Chọn người dùng --</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.user_id}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              disabled={!!userRole}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.role_id ? 'border-red-500' : 'border-gray-300'
              } ${userRole ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Chọn vai trò --</option>
              {roles.map(role => (
                <option key={role._id} value={role._id}>
                  {role.name} ({role.slug})
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.role_id}
              </p>
            )}
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <ScopeIcon className="w-4 h-4" />
              Phạm vi (Scope)
            </label>
            <select
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value as UserRoleScope })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="global">🌐 Global (Toàn hệ thống)</option>
              <option value="tenant">🏢 Tenant (Tổ chức)</option>
              <option value="department">👥 Department (Phòng ban)</option>
              <option value="project">📁 Project (Dự án)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Xác định phạm vi áp dụng của vai trò
            </p>
          </div>

          {/* Tenant ID (conditional) */}
          {formData.scope === 'tenant' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tenant <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.tenant_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Chọn tenant --</option>
                {tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              {errors.tenant_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.tenant_id}
                </p>
              )}
            </div>
          )}

          {/* Scope ID (for department/project) */}
          {(formData.scope === 'department' || formData.scope === 'project') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.scope === 'department' ? 'Department ID' : 'Project ID'}
              </label>
              <Input
                value={formData.scope_id}
                onChange={(e) => setFormData({ ...formData, scope_id: e.target.value })}
                placeholder={`UUID của ${formData.scope}`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Tùy chọn - Để trống nếu không cần giới hạn cụ thể
              </p>
            </div>
          )}

          {/* Expires At */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ngày hết hạn (tùy chọn)
            </label>
            <Input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="mt-1 text-xs text-gray-500">
              Để trống nếu không giới hạn thời gian
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Kích hoạt ngay
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {userRole ? 'Cập nhật' : 'Thêm mới'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
