/**
 * Tenant Invitation Form Component
 * Form for creating/editing tenant invitations
 * ✅ Compliance with tenant_invitations schema
 */

import React, { useState, useEffect } from 'react';
import { 
  TenantInvitation, 
  CreateInvitationRequest, 
  UpdateInvitationRequest
} from '../../api/tenantInvitationsApi';
import { departmentsApi, Department } from '../../api/departmentsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Mail, Save, X, Calendar, Building } from 'lucide-react';
import { useTranslation } from '../../providers/LanguageProvider';

interface TenantInvitationFormProps {
  tenantId: string;
  initialData?: TenantInvitation;
  onSubmit: (data: CreateInvitationRequest | UpdateInvitationRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

export function TenantInvitationForm({ 
  tenantId, 
  initialData, 
  onSubmit, 
  onCancel, 
  loading 
}: TenantInvitationFormProps) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  
  // Form State
  const [email, setEmail] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>(['MEMBER']);
  const [departmentId, setDepartmentId] = useState<string>('none');
  const [expiresInDays, setExpiresInDays] = useState<string>('7');
  const [expiresAt, setExpiresAt] = useState('');
  
  // Data State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDepartments();
    if (initialData) {
      setEmail(initialData.email);
      setRoleIds(initialData.role_ids || []);
      setDepartmentId(initialData.department_id || 'none');
      
      if (initialData.expires_at) {
        setExpiresAt(new Date(initialData.expires_at).toISOString().split('T')[0]);
      }
    }
  }, [initialData, tenantId]);

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const data = await departmentsApi.getAll({ tenant_id: tenantId });
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      setRoleIds(prev => [...prev, role]);
    } else {
      setRoleIds(prev => prev.filter(r => r !== role));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = t('common.required') || 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (isEdit && !expiresAt) {
      newErrors.expiresAt = t('common.required') || 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        const updateData: UpdateInvitationRequest = {
          email: email.trim(),
          role_ids: roleIds,
          department_id: departmentId === 'none' ? null : departmentId,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        };
        onSubmit(updateData);
      } else {
        const createData: CreateInvitationRequest = {
          tenant_id: tenantId,
          email: email.trim(),
          role_ids: roleIds,
          department_id: departmentId === 'none' ? null : departmentId,
          expires_in_days: parseInt(expiresInDays),
        };
        onSubmit(createData);
      }
    } catch (error) {
      console.error('Form submission error', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-5 h-5 text-indigo-600" />
            {isEdit ? 'Edit Invitation' : 'Send Invitation'}
          </CardTitle>
          <CardDescription>
            Invite a new member to your tenant via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          
          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="user@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DEPARTMENT */}
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <Select 
                value={departmentId} 
                onValueChange={setDepartmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- None --</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span>{dept.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* EXPIRY */}
            <div className="space-y-2">
              <Label htmlFor="expiry">
                {isEdit ? 'Expiry Date' : 'Expires In'}
                {isEdit && <span className="text-destructive">*</span>}
              </Label>
              {isEdit ? (
                <>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={expiresAt}
                    onChange={e => {
                      setExpiresAt(e.target.value);
                      if (errors.expiresAt) setErrors(prev => ({ ...prev, expiresAt: '' }));
                    }}
                    className={errors.expiresAt ? 'border-destructive' : ''}
                  />
                  {errors.expiresAt && <p className="text-sm text-destructive">{errors.expiresAt}</p>}
                </>
              ) : (
                <Select 
                  value={expiresInDays} 
                  onValueChange={setExpiresInDays}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* ROLES */}
          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50/50">
              {ROLES.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`role-${role}`} 
                    checked={roleIds.includes(role)}
                    onCheckedChange={(checked) => handleRoleChange(role, checked as boolean)}
                  />
                  <Label htmlFor={`role-${role}`} className="cursor-pointer font-normal">
                    {role}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more roles for the invited user.
            </p>
          </div>

        </CardContent>
        
        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" />
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-1" />
            {loading ? (t('common.saving') || 'Saving...') : (isEdit ? (t('common.save') || 'Update Invitation') : (t('common.send') || 'Send Invitation'))}
          </Button>
        </div>
      </Card>
    </form>
  );
}