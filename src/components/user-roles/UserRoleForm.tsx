'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  CreateUserRoleRequest, 
  UpdateUserRoleRequest, 
  UserRoleScope,
  USER_ROLE_SCOPES,
  UserRoleScopeHelper
} from '../../api/userRolesApi';
import { usersApi, User } from '../../api/usersApi';
import { rolesApi, Role } from '../../api/rolesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { CalendarIcon, Save, Shield, User as UserIcon, Building, HelpCircle } from 'lucide-react';
import { showToast } from '../../lib/toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '../ui/utils';
import { Textarea } from '../ui/textarea';

interface UserRoleFormProps {
  initialData?: UserRole;
  isEdit?: boolean;
  onSubmit: (data: CreateUserRoleRequest | UpdateUserRoleRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UserRoleForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  loading = false 
}: UserRoleFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateUserRoleRequest & UpdateUserRoleRequest>>({
    scope: 'global',
    is_active: true,
    metadata: {},
    ...initialData
  });

  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(initialData?.metadata || {}, null, 2)
  );

  // Load Dependencies
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, rolesData] = await Promise.all([
          usersApi.getAll(),
          rolesApi.getAll()
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        console.error('Failed to load dependencies', err);
        showToast.error('Error', 'Failed to load users or roles');
      }
    };
    
    loadData();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJsonChange = (value: string) => {
    setMetadataJson(value);
  };

  const validate = () => {
    if (!isEdit) {
      if (!formData.user_id) return 'User is required';
      if (!formData.role_id) return 'Role is required';
    }
    
    if (UserRoleScopeHelper.requiresScopeId(formData.scope as UserRoleScope) && !formData.scope_id) {
       return `Scope ID is required for ${formData.scope} scope`;
    }

    if (UserRoleScopeHelper.requiresTenantId(formData.scope as UserRoleScope) && !formData.tenant_id) {
       // Note: In a real multi-tenant app, tenant_id might be auto-filled from context or strictly required.
       // For now we'll just warn if it's missing but not block if it's intended to be null (though DB might enforce it)
    }

    try {
      JSON.parse(metadataJson);
    } catch (e) {
      return 'Invalid JSON metadata';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      showToast.error('Validation Error', error);
      return;
    }

    try {
      const payload = {
        ...formData,
        metadata: JSON.parse(metadataJson),
      };
      await onSubmit(payload as any);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Role Assignment Details</CardTitle>
          <CardDescription>
            {isEdit ? 'Update user role assignment' : 'Assign a role to a user'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* User & Role Selection (ReadOnly in Edit) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={!isEdit ? "required" : ""}>User</Label>
              {isEdit ? (
                <div className="p-2 bg-muted rounded-md text-sm border flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500"/>
                  {users.find(u => u._id === formData.user_id)?.full_name || formData.user_id}
                </div>
              ) : (
                <Select 
                  value={formData.user_id} 
                  onValueChange={(v) => handleChange('user_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select User..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className={!isEdit ? "required" : ""}>Role</Label>
               {isEdit ? (
                <div className="p-2 bg-muted rounded-md text-sm border flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500"/>
                  {roles.find(r => r._id === formData.role_id)?.name || formData.role_id}
                </div>
              ) : (
                <Select 
                  value={formData.role_id} 
                  onValueChange={(v) => handleChange('role_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r._id} value={r._id}>
                        {r.name} ({r.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Scope Configuration */}
          <div className="space-y-4 pt-4 border-t">
             <div className="flex items-center gap-2">
                 <Building className="w-4 h-4 text-gray-500" />
                 <h3 className="text-sm font-medium text-gray-700">Scope & Context</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Scope Level</Label>
                    <Select 
                        value={formData.scope || 'global'} 
                        onValueChange={(v) => handleChange('scope', v as UserRoleScope)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {USER_ROLE_SCOPES.map(scope => (
                                <SelectItem key={scope} value={scope}>
                                    <span className="capitalize">{scope}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Conditional Inputs based on Scope */}
                {UserRoleScopeHelper.requiresScopeId(formData.scope as UserRoleScope) && (
                     <div className="space-y-2">
                        <Label className="required">Scope ID (Target ID)</Label>
                        <Input 
                            value={formData.scope_id || ''}
                            onChange={e => handleChange('scope_id', e.target.value)}
                            placeholder={`ID of ${formData.scope}`}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the specific {formData.scope} ID for this role.
                        </p>
                    </div>
                )}

                 {UserRoleScopeHelper.requiresTenantId(formData.scope as UserRoleScope) && (
                     <div className="space-y-2">
                        <Label>Tenant ID</Label>
                        <Input 
                            value={formData.tenant_id || ''}
                            onChange={e => handleChange('tenant_id', e.target.value)}
                            placeholder="Tenant UUID"
                        />
                    </div>
                )}
             </div>
          </div>

          {/* Status & Expiration */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700">Status & Lifecycle</h3>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="space-y-0.5">
                    <Label className="text-base">Active Assignment</Label>
                    <p className="text-sm text-muted-foreground">
                        Disable to temporarily revoke access without deleting.
                    </p>
                </div>
                <Switch 
                    checked={formData.is_active}
                    onCheckedChange={c => handleChange('is_active', c)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2 flex flex-col">
                     <Label>Expires At (Optional)</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.expires_at && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expires_at ? format(new Date(formData.expires_at), "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={formData.expires_at ? new Date(formData.expires_at) : undefined}
                            onSelect={(d) => d && handleChange('expires_at', d.toISOString())}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">Leave blank for permanent access.</p>
                 </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4 pt-4 border-t">
              <Label>Metadata (JSON)</Label>
              <Textarea 
                value={metadataJson}
                onChange={e => handleJsonChange(e.target.value)}
                className="font-mono text-xs h-[150px]"
              />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/> Save Assignment</>}
        </Button>
      </div>
    </form>
  );
}