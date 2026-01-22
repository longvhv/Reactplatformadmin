/**
 * API Key Form Component
 * Form for creating/editing API keys
 * ✅ Compliance with api_keys schema
 */

import React, { useState, useEffect } from 'react';
import { 
  ApiKey, 
  CreateApiKeyInput, 
  UpdateApiKeyInput, 
  AVAILABLE_SCOPES,
  apiKeysService 
} from '../../services/apiKeysService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Key, Save, X, Shield, Globe, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useTranslation } from '../../providers/LanguageProvider';

interface ApiKeyFormProps {
  tenantId: string;
  initialData?: ApiKey;
  onSubmit: (data: CreateApiKeyInput | UpdateApiKeyInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ApiKeyForm({ tenantId, initialData, onSubmit, onCancel, loading }: ApiKeyFormProps) {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  
  // Form State
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [allowedIps, setAllowedIps] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedScopes(initialData.scopes);
      setAllowedIps(initialData.allowed_ips?.join(', ') || '');
      
      if (initialData.expires_at) {
        setExpiresIn('custom');
        // Format for datetime-local input: YYYY-MM-DDTHH:mm
        const date = new Date(initialData.expires_at);
        setCustomExpiresAt(date.toISOString().slice(0, 16));
      } else {
        setExpiresIn('never');
      }
    } else {
      // Defaults for new key
      setExpiresIn('never');
    }
  }, [initialData]);

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
    if (errors.scopes) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs.scopes;
        return newErrs;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t('apiKeys.nameRequired') || 'Name is required';
    }

    if (selectedScopes.length === 0) {
      newErrors.scopes = t('apiKeys.scopesRequired') || 'At least one scope is required';
    }

    if (allowedIps) {
      const ips = allowedIps.split(',').map(ip => ip.trim()).filter(Boolean);
      const invalidIps = ips.filter(ip => {
        // Simple CIDR/IP regex check
        return !/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip);
      });
      
      if (invalidIps.length > 0) {
        newErrors.allowedIps = `Invalid IPs: ${invalidIps.join(', ')}`;
      }
    }

    if (expiresIn === 'custom' && !customExpiresAt) {
      newErrors.expiresAt = 'Expiration date is required for custom duration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Parse IPs
      const ipsArray = allowedIps
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

      // Calculate expiration
      let expiresAt: string | undefined;
      
      if (expiresIn === 'never') {
        expiresAt = undefined;
      } else if (expiresIn === 'custom') {
        expiresAt = new Date(customExpiresAt).toISOString();
      } else {
        const days = parseInt(expiresIn);
        if (!isNaN(days)) {
          const date = new Date();
          date.setDate(date.getDate() + days);
          expiresAt = date.toISOString();
        }
      }

      if (isEdit) {
        const updateData: UpdateApiKeyInput = {
          name: name.trim(),
          scopes: selectedScopes,
          allowed_ips: ipsArray.length > 0 ? ipsArray : undefined,
          expires_at: expiresAt,
        };
        onSubmit(updateData);
      } else {
        const createData: CreateApiKeyInput = {
          tenant_id: tenantId,
          name: name.trim(),
          scopes: selectedScopes,
          allowed_ips: ipsArray.length > 0 ? ipsArray : undefined,
          expires_at: expiresAt,
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
            <Key className="w-5 h-5 text-indigo-600" />
            {isEdit ? (t('common.edit') + ' API Key') : (t('apiKeys.createKey') || 'Create API Key')}
          </CardTitle>
          <CardDescription>
            {t('apiKeys.subtitle') || 'Manage access tokens for your applications.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          
          {/* NAME */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('apiKeys.keyName') || 'Key Name'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Production Server, CI/CD Pipeline"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* SCOPES */}
          <div className="space-y-2">
            <Label>
              {t('apiKeys.permissions') || 'Permissions'} <span className="text-destructive">*</span>
            </Label>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg ${errors.scopes ? 'border-destructive' : 'border-input'}`}>
              {AVAILABLE_SCOPES.map(scope => (
                <div key={scope} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`scope-${scope}`} 
                    checked={selectedScopes.includes(scope)}
                    onCheckedChange={() => handleScopeToggle(scope)}
                  />
                  <Label 
                    htmlFor={`scope-${scope}`} 
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    {apiKeysService.getScopeDisplayName(scope)}
                    <Badge variant="outline" className="text-[10px] h-5 px-1 bg-muted/50 font-mono text-muted-foreground">
                      {scope}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
            {errors.scopes && <p className="text-sm text-destructive">{errors.scopes}</p>}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Select the minimum permissions required for this key.
            </p>
          </div>

          {/* ALLOWED IPS */}
          <div className="space-y-2">
            <Label htmlFor="allowedIps">
              {t('apiKeys.allowedIps') || 'Allowed IPs'} <span className="text-muted-foreground font-normal">({t('common.optional') || 'Optional'})</span>
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="allowedIps"
                value={allowedIps}
                onChange={e => {
                  setAllowedIps(e.target.value);
                  if (errors.allowedIps) setErrors(prev => ({ ...prev, allowedIps: '' }));
                }}
                placeholder="192.168.1.1, 10.0.0.0/24"
                className={`pl-9 ${errors.allowedIps ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.allowedIps && <p className="text-sm text-destructive">{errors.allowedIps}</p>}
            <p className="text-xs text-muted-foreground">
              Comma-separated list of IP addresses or CIDR blocks. Leave empty to allow from anywhere.
            </p>
          </div>

          {/* EXPIRATION */}
          <div className="space-y-2">
            <Label htmlFor="expiresIn">
              {t('apiKeys.expiration') || 'Expiration'}
            </Label>
            <div className="flex gap-4">
              <div className="w-1/2">
                <Select 
                  value={expiresIn} 
                  onValueChange={val => {
                    setExpiresIn(val);
                    if (val !== 'custom') {
                      setCustomExpiresAt('');
                    }
                  }}
                >
                  <SelectTrigger id="expiresIn">
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">365 days</SelectItem>
                    <SelectItem value="custom">Custom date...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {expiresIn === 'custom' && (
                <div className="w-1/2">
                  <Input
                    type="datetime-local"
                    value={customExpiresAt}
                    onChange={e => {
                      setCustomExpiresAt(e.target.value);
                      if (errors.expiresAt) setErrors(prev => ({ ...prev, expiresAt: '' }));
                    }}
                    className={errors.expiresAt ? 'border-destructive' : ''}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>
            {errors.expiresAt && <p className="text-sm text-destructive">{errors.expiresAt}</p>}
            
            {expiresIn === 'never' && (
              <Alert variant="warning" className="py-2 mt-2 bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-xs font-semibold">Security Warning</AlertTitle>
                <AlertDescription className="text-xs text-yellow-700">
                  Keys that never expire can pose a security risk if leaked. Consider setting an expiration date.
                </AlertDescription>
              </Alert>
            )}
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
            {loading ? (t('common.saving') || 'Saving...') : (isEdit ? (t('common.save') || 'Update Key') : (t('common.create') || 'Create Key'))}
          </Button>
        </div>
      </Card>
    </form>
  );
}