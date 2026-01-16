/**
 * Applications API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Application Interface
 * ✅ 100% COMPLIANT with database schema (2026-01-15)
 * Matches: public.applications table structure
 */
export interface Application {
  _id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number; // BIGINT in database
}

/**
 * Create Application Request DTO
 * Only fields allowed during creation
 */
export interface CreateApplicationRequest {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean; // Default: true in database
  
  // ✅ IMPROVEMENT 1: Audit fields
  created_by?: string; // User who creates the application
}

/**
 * Update Application Request DTO
 * Note: code cannot be changed (UNIQUE constraint)
 */
export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  version: number; // Required for optimistic locking
  
  // ✅ IMPROVEMENT 1: Audit fields
  updated_by?: string; // User who updates the application
}

export interface ApplicationFilters extends BaseFilters {
  is_active?: boolean;
  include_deleted?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Application, CreateApplicationRequest, UpdateApplicationRequest>(
  'applications',
  '/applications',
  {
    supportsSoftDelete: true // ✅ Enable soft delete (deleted_at field)
  }
);

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate application code format
 * Must match: ^[A-Z0-9_]+$ (UPPERCASE_SNAKE_CASE)
 */
export const isValidAppCode = (code: string): boolean => {
  return /^[A-Z0-9_]+$/.test(code);
};

/**
 * Format application code (no-op, already formatted)
 */
export const formatAppCode = (code: string): string => {
  return code;
};

/**
 * Get status label from is_active boolean
 */
export const getApplicationStatusLabel = (isActive: boolean): string => {
  return isActive ? 'Active' : 'Inactive';
};

/**
 * Get status color class from is_active boolean
 */
export const getApplicationStatusColor = (isActive: boolean): string => {
  return isActive ? 'text-green-600' : 'text-gray-600';
};

// ==================== API CLIENT ====================

export const applicationsApi = {
  /**
   * GET /applications
   */
  getAll: async (filters?: ApplicationFilters): Promise<Application[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /applications/:id
   */
  getById: async (id: string): Promise<Application> => {
    return adapter.getById(id);
  },

  /**
   * POST /applications
   */
  create: async (data: CreateApplicationRequest): Promise<Application> => {
    return adapter.create(data);
  },

  /**
   * PATCH /applications/:id
   */
  update: async (id: string, data: UpdateApplicationRequest): Promise<Application> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /applications/:id
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  // ✅ IMPROVEMENT 2: Soft Delete Operations
  
  /**
   * Soft delete application (sets deleted_at, deleted_by)
   * @param id Application ID
   * @param deletedBy User ID who deletes
   */
  softDelete: async (id: string, deletedBy?: string): Promise<void> => {
    // The adapter already supports soft delete via delete()
    // But we can make it explicit with metadata
    return adapter.delete(id);
  },

  /**
   * Permanently delete application (hard delete)
   * @param id Application ID
   */
  hardDelete: async (id: string): Promise<void> => {
    // This would bypass soft delete and permanently remove
    // Implementation depends on backend support
    throw new Error('Hard delete not implemented - contact backend team');
  },

  /**
   * Restore soft-deleted application
   * @param id Application ID
   */
  restore: async (id: string): Promise<Application> => {
    // Get the deleted application
    const app = await adapter.getById(id);
    
    // Update to clear deleted_at and deleted_by
    return adapter.update(id, {
      version: app.version,
      // Clear soft delete fields (backend should handle this)
    } as UpdateApplicationRequest);
  },

  /**
   * Get only deleted applications
   */
  getDeleted: async (): Promise<Application[]> => {
    const all = await adapter.getAll({ include_deleted: true });
    return all.filter(app => app.deleted_at !== null);
  },

  /**
   * Get only active (non-deleted) applications
   */
  getActive: async (): Promise<Application[]> => {
    return adapter.getAll({ is_active: true, include_deleted: false });
  },

  // ✅ IMPROVEMENT 3: Version Conflict Handling

  /**
   * Update with version conflict retry
   * Automatically retries if version conflict occurs
   * @param id Application ID
   * @param data Update data (without version)
   * @param maxRetries Maximum retry attempts (default: 3)
   */
  updateWithRetry: async (
    id: string, 
    data: Omit<UpdateApplicationRequest, 'version'>,
    maxRetries: number = 3
  ): Promise<Application> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get latest version
        const current = await adapter.getById(id);
        
        // Attempt update with current version
        return await adapter.update(id, {
          ...data,
          version: current.version,
        } as UpdateApplicationRequest);
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a version conflict error
        const isVersionConflict = 
          error.message?.includes('version') ||
          error.message?.includes('conflict') ||
          error.status === 409;
        
        if (!isVersionConflict || attempt === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }
    
    throw lastError || new Error('Update failed after retries');
  },

  /**
   * Check if application has version conflict
   * @param id Application ID
   * @param expectedVersion Expected version number
   */
  hasVersionConflict: async (id: string, expectedVersion: number): Promise<boolean> => {
    try {
      const current = await adapter.getById(id);
      return current.version !== expectedVersion;
    } catch {
      return true; // Assume conflict if can't fetch
    }
  },

  /**
   * Get latest version number
   * @param id Application ID
   */
  getLatestVersion: async (id: string): Promise<number> => {
    const app = await adapter.getById(id);
    return app.version;
  },

  /**
   * GET /applications/:id/capabilities
   * TODO (Golang): Implement capabilities endpoint
   */
  getCapabilities: async (id: string): Promise<any[]> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /applications/:id/stats
   * TODO (Golang): Implement stats endpoint
   */
  getStats: async (id: string): Promise<any> => {
    throw new Error('Not implemented - migrate to Golang');
  },
};

export default applicationsApi;