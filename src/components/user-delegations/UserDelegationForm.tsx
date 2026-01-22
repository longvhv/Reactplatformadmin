'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserDelegation, 
  CreateDelegationRequest, 
  UpdateDelegationRequest, 
  DelegationScope,
  DelegationScopeHelper,
  DelegationStatus,
  DelegationStatusHelper
} from '../../api/userDelegationsApi';
import { usersApi, User } from '../../api/usersApi';
import { tenantsApi } from '../../api/tenantsApi';
import type { Tenant } from '../../data/tenants';
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
import { Save, UserCog, Calendar as CalendarIcon, FileText, Shield } from 'lucide-react';
import { showToast } from '../../lib/toast';
import { Textarea } from '../ui/textarea';

interface UserDelegationFormProps {
  initialData?: UserDelegation;
  isEdit?: boolean;
  onSubmit: (data: CreateDelegationRequest | UpdateDelegationRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UserDelegationForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  loading = false 
}: UserDelegationFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateDelegationRequest & UpdateDelegationRequest>>({
    scope: 'viewer',
    status: 'active',
    auto_expire: true,
    start_date: new Date().toISOString(),
    metadata: {},
    permissions: [],
    ...initialData
  });

  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(initialData?.metadata || {}, null, 2)
  );

  const [permissionsJson, setPermissionsJson] = useState(
    JSON.stringify(initialData?.permissions || [], null, 2)
  );

  // Load Dependencies
  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, tenantsData] = await Promise.all([
          usersApi.getAll(),
          tenantsApi.getAll()
        ]);
        setUsers(usersData);
        setTenants(tenantsData);
      } catch (err) {
        console.error('Failed to load dependencies', err);
        showToast.error('Error', 'Failed to load users or tenants');
      }
    };
    
    loadData();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJsonChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
  };

  const validate = () => {
    if (!isEdit) {
      if (!formData.delegator_id) return 'Delegator is required';
      if (!formData.delegate_id) return 'Delegate is required';
      if (formData.delegator_id === formData.delegate_id) return 'Delegator and delegate cannot be the same';
    }
    
    if (!formData.scope) return 'Scope is required';
    if (!formData.start_date) return 'Start date is required';
    
    if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date!)) {
        return 'End date must be after start date';
    }

    try {
      JSON.parse(metadataJson);
    } catch (e) {
      return 'Invalid Metadata JSON';
    }

    try {
        const perms = JSON.parse(permissionsJson);
        if (!Array.isArray(perms)) return 'Permissions must be a JSON array of strings';
    } catch (e) {
        return 'Invalid Permissions JSON';
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
        permissions: JSON.parse(permissionsJson),
      };
      await onSubmit(payload as any);
    } catch (err: any) {
      console.error(err);
    }
  };

  const delegationScopes: DelegationScope[] = [
      'admin', 'manager', 'editor', 'viewer', 'approver', 'reviewer', 'auditor', 'custom'
  ];

  const delegationStatuses: DelegationStatus[] = [
      'pending', 'active', 'expired', 'revoked', 'suspended'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Delegation Details</CardTitle>
          <CardDescription>
            {isEdit ? 'Update delegation settings' : 'Delegate authority to another user'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Identity Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={!isEdit ? "required" : ""}>Delegator (Grantor)</Label>
              {isEdit ? (
                <div className="p-2 bg-muted rounded-md text-sm border">
                   {users.find(u => u._id === formData.delegator_id)?.full_name || formData.delegator_id}
                </div>
              ) : (
                <Select 
                  value={formData.delegator_id} 
                  onValueChange={(v) => handleChange('delegator_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Delegator..." />
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
              <Label className={!isEdit ? "required" : ""}>Delegate (Receiver)</Label>
               {isEdit ? (
                <div className="p-2 bg-muted rounded-md text-sm border">
                   {users.find(u => u._id === formData.delegate_id)?.full_name || formData.delegate_id}
                </div>
              ) : (
                <Select 
                  value={formData.delegate_id} 
                  onValueChange={(v) => handleChange('delegate_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Delegate..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u._id !== formData.delegator_id).map(u => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
              <Label>Tenant Context (Optional)</Label>
              <Select 
                  value={formData.tenant_id || 'none'} 
                  onValueChange={(v) => handleChange('tenant_id', v === 'none' ? undefined : v)}
              >
                  <SelectTrigger>
                      <SelectValue placeholder="Select Tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="none">-- All Tenants / Global --</SelectItem>
                      {tenants.map(t => (
                          <SelectItem key={t._id} value={t._id}>
                              {t.name}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>

          {/* Scope & Permissions */}
          <div className="space-y-4 pt-4 border-t">
             <div className="flex items-center gap-2">
                 <Shield className="w-4 h-4 text-gray-500" />
                 <h3 className="text-sm font-medium text-gray-700">Scope & Permissions</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="required">Scope</Label>
                    <Select 
                        value={formData.scope} 
                        onValueChange={(v) => handleChange('scope', v as DelegationScope)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {delegationScopes.map(scope => (
                                <SelectItem key={scope} value={scope}>
                                    <span className="capitalize">{scope}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {isEdit && (
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                            value={formData.status} 
                            onValueChange={(v) => handleChange('status', v as DelegationStatus)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {delegationStatuses.map(status => (
                                    <SelectItem key={status} value={status}>
                                        <span className="capitalize">{status}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
             </div>

             <div className="space-y-2">
                <Label>Specific Permissions (JSON Array)</Label>
                <Textarea 
                    value={permissionsJson}
                    onChange={e => handleJsonChange(setPermissionsJson, e.target.value)}
                    className="font-mono text-xs h-[80px]"
                    placeholder='["read:reports", "write:tasks"]'
                />
             </div>
          </div>

          {/* Time & Reason */}
          <div className="space-y-4 pt-4 border-t">
             <div className="flex items-center gap-2">
                 <CalendarIcon className="w-4 h-4 text-gray-500" />
                 <h3 className="text-sm font-medium text-gray-700">Duration & Context</h3>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="required">Start Date</Label>
                    <Input 
                        type="datetime-local"
                        value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                        onChange={e => handleChange('start_date', new Date(e.target.value).toISOString())}
                    />
                </div>
                <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Input 
                        type="datetime-local"
                        value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                        onChange={e => handleChange('end_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                </div>
            </div>

            <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                    <Label>Auto Expire</Label>
                    <Switch 
                        checked={formData.auto_expire}
                        onCheckedChange={c => handleChange('auto_expire', c)}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Automatically set status to 'expired' when end date is reached.
                </p>
            </div>

            <div className="space-y-2">
                <Label>Reason</Label>
                <Input 
                    value={formData.reason || ''}
                    onChange={e => handleChange('reason', e.target.value)}
                    placeholder="e.g. Vacation coverage"
                />
            </div>

             <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                    className="h-[80px]"
                />
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4 pt-4 border-t">
              <Label>Metadata (JSON)</Label>
              <Textarea 
                value={metadataJson}
                onChange={e => handleJsonChange(setMetadataJson, e.target.value)}
                className="font-mono text-xs h-[100px]"
              />
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/> Save Delegation</>}
        </Button>
      </div>
    </form>
  );
}