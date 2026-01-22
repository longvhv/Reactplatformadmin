/**
 * User Constants
 * Centralized constants for user management
 */

import type { UserRole, UserStatus } from '../data/users';

// Role values
export const USER_ROLES: readonly UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'USER',
  'MODERATOR',
  'VIEWER'
] as const;

// Status values
export const USER_STATUSES: readonly UserStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING'
] as const;

// Default values
export const DEFAULTS = {
  ROLE: 'USER' as UserRole,
  STATUS: 'ACTIVE' as UserStatus,
  EMAIL_VERIFIED: false,
  VERSION: 1,
} as const;

// Validation patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[0-9\s-()]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;

// Length constraints
export const LENGTH = {
  EMAIL_MIN: 5,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  NAME_MIN: 2,
  NAME_MAX: 255,
  PHONE_MAX: 20,
  LOCATION_MAX: 255,
  DEPARTMENT_MAX: 100,
  POSITION_MAX: 100,
} as const;

// Role permissions (for frontend display)
export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  USER: 'User',
  MODERATOR: 'Moderator',
  VIEWER: 'Viewer',
} as const;

export const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: 'Full system access including platform management',
  ADMIN: 'Full tenant access and user management',
  USER: 'Standard user with basic permissions',
  MODERATOR: 'Content moderation and user support',
  VIEWER: 'Read-only access to resources',
} as const;

// Status labels
export const STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  PENDING: 'Pending Activation',
} as const;

export const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email format',
  EMAIL_EXISTS: 'Email already exists',
  
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${LENGTH.PASSWORD_MIN} characters`,
  PASSWORD_TOO_LONG: `Password must not exceed ${LENGTH.PASSWORD_MAX} characters`,
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number, and special character',
  
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_SHORT: `Name must be at least ${LENGTH.NAME_MIN} characters`,
  NAME_TOO_LONG: `Name must not exceed ${LENGTH.NAME_MAX} characters`,
  
  PHONE_INVALID: 'Invalid phone number format',
  
  ROLE_INVALID: `Role must be one of: ${USER_ROLES.join(', ')}`,
  STATUS_INVALID: `Status must be one of: ${USER_STATUSES.join(', ')}`,
  
  VERSION_CONFLICT: 'Version conflict: record was modified by another user',
  NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized',
  CANNOT_DELETE_SELF: 'Cannot delete your own account',
} as const;