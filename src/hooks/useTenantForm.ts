/**
 * useTenantForm Hook
 * Manages tenant form state and validation
 * Supports both create and update modes with optimistic locking
 */

import { useState, useCallback, useMemo } from 'react';
import type { Tenant, CreateTenantInput } from '../data/tenants';
import { validateCreateTenant, validateUpdateTenant } from '../utils/tenant-validation';

export interface UseTenantFormProps {
  initialData?: Tenant;
  onSubmit: (data: Partial<Tenant>) => Promise<void>;
}

export interface UseTenantFormReturn {
  formData: Partial<Tenant>;
  errors: Record<string, string>;
  loading: boolean;
  isEditMode: boolean;
  updateField: (field: string, value: any) => void;
  updateProfile: (field: string, value: any) => void;
  updateSettings: (field: string, value: any) => void;
  generateCode: () => void;
  handleSubmit: () => Promise<boolean>;
  reset: () => void;
}

export function useTenantForm({ initialData, onSubmit }: UseTenantFormProps): UseTenantFormReturn {
  // Memoize initial form state
  const defaultFormData = useMemo(() => ({
    name: initialData?.name || '',
    code: initialData?.code || '',
    data_region: initialData?.data_region || 'ap-southeast-1',
    compliance_level: initialData?.compliance_level || 'STANDARD',
    parent_tenant_id: initialData?.parent_tenant_id || null,
    tier: initialData?.tier || 'FREE',
    billing_type: initialData?.billing_type || 'POSTPAID',
    timezone: initialData?.timezone || 'UTC',
    status: initialData?.status || 'TRIAL',
    profile: initialData?.profile || {},
    settings: initialData?.settings || {
      max_users: 10,
      max_storage: 10,
      current_users: 0,
      current_storage: 0,
      mfa_enforced: false,
      sso_enabled: false,
      custom_branding: false,
      api_access: false,
      features: [],
    },
    version: initialData?.version || 1,
  }), [initialData]);

  const [formData, setFormData] = useState<Partial<Tenant>>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Determine if in edit mode
  const isEditMode = Boolean(initialData);

  /**
   * Update single field
   */
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Update profile field
   */
  const updateProfile = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  }, []);

  /**
   * Update settings field
   */
  const updateSettings = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  }, []);

  /**
   * Auto-generate code from name
   */
  const generateCode = useCallback(() => {
    const code = (formData.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    updateField('code', code);
  }, [formData.name, updateField]);

  /**
   * Validate form data
   */
  const validate = useCallback(() => {
    const validation = initialData
      ? validateUpdateTenant(formData as any, initialData)
      : validateCreateTenant(formData as CreateTenantInput);

    setErrors(validation.errors);
    return validation.valid;
  }, [formData, initialData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (!validate()) {
      console.warn('[useTenantForm] Validation failed:', errors);
      return false;
    }

    setLoading(true);
    setErrors({});

    try {
      await onSubmit(formData);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed';
      setErrors({ submit: errorMessage });
      console.error('[useTenantForm] Submission error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, validate, errors]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormData(defaultFormData);
    setErrors({});
    setLoading(false);
  }, [defaultFormData]);

  return {
    formData,
    errors,
    loading,
    isEditMode,
    updateField,
    updateProfile,
    updateSettings,
    generateCode,
    handleSubmit,
    reset,
  };
}