/**
 * Error Handler Utilities
 * Standardized error responses and logging
 */

import type { Context } from 'npm:hono';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Client errors (400-499)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  
  // Server errors (500-599)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Create error response
 */
export const createErrorResponse = (
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): { error: ApiError } => {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
};

/**
 * Handle Supabase errors
 */
export const handleSupabaseError = (error: any): AppError => {
  // Not found
  if (error.code === 'PGRST116') {
    return new AppError(404, ErrorCodes.NOT_FOUND, 'Resource not found');
  }
  
  // Unique constraint violation
  if (error.code === '23505') {
    return new AppError(409, ErrorCodes.CONFLICT, 'Resource already exists', {
      constraint: error.details,
    });
  }
  
  // Foreign key violation
  if (error.code === '23503') {
    return new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid reference', {
      constraint: error.details,
    });
  }
  
  // Check constraint violation
  if (error.code === '23514') {
    return new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Data validation failed', {
      constraint: error.details,
    });
  }
  
  // Default database error
  return new AppError(500, ErrorCodes.DATABASE_ERROR, error.message || 'Database error');
};

/**
 * Error response middleware
 */
export const errorHandler = (error: Error, c: Context) => {
  console.error('[ERROR]', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  if (error instanceof AppError) {
    return c.json(
      createErrorResponse(error.statusCode, error.code, error.message, error.details),
      error.statusCode
    );
  }
  
  // Unknown error
  return c.json(
    createErrorResponse(500, ErrorCodes.INTERNAL_ERROR, 'Internal server error'),
    500
  );
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: (c: Context) => Promise<Response>) => {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (error) {
      return errorHandler(error as Error, c);
    }
  };
};
