/**
 * App Capability Form Component
 * Form for creating/editing application capabilities
 * 
 * Compliant with app_capabilities schema:
 * - type: FEATURE | LIMIT
 * - default_value: JSONB
 * - status: active | inactive | archived
 */

import React, { useState, useEffect } from 'react';
import { 
  AppCapability, 
  CreateAppCapabilityRequest, 
  UpdateAppCapabilityRequest 
} from '../../api/appCapabilitiesApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { AlertCircle, Save } from 'lucide-react';
import { showToast } from '../../lib/toast';

interface AppCapabilityFormProps {
  initialData?: AppCapability;
  tenantId: string;
  appId: string;
  onSubmit: (data: CreateAppCapabilityRequest | UpdateAppCapabilityRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AppCapabilityForm({
  initialData,
  tenantId,
  appId,
  onSubmit,
  onCancel,
  isLoading = false
}: AppCapabilityFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'FEATURE' as 'FEATURE' | 'LIMIT',
    status: 'active' as 'active' | 'inactive' | 'archived',
    is_required: false,
    display_order: 0,
    // Helper fields for default_value JSONB
    defaultValueType: 'boolean' as 'boolean' | 'number' | 'string',
    defaultValueBoolean: false,
    defaultValueNumber: 0,
    defaultValueString: '',
    defaultValueUnit: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      // Parse default value based on content
      let defType: 'boolean' | 'number' | 'string' = 'string';
      let defBool = false;
      let defNum = 0;
      let defStr = '';
      let defUnit = '';

      if (initialData.default_value) {
        if (typeof initialData.default_value.enabled === 'boolean') {
          defType = 'boolean';
          defBool = initialData.default_value.enabled;
        } else if (typeof initialData.default_value.value === 'number') {
          defType = 'number';
          defNum = initialData.default_value.value;
          defUnit = initialData.default_value.unit || '';
        } else if (typeof initialData.default_value.value === 'string') {
          defStr = initialData.default_value.value;
        }
      } else if (initialData.type === 'FEATURE') {
        defType = 'boolean';
      } else {
        defType = 'number';
      }

      setFormData({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description || '',
        type: initialData.type,
        status: initialData.status,
        is_required: initialData.is_required,
        display_order: initialData.display_order,
        defaultValueType: defType,
        defaultValueBoolean: defBool,
        defaultValueNumber: defNum,
        defaultValueString: defStr,
        defaultValueUnit: defUnit,
      });
    } else {
      // Defaults for new capability
      setFormData(prev => ({
        ...prev,
        code: '',
        name: '',
        type: 'FEATURE',
        defaultValueType: 'boolean',
      }));
    }
  }, [initialData]);

  // Handle Type Change -> Update Default Value Type defaults
  useEffect(() => {
    if (!initialData) {
      if (formData.type === 'FEATURE') {
        setFormData(prev => ({ ...prev, defaultValueType: 'boolean' }));
      } else {
        setFormData(prev => ({ ...prev, defaultValueType: 'number' }));
      }
    }
  }, [formData.type, initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (formData.code.length > 50) {
      newErrors.code = 'Code max length is 50';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.display_order < 0) {
      newErrors.display_order = 'Order must be >= 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Construct default_value JSON
      let defaultValue: Record<string, any> = {};
      
      if (formData.defaultValueType === 'boolean') {
        defaultValue = { enabled: formData.defaultValueBoolean };
      } else if (formData.defaultValueType === 'number') {
        defaultValue = { 
          value: Number(formData.defaultValueNumber),
          unit: formData.defaultValueUnit || undefined
        };
      } else {
        defaultValue = { value: formData.defaultValueString };
      }

      const commonData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        default_value: defaultValue,
        status: formData.status,
        is_required: formData.is_required,
        display_order: formData.display_order,
      };

      if (initialData) {
        // Update
        const updateData: UpdateAppCapabilityRequest = {
          ...commonData,
          version: initialData.version,
        };
        await onSubmit(updateData);
      } else {
        // Create
        const createData: CreateAppCapabilityRequest = {
          tenant_id: tenantId,
          app_id: appId,
          code: formData.code,
          ...commonData,
        };
        await onSubmit(createData);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      showToast.error('Error', error.message || 'Failed to submit form');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              disabled={!!initialData}
              placeholder="e.g. max_users"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Max Users"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'FEATURE' | 'LIMIT' })}
              className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="FEATURE">Feature (Boolean)</option>
              <option value="LIMIT">Limit (Numeric/Value)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        {/* Default Value Section */}
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <Label className="mb-2 block">Default Value Configuration</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div className="space-y-2">
              <Label htmlFor="valType" className="text-xs text-muted-foreground">Data Type</Label>
              <select
                id="valType"
                value={formData.defaultValueType}
                onChange={(e) => setFormData({ ...formData, defaultValueType: e.target.value as any })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="boolean">Boolean (Enabled/Disabled)</option>
                <option value="number">Number</option>
                <option value="string">String</option>
              </select>
            </div>
          </div>

          {formData.defaultValueType === 'boolean' && (
             <div className="flex items-center gap-2">
               <Switch
                 id="defBool"
                 checked={formData.defaultValueBoolean}
                 onCheckedChange={(c) => setFormData({ ...formData, defaultValueBoolean: c })}
               />
               <Label htmlFor="defBool">{formData.defaultValueBoolean ? 'Enabled' : 'Disabled'}</Label>
             </div>
          )}

          {formData.defaultValueType === 'number' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defNum">Value</Label>
                <Input
                  id="defNum"
                  type="number"
                  value={formData.defaultValueNumber}
                  onChange={(e) => setFormData({ ...formData, defaultValueNumber: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defUnit">Unit (Optional)</Label>
                <Input
                  id="defUnit"
                  placeholder="e.g. GB, Users"
                  value={formData.defaultValueUnit}
                  onChange={(e) => setFormData({ ...formData, defaultValueUnit: e.target.value })}
                />
              </div>
            </div>
          )}

          {formData.defaultValueType === 'string' && (
            <div className="space-y-2">
              <Label htmlFor="defStr">Value</Label>
              <Input
                id="defStr"
                value={formData.defaultValueString}
                onChange={(e) => setFormData({ ...formData, defaultValueString: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
            />
          </div>
          
          <div className="flex items-center gap-2 pt-8">
             <Switch
               id="is_required"
               checked={formData.is_required}
               onCheckedChange={(c) => setFormData({ ...formData, is_required: c })}
             />
             <Label htmlFor="is_required">Required Capability</Label>
          </div>
        </div>
      </div>

      {/* Audit Info (Read Only) */}
      {initialData && (
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(initialData.created_at).toLocaleString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{' '}
            {new Date(initialData.updated_at).toLocaleString('vi-VN')}
          </div>
          <div>
            <span className="font-medium">Version:</span> {initialData.version}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (initialData ? 'Update Capability' : 'Create Capability')}
        </Button>
      </div>
    </form>
  );
}