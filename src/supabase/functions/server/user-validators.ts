/**
 * User Validation Utilities
 * Server-side validation for user operations
 */

import type { CreateUserInput, UpdateUserInput } from '../../../data/users.ts';

// Constants (duplicated for server-side)
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[0-9\s-()]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;

const LENGTH = {
  EMAIL_MIN: 5,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  NAME_MIN: 2,
  NAME_MAX: 255,
  PHONE_MAX: 20,
} as const;

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER', 'MODERATOR', 'VIEWER'];
const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email || email.trim() === '') {
    return { field: 'email', message: 'Email is required' };
  }
  
  if (email.length < LENGTH.EMAIL_MIN) {
    return { field: 'email', message: `Email must be at least ${LENGTH.EMAIL_MIN} characters` };
  }
  
  if (email.length > LENGTH.EMAIL_MAX) {
    return { field: 'email', message: `Email must not exceed ${LENGTH.EMAIL_MAX} characters` };
  }
  
  if (!PATTERNS.EMAIL.test(email)) {
    return { field: 'email', message: 'Invalid email format' };
  }
  
  return null;
}

/**
 * Validate password
 */
export function validatePassword(password: string, isUpdate: boolean = false): ValidationError | null {
  // For updates, password is optional
  if (!password || password.trim() === '') {
    if (isUpdate) return null;
    return { field: 'password', message: 'Password is required' };
  }
  
  if (password.length < LENGTH.PASSWORD_MIN) {
    return { field: 'password', message: `Password must be at least ${LENGTH.PASSWORD_MIN} characters` };
  }
  
  if (password.length > LENGTH.PASSWORD_MAX) {
    return { field: 'password', message: `Password must not exceed ${LENGTH.PASSWORD_MAX} characters` };
  }
  
  if (!PATTERNS.PASSWORD.test(password)) {
    return { 
      field: 'password', 
      message: 'Password must contain uppercase, lowercase, number, and special character' 
    };
  }
  
  return null;
}

/**
 * Validate name
 */
export function validateName(name: string): ValidationError | null {
  if (!name || name.trim() === '') {
    return { field: 'name', message: 'Name is required' };
  }
  
  if (name.length < LENGTH.NAME_MIN) {
    return { field: 'name', message: `Name must be at least ${LENGTH.NAME_MIN} characters` };
  }
  
  if (name.length > LENGTH.NAME_MAX) {
    return { field: 'name', message: `Name must not exceed ${LENGTH.NAME_MAX} characters` };
  }
  
  return null;
}

/**
 * Validate phone
 */
export function validatePhone(phone: string): ValidationError | null {
  if (!phone || phone.trim() === '') return null; // Phone is optional
  
  if (phone.length > LENGTH.PHONE_MAX) {
    return { field: 'phone', message: `Phone must not exceed ${LENGTH.PHONE_MAX} characters` };
  }
  
  if (!PATTERNS.PHONE.test(phone)) {
    return { field: 'phone', message: 'Invalid phone number format' };
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
 * Validate create user input
 */
export function validateCreateUser(input: CreateUserInput): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  const emailError = validateEmail(input.email);
  if (emailError) errors.push(emailError);
  
  const passwordError = validatePassword(input.password, false);
  if (passwordError) errors.push(passwordError);
  
  const nameError = validateName(input.name);
  if (nameError) errors.push(nameError);
  
  // Optional fields
  if (input.phone) {
    const phoneError = validatePhone(input.phone);
    if (phoneError) errors.push(phoneError);
  }
  
  // Enum validations
  if (input.role) {
    const roleError = validateEnum('role', input.role, ALLOWED_ROLES, 'Role');
    if (roleError) errors.push(roleError);
  }
  
  if (input.status) {
    const statusError = validateEnum('status', input.status, ALLOWED_STATUSES, 'Status');
    if (statusError) errors.push(statusError);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate update user input
 */
export function validateUpdateUser(input: UpdateUserInput): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate only provided fields
  if (input.email !== undefined) {
    const emailError = validateEmail(input.email);
    if (emailError) errors.push(emailError);
  }
  
  if (input.password !== undefined) {
    const passwordError = validatePassword(input.password, true);
    if (passwordError) errors.push(passwordError);
  }
  
  if (input.name !== undefined) {
    const nameError = validateName(input.name);
    if (nameError) errors.push(nameError);
  }
  
  if (input.phone !== undefined) {
    const phoneError = validatePhone(input.phone);
    if (phoneError) errors.push(phoneError);
  }
  
  if (input.role !== undefined) {
    const roleError = validateEnum('role', input.role, ALLOWED_ROLES, 'Role');
    if (roleError) errors.push(roleError);
  }
  
  if (input.status !== undefined) {
    const statusError = validateEnum('status', input.status, ALLOWED_STATUSES, 'Status');
    if (statusError) errors.push(statusError);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
