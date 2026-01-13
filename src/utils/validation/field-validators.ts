/**
 * Field Validators
 * Basic validation functions for individual fields
 */

export interface FieldValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate code format
 * Must match: ^[a-z0-9-]+$
 */
export const validateCode = (code: string): FieldValidationResult => {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Code is required' };
  }

  if (code.length > 64) {
    return { valid: false, error: 'Code must not exceed 64 characters' };
  }

  if (!/^[a-z0-9-]+$/.test(code)) {
    return { 
      valid: false, 
      error: 'Code must contain only lowercase letters, numbers, and hyphens' 
    };
  }

  if (code.startsWith('-') || code.endsWith('-')) {
    return { valid: false, error: 'Code cannot start or end with hyphen' };
  }

  if (code.includes('--')) {
    return { valid: false, error: 'Code cannot contain consecutive hyphens' };
  }

  return { valid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
};

/**
 * Validate name
 */
export const validateName = (name: string): FieldValidationResult => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length > 255) {
    return { valid: false, error: 'Name must not exceed 255 characters' };
  }

  return { valid: true };
};

/**
 * Validate timezone (basic check)
 */
export const validateTimezone = (timezone: string): FieldValidationResult => {
  if (!timezone || timezone.trim().length === 0) {
    return { valid: false, error: 'Timezone is required' };
  }

  if (timezone.length > 50) {
    return { valid: false, error: 'Timezone must not exceed 50 characters' };
  }

  return { valid: true };
};

/**
 * Validate phone number (basic international format)
 */
export const validatePhone = (phone: string): FieldValidationResult => {
  if (!phone) return { valid: true }; // Optional field

  // Basic international phone format: +[country code]-[number]
  const phoneRegex = /^\+?[0-9\s\-()]+$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return { valid: true };
};

/**
 * Validate URL/domain
 */
export const validateDomain = (domain: string): FieldValidationResult => {
  if (!domain) return { valid: true }; // Optional field

  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format' };
  }

  return { valid: true };
};

/**
 * Validate max users
 */
export const validateMaxUsers = (maxUsers: number): FieldValidationResult => {
  if (!Number.isInteger(maxUsers) || maxUsers < 1) {
    return { valid: false, error: 'Max users must be a positive integer' };
  }

  if (maxUsers > 1000000) {
    return { valid: false, error: 'Max users cannot exceed 1,000,000' };
  }

  return { valid: true };
};

/**
 * Validate max storage (in GB)
 */
export const validateMaxStorage = (maxStorage: number): FieldValidationResult => {
  if (maxStorage < 0) {
    return { valid: false, error: 'Max storage must be non-negative' };
  }

  if (maxStorage > 1000000) {
    return { valid: false, error: 'Max storage cannot exceed 1,000,000 GB' };
  }

  return { valid: true };
};

/**
 * Validate version for optimistic locking
 */
export const validateVersion = (version: number): FieldValidationResult => {
  if (!Number.isInteger(version) || version < 1) {
    return { valid: false, error: 'Version must be a positive integer' };
  }

  return { valid: true };
};
