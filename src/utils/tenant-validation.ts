/**
 * Tenant Validation (Main Export)
 * 
 * This file re-exports all validation functions from modularized files.
 * 
 * Refactored structure:
 * - /utils/validation/field-validators.ts - Basic field validations
 * - /utils/validation/enum-validators.ts - Enum type validations
 * - /utils/validation/business-rules.ts - Business logic validations
 * - /utils/validation/tenant-validators.ts - Composite tenant validations
 */

// Export all validation functions
export * from './validation/field-validators';
export * from './validation/enum-validators';
export * from './validation/business-rules';
export * from './validation/tenant-validators';

// Default export for compatibility
import {
  validateCode,
  validateEmail,
  validateName,
  validateTier,
  validateStatus,
  validateStatusTransition,
  validateDataRegion,
  validateComplianceLevel,
  validateBillingType,
  validateTimezone,
  validateMaxUsers,
  validateMaxStorage,
  validateCreateTenant,
  validateUpdateTenant,
  canDeleteTenant,
  canDowngradeTier,
} from './validation/tenant-validators';

export default {
  validateCode,
  validateEmail,
  validateName,
  validateTier,
  validateStatus,
  validateStatusTransition,
  validateDataRegion,
  validateComplianceLevel,
  validateBillingType,
  validateTimezone,
  validateMaxUsers,
  validateMaxStorage,
  validateCreateTenant,
  validateUpdateTenant,
  canDeleteTenant,
  canDowngradeTier,
};
