/**
 * Tenant Validation Utilities
 * Server-side validation for tenant operations
 */

import type { CreateTenantInput, UpdateTenantInput } from '../../../data/tenants.ts';

// Constants (duplicated for server-side to avoid import issues)
const PATTERNS = {
  CODE: /^[a-z0-9-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[0-9\s-()]+$/,
} as const;

const LENGTH = {
  CODE_MIN: 3,
  CODE_MAX: 64,
  NAME_MIN: 2,
  NAME_MAX: 255,
} as const;

const ALLOWED_STATUSES = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'];
const ALLOWED_TIERS = ['FREE', 'PRO', 'ENTERPRISE', 'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE', 'PROVIDER'];
const ALLOWED_REGIONS = ['ap-southeast-1', 'us-east-1', 'eu-central-1'];
const ALLOWED_COMPLIANCE = ['STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS'];
const ALLOWED_BILLING = ['PREPAID', 'POSTPAID'];

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate tenant code
 */
export function validateCode(code: string): ValidationError | null {
  if (!code || code.trim() === '') {
    return { field: 'code', message: 'Tenant code is required' };
  }
  
  if (code.length < LENGTH.CODE_MIN) {
    return { field: 'code', message: `Tenant code must be at least ${LENGTH.CODE_MIN} characters` };
  }
  
  if (code.length > LENGTH.CODE_MAX) {
    return { field: 'code', message: `Tenant code must not exceed ${LENGTH.CODE_MAX} characters` };
  }
  
  if (!PATTERNS.CODE.test(code)) {
    return { field: 'code', message: 'Tenant code must contain only lowercase letters, numbers, and hyphens' };
  }
  
  return null;
}

/**
 * Validate tenant name
 */
export function validateName(name: string): ValidationError | null {
  if (!name || name.trim() === '') {
    return { field: 'name', message: 'Tenant name is required' };
  }
  
  if (name.length < LENGTH.NAME_MIN) {
    return { field: 'name', message: `Tenant name must be at least ${LENGTH.NAME_MIN} characters` };
  }
  
  if (name.length > LENGTH.NAME_MAX) {
    return { field: 'name', message: `Tenant name must not exceed ${LENGTH.NAME_MAX} characters` };
  }
  
  return null;
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email || email.trim() === '') {
    return { field: 'billing_email', message: 'Billing email is required' };
  }
  
  if (!PATTERNS.EMAIL.test(email)) {
    return { field: 'billing_email', message: 'Invalid email format' };
  }
  
  return null;
}

/**
 * Validate enum field
 */
export function validateEnum(
  field: string,
  value: string,
  allowedValues: readonly string[],
  fieldLabel: string
): ValidationError | null {
  if (!allowedValues.includes(value)) {
    return { 
      field, 
      message: `${fieldLabel} must be one of: ${allowedValues.join(', ')}` 
    };
  }
  return null;
}

/**
 * Validate create tenant input
 */
export function validateCreateTenant(input: CreateTenantInput): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  const codeError = validateCode(input.code);
  if (codeError) errors.push(codeError);
  
  const nameError = validateName(input.name);
  if (nameError) errors.push(nameError);
  
  // Email validation
  if (input.profile?.billing_email) {
    const emailError = validateEmail(input.profile.billing_email);
    if (emailError) errors.push(emailError);
  }
  
  // Enum validations
  if (input.tier) {
    const tierError = validateEnum('tier', input.tier, ALLOWED_TIERS, 'Tier');
    if (tierError) errors.push(tierError);
  }
  
  if (input.status) {
    const statusError = validateEnum('status', input.status, ALLOWED_STATUSES, 'Status');
    if (statusError) errors.push(statusError);
  }
  
  if (input.data_region) {
    const regionError = validateEnum('data_region', input.data_region, ALLOWED_REGIONS, 'Data region');
    if (regionError) errors.push(regionError);
  }
  
  if (input.compliance_level) {
    const complianceError = validateEnum('compliance_level', input.compliance_level, ALLOWED_COMPLIANCE, 'Compliance level');
    if (complianceError) errors.push(complianceError);
  }
  
  if (input.billing_type) {
    const billingError = validateEnum('billing_type', input.billing_type, ALLOWED_BILLING, 'Billing type');
    if (billingError) errors.push(billingError);
  }
  
  // Numeric validations
  if (input.settings?.max_users !== undefined && input.settings.max_users < 1) {
    errors.push({ field: 'max_users', message: 'Max users must be at least 1' });
  }
  
  if (input.settings?.max_storage_gb !== undefined && input.settings.max_storage_gb < 1) {
    errors.push({ field: 'max_storage_gb', message: 'Max storage must be at least 1 GB' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate update tenant input
 */
export function validateUpdateTenant(input: UpdateTenantInput): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate only provided fields
  if (input.code !== undefined) {
    const codeError = validateCode(input.code);
    if (codeError) errors.push(codeError);
  }
  
  if (input.name !== undefined) {
    const nameError = validateName(input.name);
    if (nameError) errors.push(nameError);
  }
  
  if (input.profile?.billing_email !== undefined) {
    const emailError = validateEmail(input.profile.billing_email);
    if (emailError) errors.push(emailError);
  }
  
  if (input.tier !== undefined) {
    const tierError = validateEnum('tier', input.tier, ALLOWED_TIERS, 'Tier');
    if (tierError) errors.push(tierError);
  }
  
  if (input.status !== undefined) {
    const statusError = validateEnum('status', input.status, ALLOWED_STATUSES, 'Status');
    if (statusError) errors.push(statusError);
  }
  
  if (input.data_region !== undefined) {
    const regionError = validateEnum('data_region', input.data_region, ALLOWED_REGIONS, 'Data region');
    if (regionError) errors.push(regionError);
  }
  
  if (input.compliance_level !== undefined) {
    const complianceError = validateEnum('compliance_level', input.compliance_level, ALLOWED_COMPLIANCE, 'Compliance level');
    if (complianceError) errors.push(complianceError);
  }
  
  if (input.billing_type !== undefined) {
    const billingError = validateEnum('billing_type', input.billing_type, ALLOWED_BILLING, 'Billing type');
    if (billingError) errors.push(billingError);
  }
  
  if (input.settings?.max_users !== undefined && input.settings.max_users < 1) {
    errors.push({ field: 'max_users', message: 'Max users must be at least 1' });
  }
  
  if (input.settings?.max_storage_gb !== undefined && input.settings.max_storage_gb < 1) {
    errors.push({ field: 'max_storage_gb', message: 'Max storage must be at least 1 GB' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
