/**
 * Service Account Form Component
 * Form for creating/editing service accounts
 * ✅ Compliance with service_accounts schema
 */

import React, { useState, useEffect } from 'react';
import { 
  ServiceAccount, 
  CreateServiceAccountInput, 
  UpdateServiceAccountInput 
} from '@/services/serviceAccountsService';
import { tenantMembersApi, TenantMember } from '@/api/tenantMembersApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Save, X, User } from 'lucide-react';
import { useTranslation } from '@/providers/LanguageProvider';

interface ServiceAccountFormProps {
  tenantId: string;
  initialData?: ServiceAccount;
  onSubmit: (data: CreateServiceAccountInput | UpdateServiceAccountInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ServiceAccountForm({ tenantId, initialData, onSubmit, onCancel, loading }: ServiceAccountFormProps) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberId, setMemberId] = useState('');
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMembers();
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setMemberId(initialData.member_id);
    }
  }, [initialData, tenantId]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await tenantMembersApi.getByTenant(tenantId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t('serviceAccounts.nameRequired') || 'Name is required';
    }

    if (!memberId && !isEdit) {
      // Member ID cannot be changed after creation usually, but schema allows it as it's a FK.
      // However, typically service accounts are tied to a creator. 
      // For creating, it's definitely required.
      newErrors.memberId = t('serviceAccounts.memberRequired') || 'Associated member is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit) {
        const updateData: UpdateServiceAccountInput = {
          name: name.trim(),
          description: description.trim() || undefined,
        };
        onSubmit(updateData);
      } else {
        const createData: CreateServiceAccountInput = {
          tenant_id: tenantId,
          member_id: memberId,
          name: name.trim(),
          description: description.trim() || undefined,
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
            <UserCog className="w-5 h-5 text-indigo-600" />
            {isEdit ? (t('common.edit') + ' Service Account') : (t('serviceAccounts.createAccount') || 'Create Service Account')}
          </CardTitle>
          <CardDescription>
            {t('serviceAccounts.subtitle') || 'Manage automated access for your applications.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          
          {/* NAME */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('serviceAccounts.accountName') || 'Account Name'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Payment Processor, CI/CD Bot"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* MEMBER (Required for creation, typically readonly for edit but we allow viewing) */}
          <div className="space-y-2">
            <Label htmlFor="memberId">
              {t('serviceAccounts.associatedMember') || 'Associated Member'} <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={memberId} 
              onValueChange={val => {
                setMemberId(val);
                if (errors.memberId) setErrors(prev => ({ ...prev, memberId: '' }));
              }}
              disabled={isEdit || loadingMembers} // Often service accounts are tied to a member permanently, but if not, enable it. Sticking to disabled for edit for safety unless requested.
            >
              <SelectTrigger className={errors.memberId ? 'border-destructive' : ''}>
                <SelectValue placeholder={loadingMembers ? "Loading members..." : "Select a member"} />
              </SelectTrigger>
              <SelectContent>
                {members.map(member => (
                  <SelectItem key={member._id} value={member._id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{member.internal_email || member.user_id}</span>
                      <span className="text-xs text-muted-foreground">({member.role})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.memberId && <p className="text-sm text-destructive">{errors.memberId}</p>}
            <p className="text-xs text-muted-foreground">
              The service account will inherit permissions from this member context.
            </p>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('serviceAccounts.description') || 'Description'} <span className="text-muted-foreground font-normal">({t('common.optional') || 'Optional'})</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this service account is used for..."
              rows={3}
            />
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
            {loading ? (t('common.saving') || 'Saving...') : (isEdit ? (t('common.save') || 'Update Account') : (t('common.create') || 'Create Account'))}
          </Button>
        </div>
      </Card>
    </form>
  );
}
