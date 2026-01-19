/**
 * Enhanced Role Form Component
 * Standardized form for creating/editing roles
 * 
 * Compliant with roles schema:
 * - name: varchar(100) NOT NULL, length > 0
 * - type: ENUM ('SYSTEM', 'CUSTOM')
 * - permission_codes: text[]
 * - tenant_id: uuid NOT NULL
 */

import React, { useState, useEffect } from 'react';
import { 
  Role, 
  CreateRoleRequest, 
  UpdateRoleRequest, 
  RoleType 
} from '@/api/rolesApi';
import { tenantsApi, Tenant } from '@/api/tenantsApi';
import { permissionsApi, Permission } from '@/api/permissionsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X, Shield, Lock } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface EnhancedRoleFormProps {
  initialData?: Partial<Role>;
  isEdit?: boolean;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const ROLE_TYPES: { value: RoleType; label: string }[] = [
  { value: 'CUSTOM', label: 'Tùy chỉnh (Custom)' },
  { value: 'SYSTEM', label: 'Hệ thống (System)' },
];

export function EnhancedRoleForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  loading = false,
  onCancel
}: EnhancedRoleFormProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Form State
  const [formData, setFormData] = useState<Partial<CreateRoleRequest>>({
    tenant_id: '',
    name: '',
    description: '',
    type: 'CUSTOM',
    permission_codes: [],
  });

  // Load Metadata (Tenants & Permissions)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsData, permissionsData] = await Promise.all([
          tenantsApi.getAll(),
          permissionsApi.getAll()
        ]);
        setTenants(tenantsData);
        setPermissions(permissionsData);
      } catch (err) {
        console.error("Failed to load metadata", err);
        showToast.error("Lỗi", "Không thể tải dữ liệu danh mục");
      } finally {
        setLoadingMetadata(false);
      }
    };
    fetchData();
  }, []);

  // Load Initial Data
  useEffect(() => {
    if (initialData) {
      setFormData({
        tenant_id: initialData.tenant_id,
        name: initialData.name,
        description: initialData.description || '',
        type: initialData.type,
        permission_codes: initialData.permission_codes || [],
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePermission = (code: string) => {
    setFormData(prev => {
      const currentCodes = prev.permission_codes || [];
      if (currentCodes.includes(code)) {
        return { ...prev, permission_codes: currentCodes.filter(c => c !== code) };
      } else {
        return { ...prev, permission_codes: [...currentCodes, code] };
      }
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permission_codes: permissions.map(p => p.code)
    }));
  };

  const handleDeselectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permission_codes: []
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      showToast.error("Lỗi", "Tên vai trò là bắt buộc");
      return false;
    }
    if (!formData.tenant_id) {
      showToast.error("Lỗi", "Tenant là bắt buộc");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(formData as CreateRoleRequest);
    } catch (error: any) {
      console.error("Submit error:", error);
      showToast.error("Lỗi", error.message || "Có lỗi xảy ra");
    }
  };

  // Group permissions by App or Category if needed
  // For now just list them alphabetically or by app_code
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = perm.app_code || 'OTHER';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Thông tin vai trò
          </CardTitle>
          <CardDescription>Định nghĩa vai trò và quyền hạn trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tên vai trò <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange("name", e.target.value)}
                placeholder="VD: Admin, Manager..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant <span className="text-destructive">*</span></Label>
              <Select
                value={formData.tenant_id}
                onValueChange={val => handleChange("tenant_id", val)}
                disabled={isEdit} // Prevent moving role between tenants if editing
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn Tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Loại vai trò</Label>
              <Select
                value={formData.type}
                onValueChange={val => handleChange("type", val)}
                disabled={isEdit && initialData?.type === 'SYSTEM'} // System roles cannot change type easily usually
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && initialData?.type === 'SYSTEM' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3" /> Vai trò hệ thống không thể thay đổi loại
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange("description", e.target.value)}
                placeholder="Mô tả chi tiết về vai trò này..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Phân quyền (Permissions)
            </CardTitle>
            <div className="flex gap-2 text-sm">
              <Button type="button" variant="outline" size="sm" onClick={handleSelectAllPermissions}>
                Chọn tất cả
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDeselectAllPermissions}>
                Bỏ chọn
              </Button>
            </div>
          </div>
          <CardDescription>Chọn các quyền hạn được gán cho vai trò này</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full pr-4">
            {loadingMetadata ? (
              <div className="flex justify-center p-4">Đang tải danh sách quyền...</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([appCode, perms]) => (
                  <div key={appCode} className="space-y-2">
                    <h4 className="font-semibold text-sm bg-muted/50 p-2 rounded">{appCode}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-2">
                      {perms.map(perm => (
                        <div key={perm.code} className="flex items-start space-x-2">
                          <Checkbox
                            id={`perm-${perm.code}`}
                            checked={(formData.permission_codes || []).includes(perm.code)}
                            onCheckedChange={() => togglePermission(perm.code)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`perm-${perm.code}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {perm.name || perm.code}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {perm.code}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? "Đang lưu..." : (isEdit ? "Cập nhật" : "Tạo vai trò")}
          {!loading && <Save className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </form>
  );
}
