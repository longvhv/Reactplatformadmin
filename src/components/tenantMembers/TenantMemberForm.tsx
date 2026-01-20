/**
 * Tenant Member Form Component
 * Create/Edit tenant member with validation
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { UserPlus, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { MemberRole, MemberStatus, TenantMemberFormData as ApiFormData } from '../../api/tenantMembersApi';

// ============================================
// TYPES
// ============================================

// Extend API form data with string fields for JSON editing
export interface TenantMemberFormData extends ApiFormData {
  permissionsString?: string;
  metadataString?: string;
}

interface TenantMemberFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ApiFormData) => Promise<void>;
  initialData?: Partial<ApiFormData>;
  tenants?: Array<{ _id: string; name: string; code: string }>;
  users?: Array<{ _id: string; name: string; email: string }>;
  managers?: Array<{ _id: string; user_name: string }>;
  mode?: 'create' | 'edit';
}

// ============================================
// COMPONENT
// ============================================

export function TenantMemberForm({
  open,
  onClose,
  onSubmit,
  initialData,
  tenants = [],
  users = [],
  managers = [],
  mode = 'create',
}: TenantMemberFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<TenantMemberFormData>({
    tenant_id: initialData?.tenant_id || '',
    user_id: initialData?.user_id || '',
    employee_code: initialData?.employee_code || '',
    internal_email: initialData?.internal_email || '',
    job_title: initialData?.job_title || '',
    manager_id: initialData?.manager_id || '',
    role: initialData?.role || 'MEMBER',
    status: initialData?.status || 'ACTIVE',
    joined_at: initialData?.joined_at || '',
    permissions: initialData?.permissions || [],
    metadata: initialData?.metadata || {},
    permissionsString: JSON.stringify(initialData?.permissions || [], null, 2),
    metadataString: JSON.stringify(initialData?.metadata || {}, null, 2),
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        tenant_id: initialData?.tenant_id || '',
        user_id: initialData?.user_id || '',
        employee_code: initialData?.employee_code || '',
        internal_email: initialData?.internal_email || '',
        job_title: initialData?.job_title || '',
        manager_id: initialData?.manager_id || '',
        role: initialData?.role || 'MEMBER',
        status: initialData?.status || 'ACTIVE',
        joined_at: initialData?.joined_at || '',
        permissions: initialData?.permissions || [],
        metadata: initialData?.metadata || {},
        permissionsString: JSON.stringify(initialData?.permissions || [], null, 2),
        metadataString: JSON.stringify(initialData?.metadata || {}, null, 2),
      });
      setErrors({});
    }
  }, [open, initialData]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenant_id) {
      newErrors.tenant_id = t('validation.required');
    }

    if (!formData.user_id) {
      newErrors.user_id = t('validation.required');
    }

    if (formData.internal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.internal_email)) {
      newErrors.internal_email = t('validation.invalidEmail');
    }

    // Validate JSON fields
    try {
      if (formData.permissionsString) {
        const parsed = JSON.parse(formData.permissionsString);
        if (!Array.isArray(parsed)) {
          newErrors.permissions = 'Permissions must be a JSON array';
        }
      }
    } catch (e) {
      newErrors.permissions = 'Invalid JSON format';
    }

    try {
      if (formData.metadataString) {
        const parsed = JSON.parse(formData.metadataString);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          newErrors.metadata = 'Metadata must be a JSON object';
        }
      }
    } catch (e) {
      newErrors.metadata = 'Invalid JSON format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      // Parse JSON fields
      const submitData: ApiFormData = {
        ...formData,
        permissions: formData.permissionsString ? JSON.parse(formData.permissionsString) : [],
        metadata: formData.metadataString ? JSON.parse(formData.metadataString) : {},
      };
      
      // Remove temporary fields
      delete (submitData as any).permissionsString;
      delete (submitData as any).metadataString;

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (field: keyof TenantMemberFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('tenantMembers.addMember') : t('tenantMembers.editMember')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new member to the tenant'
              : 'Update member information'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Selection (only for create mode) */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="tenant_id">
                Tenant <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.tenant_id} 
                onValueChange={(value) => handleChange('tenant_id', value)}
              >
                <SelectTrigger className={errors.tenant_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant._id} value={tenant._id}>
                      {tenant.name} ({tenant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenant_id && (
                <p className="text-sm text-red-500">{errors.tenant_id}</p>
              )}
            </div>
          )}

          {/* User Selection (only for create mode) */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="user_id">
                User <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.user_id} 
                onValueChange={(value) => handleChange('user_id', value)}
              >
                <SelectTrigger className={errors.user_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.user_id && (
                <p className="text-sm text-red-500">{errors.user_id}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Employee Code */}
            <div className="space-y-2">
              <Label htmlFor="employee_code">Employee Code</Label>
              <Input
                id="employee_code"
                value={formData.employee_code || ''}
                onChange={(e) => handleChange('employee_code', e.target.value)}
                placeholder="e.g., EMP-001"
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title || ''}
                onChange={(e) => handleChange('job_title', e.target.value)}
                placeholder="e.g., Senior Developer"
              />
            </div>
          </div>

          {/* Internal Email */}
          <div className="space-y-2">
            <Label htmlFor="internal_email">Internal Email</Label>
            <Input
              id="internal_email"
              type="email"
              value={formData.internal_email || ''}
              onChange={(e) => handleChange('internal_email', e.target.value)}
              placeholder="internal@company.com"
              className={errors.internal_email ? 'border-red-500' : ''}
            />
            {errors.internal_email && (
              <p className="text-sm text-red-500">{errors.internal_email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: MemberRole) => handleChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">{t('common.owner')}</SelectItem>
                  <SelectItem value="ADMIN">{t('common.admin')}</SelectItem>
                  <SelectItem value="MEMBER">{t('common.member')}</SelectItem>
                  <SelectItem value="VIEWER">{t('common.viewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: MemberStatus) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                  <SelectItem value="ONBOARDING">{t('common.onboarding')}</SelectItem>
                  <SelectItem value="SUSPENDED">{t('common.suspended')}</SelectItem>
                  <SelectItem value="RESIGNED">{t('common.resigned')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Manager */}
          {managers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="manager_id">Manager</Label>
              <Select 
                value={formData.manager_id || 'none'} 
                onValueChange={(value) => handleChange('manager_id', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {managers.map(manager => (
                    <SelectItem key={manager._id} value={manager._id}>
                      {manager.user_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Joined Date */}
            <div className="space-y-2">
              <Label htmlFor="joined_at">Joined Date</Label>
              <Input
                id="joined_at"
                type="date"
                value={formData.joined_at ? formData.joined_at.split('T')[0] : ''}
                onChange={(e) => handleChange('joined_at', e.target.value)}
              />
            </div>
          </div>

          {/* Permissions (JSON) */}
          <div className="space-y-2">
            <Label htmlFor="permissions">Permissions (JSON Array)</Label>
            <Textarea
              id="permissions"
              value={formData.permissionsString}
              onChange={(e) => handleChange('permissionsString', e.target.value)}
              placeholder='["READ_ALL", "WRITE_OWN"]'
              className={`font-mono text-xs ${errors.permissions ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors.permissions && (
              <p className="text-sm text-red-500">{errors.permissions}</p>
            )}
          </div>

          {/* Metadata (JSON) */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON Object)</Label>
            <Textarea
              id="metadata"
              value={formData.metadataString}
              onChange={(e) => handleChange('metadataString', e.target.value)}
              placeholder='{"department": "Engineering", "level": "L5"}'
              className={`font-mono text-xs ${errors.metadata ? 'border-red-500' : ''}`}
              rows={3}
            />
            {errors.metadata && (
              <p className="text-sm text-red-500">{errors.metadata}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {mode === 'create' ? t('common.create') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
