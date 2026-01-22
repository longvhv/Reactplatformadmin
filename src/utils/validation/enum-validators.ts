/**
 * Enum Validators
 * Validation for enumerated types (tier, status, region, etc.)
 */

import type { 
  TenantStatus,
  TenantTier,
  DataRegion,
  ComplianceLevel,
  BillingType 
} from '../../data/tenants';

import type { FieldValidationResult } from './field-validators';

// Allowed values from DATABASE_SCHEMA_STANDARD.md
export const ALLOWED_STATUSES: TenantStatus[] = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'];
export const ALLOWED_TIERS: TenantTier[] = [
  'FREE', 'PRO', 'ENTERPRISE', 
  'PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE', 
  'PROVIDER'
];
export const ALLOWED_REGIONS: DataRegion[] = ['ap-southeast-1', 'us-east-1', 'eu-central-1'];
export const ALLOWED_COMPLIANCE: ComplianceLevel[] = ['STANDARD', 'GDPR', 'HIPAA', 'PCI-DSS'];
export const ALLOWED_BILLING_TYPES: BillingType[] = ['PREPAID', 'POSTPAID'];

// Status transition rules
export const ALLOWED_STATUS_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  TRIAL: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['SUSPENDED', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED'],
  CANCELLED: [], // Cannot transition from cancelled
};

/**
 * Validate tier value
 */
export const validateTier = (tier: string): FieldValidationResult => {
  if (!ALLOWED_TIERS.includes(tier as TenantTier)) {
    return { 
      valid: false, 
      error: `Tier must be one of: ${ALLOWED_TIERS.join(', ')}` 
    };
  }
  return { valid: true };
};

/**
 * Validate status value
 */
export const validateStatus = (status: string): FieldValidationResult => {
  if (!ALLOWED_STATUSES.includes(status as TenantStatus)) {
    return { 
      valid: false, 
      error: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}` 
    };
  }
  return { valid: true };
};

/**
 * Validate status transition
 */
export const validateStatusTransition = (
  currentStatus: TenantStatus,
  newStatus: TenantStatus
): FieldValidationResult => {
  if (currentStatus === newStatus) {
    return { valid: true }; // No transition
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
    };
  }

  return { valid: true };
};

/**
 * Validate data region
 */
export const validateDataRegion = (region: string): FieldValidationResult => {
  if (!ALLOWED_REGIONS.includes(region as DataRegion)) {
    return { 
      valid: false, 
      error: `Region must be one of: ${ALLOWED_REGIONS.join(', ')}` 
    };
  }
  return { valid: true };
};

/**
 * Validate compliance level
 */
export const validateComplianceLevel = (level: string): FieldValidationResult => {
  if (!ALLOWED_COMPLIANCE.includes(level as ComplianceLevel)) {
    return { 
      valid: false, 
      error: `Compliance level must be one of: ${ALLOWED_COMPLIANCE.join(', ')}` 
    };
  }
  return { valid: true };
};

/**
 * Validate billing type
 */
export const validateBillingType = (type: string): FieldValidationResult => {
  if (!ALLOWED_BILLING_TYPES.includes(type as BillingType)) {
    return { 
      valid: false, 
      error: `Billing type must be one of: ${ALLOWED_BILLING_TYPES.join(', ')}` 
    };
  }
  return { valid: true };
};