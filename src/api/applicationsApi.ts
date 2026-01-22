/**
 * Applications API Client
 * Uses Adapter pattern - Ready for Golang migration
 */

import { createAdapter, BaseFilters } from './adapters';
import { getSupabaseClient } from '../lib/supabase';

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

// Removed adapter in favor of direct Supabase calls for strict schema compliance and versioning

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
    const supabase = getSupabaseClient();
    let query = supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter out deleted by default
    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    
    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch applications: ${error.message}`);
    
    return data as Application[];
  },

  /**
   * GET /applications/:id
   */
  getById: async (id: string): Promise<Application> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) throw new Error(`Failed to fetch application: ${error.message}`);
    return data as Application;
  },

  /**
   * POST /applications
   */
  create: async (data: CreateApplicationRequest): Promise<Application> => {
    const supabase = getSupabaseClient();
    const _id = crypto.randomUUID();
    const now = new Date().toISOString();

    const requestData = {
      _id,
      ...data,
      is_active: data.is_active ?? true,
      created_at: now,
      updated_at: now,
      version: 1,
      created_by: data.created_by || null,
      updated_by: data.created_by || null, // Initial creator is also updater
    };

    const { data: created, error } = await supabase
      .from('applications')
      .insert([requestData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create application: ${error.message}`);
    return created as Application;
  },

  /**
   * PATCH /applications/:id
   */
  update: async (id: string, data: UpdateApplicationRequest): Promise<Application> => {
    const supabase = getSupabaseClient();

    // Determine version for optimistic locking
    let currentVersion = data.version;

    if (currentVersion === undefined) {
      // If version not provided, fetch current (fallback)
      const { data: current, error: fetchError } = await supabase
        .from('applications')
        .select('version')
        .eq('_id', id)
        .single();

      if (fetchError || !current) {
        throw new Error('Application not found or access denied');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    // Remove version from data to avoid sending it as a field to update
    const { version, ...restData } = data;

    const updateData = {
      ...restData,
      updated_at: now,
      version: nextVersion,
    };

    const { data: updated, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion) // Optimistic locking
      .select()
      .single();

    if (error) throw new Error(`Failed to update application: ${error.message}`);
    if (!updated) throw new Error('Concurrent modification detected. Please refresh and try again.');

    return updated as Application;
  },

  /**
   * DELETE /applications/:id
   * Soft delete
   */
  delete: async (id: string, deletedBy?: string, version?: number): Promise<void> => {
    const supabase = getSupabaseClient();

    let currentVersion = version;

    if (currentVersion === undefined) {
      // Get current version if not provided
      const { data: current, error: fetchError } = await supabase
        .from('applications')
        .select('version')
        .eq('_id', id)
        .single();

      if (fetchError || !current) {
         // Already deleted or not found
         return; 
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;

    const { error } = await supabase
      .from('applications')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
        is_active: false, // Deactivate on delete
        updated_at: new Date().toISOString(),
        version: nextVersion,
      })
      .eq('_id', id)
      .eq('version', currentVersion);

    if (error) throw new Error(`Failed to delete application: ${error.message}`);
  },

  // ✅ IMPROVEMENT 2: Soft Delete Operations
  
  /**
   * Soft delete application (sets deleted_at, deleted_by)
   * @param id Application ID
   * @param deletedBy User ID who deletes
   */
  softDelete: async (id: string, deletedBy?: string): Promise<void> => {
    return applicationsApi.delete(id, deletedBy);
  },

  /**
   * Permanently delete application (hard delete)
   * @param id Application ID
   */
  hardDelete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('applications').delete().eq('_id', id);
    if (error) throw new Error(`Failed to hard delete application: ${error.message}`);
  },

  /**
   * Restore soft-deleted application
   * @param id Application ID
   */
  restore: async (id: string): Promise<Application> => {
    const supabase = getSupabaseClient();
    
    // Get current version (even if deleted)
    const { data: current, error: fetchError } = await supabase
      .from('applications')
      .select('version')
      .eq('_id', id)
      .single();

    if (fetchError || !current) throw new Error('Application not found');

    const nextVersion = current.version + 1;

    const { data: restored, error } = await supabase
      .from('applications')
      .update({
        deleted_at: null,
        deleted_by: null,
        is_active: true, // Reactivate on restore
        updated_at: new Date().toISOString(),
        version: nextVersion
      })
      .eq('_id', id)
      .eq('version', current.version)
      .select()
      .single();
      
    if (error) throw new Error(`Failed to restore application: ${error.message}`);
    return restored as Application;
  },

  /**
   * Get only deleted applications
   */
  getDeleted: async (): Promise<Application[]> => {
    return applicationsApi.getAll({ include_deleted: true }).then(apps => apps.filter(app => app.deleted_at !== null));
  },

  /**
   * Get only active (non-deleted) applications
   */
  getActive: async (): Promise<Application[]> => {
    return applicationsApi.getAll({ is_active: true, include_deleted: false });
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
        const current = await applicationsApi.getById(id);
        
        // Attempt update with current version
        return await applicationsApi.update(id, {
          ...data,
          version: current.version,
        } as UpdateApplicationRequest);
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a version conflict error
        const isVersionConflict = 
          error.message?.includes('version') ||
          error.message?.includes('conflict') ||
          error.message?.includes('Concurrent modification');
        
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
      const current = await applicationsApi.getById(id);
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
    const app = await applicationsApi.getById(id);
    return app.version;
  },

  /**
   * GET /applications/:id/capabilities
   * TODO (Golang): Implement capabilities endpoint
   */
  getCapabilities: async (id: string): Promise<any[]> => {
    console.warn('getCapabilities: Not implemented - migrate to Golang');
    return [];
  },

  /**
   * GET /applications/:id/stats
   * TODO (Golang): Implement stats endpoint
   */
  getStats: async (id: string): Promise<any> => {
    console.warn('getStats: Not implemented - migrate to Golang');
    return {};
  },
};

export default applicationsApi;