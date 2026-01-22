/**
 * Tenant Validators
 * Comprehensive validation for tenant CRUD operations
 */

import type { 
  Tenant, 
  CreateTenantInput, 
  UpdateTenantInput,
} from '../../data/tenants';

import {
  validateCode,
  validateEmail,
  validateName,
  validateTimezone,
  validatePhone,
  validateDomain,
  validateMaxUsers,
  validateMaxStorage,
  validateVersion,
} from './field-validators';

import {
  validateTier,
  validateStatus,
  validateStatusTransition,
  validateDataRegion,
  validateComplianceLevel,
  validateBillingType,
} from './enum-validators';

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Comprehensive validation for creating a tenant
 */
export const validateCreateTenant = (input: CreateTenantInput): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required fields
  const nameValidation = validateName(input.name);
  if (!nameValidation.valid) errors.name = nameValidation.error!;

  const codeValidation = validateCode(input.code);
  if (!codeValidation.valid) errors.code = codeValidation.error!;

  // Tier
  const tierValidation = validateTier(input.tier);
  if (!tierValidation.valid) errors.tier = tierValidation.error!;

  // Status
  const statusValidation = validateStatus(input.status);
  if (!statusValidation.valid) errors.status = statusValidation.error!;

  // Data region
  const regionValidation = validateDataRegion(input.data_region);
  if (!regionValidation.valid) errors.data_region = regionValidation.error!;

  // Compliance level
  const complianceValidation = validateComplianceLevel(input.compliance_level);
  if (!complianceValidation.valid) errors.compliance_level = complianceValidation.error!;

  // Billing type
  const billingValidation = validateBillingType(input.billing_type);
  if (!billingValidation.valid) errors.billing_type = billingValidation.error!;

  // Timezone
  const timezoneValidation = validateTimezone(input.timezone);
  if (!timezoneValidation.valid) errors.timezone = timezoneValidation.error!;

  // Profile validations
  if (input.profile?.billing_email) {
    const emailValidation = validateEmail(input.profile.billing_email);
    if (!emailValidation.valid) errors.billing_email = emailValidation.error!;
  } else {
    errors.billing_email = 'Billing email is required';
  }

  if (input.profile?.phone) {
    const phoneValidation = validatePhone(input.profile.phone);
    if (!phoneValidation.valid) errors.phone = phoneValidation.error!;
  }

  if (input.profile?.domain) {
    const domainValidation = validateDomain(input.profile.domain);
    if (!domainValidation.valid) errors.domain = domainValidation.error!;
  }

  // Settings validations
  if (input.settings) {
    const maxUsersValidation = validateMaxUsers(input.settings.max_users);
    if (!maxUsersValidation.valid) errors.max_users = maxUsersValidation.error!;

    const maxStorageValidation = validateMaxStorage(input.settings.max_storage);
    if (!maxStorageValidation.valid) errors.max_storage = maxStorageValidation.error!;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Comprehensive validation for updating a tenant
 */
export const validateUpdateTenant = (
  input: Partial<UpdateTenantInput>,
  currentTenant: Tenant
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Version check for optimistic locking
  if (input.version !== undefined) {
    const versionValidation = validateVersion(input.version);
    if (!versionValidation.valid) errors.version = versionValidation.error!;

    if (input.version !== currentTenant.version) {
      errors.version = 'Version mismatch. Tenant was modified by another user.';
    }
  }

  // Validate changed fields
  if (input.name !== undefined) {
    const nameValidation = validateName(input.name);
    if (!nameValidation.valid) errors.name = nameValidation.error!;
  }

  if (input.code !== undefined) {
    const codeValidation = validateCode(input.code);
    if (!codeValidation.valid) errors.code = codeValidation.error!;
  }

  if (input.tier !== undefined) {
    const tierValidation = validateTier(input.tier);
    if (!tierValidation.valid) errors.tier = tierValidation.error!;
  }

  if (input.status !== undefined) {
    const statusValidation = validateStatus(input.status);
    if (!statusValidation.valid) errors.status = statusValidation.error!;

    // Check status transition
    const transitionValidation = validateStatusTransition(currentTenant.status, input.status);
    if (!transitionValidation.valid) errors.status = transitionValidation.error!;
  }

  if (input.data_region !== undefined) {
    const regionValidation = validateDataRegion(input.data_region);
    if (!regionValidation.valid) errors.data_region = regionValidation.error!;
  }

  if (input.compliance_level !== undefined) {
    const complianceValidation = validateComplianceLevel(input.compliance_level);
    if (!complianceValidation.valid) errors.compliance_level = complianceValidation.error!;
  }

  if (input.billing_type !== undefined) {
    const billingValidation = validateBillingType(input.billing_type);
    if (!billingValidation.valid) errors.billing_type = billingValidation.error!;
  }

  if (input.timezone !== undefined) {
    const timezoneValidation = validateTimezone(input.timezone);
    if (!timezoneValidation.valid) errors.timezone = timezoneValidation.error!;
  }

  // Profile validations (if profile is being updated)
  if (input.profile) {
    if (input.profile.billing_email !== undefined) {
      const emailValidation = validateEmail(input.profile.billing_email);
      if (!emailValidation.valid) errors.billing_email = emailValidation.error!;
    }

    if (input.profile.phone !== undefined && input.profile.phone) {
      const phoneValidation = validatePhone(input.profile.phone);
      if (!phoneValidation.valid) errors.phone = phoneValidation.error!;
    }

    if (input.profile.domain !== undefined && input.profile.domain) {
      const domainValidation = validateDomain(input.profile.domain);
      if (!domainValidation.valid) errors.domain = domainValidation.error!;
    }
  }

  // Settings validations (if settings are being updated)
  if (input.settings) {
    if (input.settings.max_users !== undefined) {
      const maxUsersValidation = validateMaxUsers(input.settings.max_users);
      if (!maxUsersValidation.valid) errors.max_users = maxUsersValidation.error!;
    }

    if (input.settings.max_storage !== undefined) {
      const maxStorageValidation = validateMaxStorage(input.settings.max_storage);
      if (!maxStorageValidation.valid) errors.max_storage = maxStorageValidation.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// Re-export everything for convenience
export * from './field-validators';
export * from './enum-validators';
export * from './business-rules';