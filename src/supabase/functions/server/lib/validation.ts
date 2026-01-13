/**
 * Server-side Validation
 * Lightweight validation for API requests
 */

import { AppError, ErrorCodes } from './error-handler.ts';

/**
 * Validate tenant code format
 */
export const validateTenantCode = (code: string): void => {
  if (!code || code.trim().length === 0) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Code is required');
  }
  
  if (code.length > 64) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Code must not exceed 64 characters');
  }
  
  if (!/^[a-z0-9-]+$/.test(code)) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Code must contain only lowercase letters, numbers, and hyphens'
    );
  }
  
  if (code.startsWith('-') || code.endsWith('-')) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Code cannot start or end with hyphen');
  }
  
  if (code.includes('--')) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Code cannot contain consecutive hyphens');
  }
};

/**
 * Validate tenant name
 */
export const validateTenantName = (name: string): void => {
  if (!name || name.trim().length === 0) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Name is required');
  }
  
  if (name.length > 255) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Name must not exceed 255 characters');
  }
};

/**
 * Validate optimistic locking version
 */
export const validateVersion = (providedVersion: number, currentVersion: number): void => {
  if (providedVersion !== currentVersion) {
    throw new AppError(
      409,
      ErrorCodes.VERSION_CONFLICT,
      'Version mismatch. Resource was modified by another user.',
      {
        provided: providedVersion,
        current: currentVersion,
      }
    );
  }
};

/**
 * Validate UUID format
 */
export const validateUUID = (id: string, fieldName = 'id'): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, `Invalid ${fieldName} format`);
  }
};

/**
 * Validate required fields
 */
export const validateRequired = <T>(
  obj: T,
  fields: (keyof T)[]
): void => {
  const missingFields = fields.filter(field => !obj[field]);
  
  if (missingFields.length > 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
};
