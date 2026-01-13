/**
 * Tenant Member Form Component
 * Create/Edit tenant member with validation
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { UserPlus, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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

// ============================================
// TYPES
// ============================================

export interface TenantMemberFormData {
  tenant_id: string;
  user_id: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';
  joined_at?: string;
  left_at?: string;
}

interface TenantMemberFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TenantMemberFormData) => Promise<void>;
  initialData?: Partial<TenantMemberFormData>;
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
    left_at: initialData?.left_at || '',
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
        left_at: initialData?.left_at || '',
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

    if (formData.joined_at && formData.left_at) {
      const joinedDate = new Date(formData.joined_at);
      const leftDate = new Date(formData.left_at);
      if (leftDate <= joinedDate) {
        newErrors.left_at = 'Left date must be after joined date';
      }
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
      await onSubmit(formData);
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
                value={formData.employee_code}
                onChange={(e) => handleChange('employee_code', e.target.value)}
                placeholder="e.g., EMP-001"
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
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
              value={formData.internal_email}
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
                onValueChange={(value: any) => handleChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
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
                onValueChange={(value: any) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="RESIGNED">Resigned</SelectItem>
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
                onValueChange={(value) => handleChange('manager_id', value === 'none' ? '' : value)}
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
                value={formData.joined_at}
                onChange={(e) => handleChange('joined_at', e.target.value)}
              />
            </div>

            {/* Left Date */}
            <div className="space-y-2">
              <Label htmlFor="left_at">Left Date</Label>
              <Input
                id="left_at"
                type="date"
                value={formData.left_at}
                onChange={(e) => handleChange('left_at', e.target.value)}
                className={errors.left_at ? 'border-red-500' : ''}
              />
              {errors.left_at && (
                <p className="text-sm text-red-500">{errors.left_at}</p>
              )}
            </div>
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
