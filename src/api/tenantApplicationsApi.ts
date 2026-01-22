/**
 * Tenant Applications API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Manages applications assigned to tenants
 */

import { getSupabaseClient } from '../lib/supabase';
import { supabase } from '@/utils/supabase/client';

// ==================== TYPES ====================

export type LicenseType = 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export interface TenantApplication {
  // I. ĐỊNH DANH
  _id: string;
  id?: string; // Legacy support
  tenant_id: string;
  app_code: string;
  
  // II. TRẠNG THÁI
  is_active: boolean;
  activated_at: string | null;
  deactivated_at: string | null;
  
  // III. LICENSE
  license_type: LicenseType;
  max_users: number;
  expires_at: string | null;
  
  // IV. SETTINGS
  settings: Record<string, any>;
  
  // V. METADATA
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number;
  
  // VI. POPULATED FIELDS (from JOIN)
  app_name?: string;
  app_description?: string;
  app_icon?: string;
}

export interface CreateTenantApplicationRequest {
  tenant_id: string;
  app_code: string;
  is_active?: boolean;
  license_type?: LicenseType;
  max_users?: number;
  expires_at?: string;
  settings?: Record<string, any>;
}

export interface UpdateTenantApplicationRequest {
  is_active?: boolean;
  license_type?: LicenseType;
  max_users?: number;
  expires_at?: string;
  settings?: Record<string, any>;
  version?: number; // Optional for optimistic locking
}

export interface TenantApplicationFilters extends BaseFilters {
  tenant_id?: string;
  app_code?: string;
  is_active?: boolean;
  license_type?: LicenseType;
  include_deleted?: boolean;
}

// ==================== STATISTICS ====================

export interface TenantApplicationStatistics {
  total_apps: number;
  active_apps: number;
  inactive_apps: number;
  by_license_type: Record<LicenseType, number>;
  expiring_soon: number; // Apps expiring in next 30 days
  expired: number;
  total_max_users: number;
}

// ==================== API CLIENT ====================

export const tenantApplicationsApi = {
  /**
   * GET /tenant-applications
   * Fetch tenant applications with filters
   */
  getAll: async (filters?: TenantApplicationFilters): Promise<TenantApplication[]> => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('tenant_applications')
      .select(`
        *,
        application:applications(name, description, icon_url)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.app_code) {
      query = query.eq('app_code', filters.app_code);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.license_type) {
      query = query.eq('license_type', filters.license_type);
    }

    // Soft delete filter
    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tenant applications: ${error.message}`);
    }

    // Map _id and populate application details
    return (data || []).map((item: any) => ({
      ...item,
      id: item._id,
      app_name: item.application?.name,
      app_description: item.application?.description,
      app_icon: item.application?.icon_url
    }));
  },

  /**
   * GET /tenant-applications/:id
   */
  getById: async (id: string): Promise<TenantApplication> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tenant_applications')
      .select(`
        *,
        application:applications(name, description, icon_url)
      `)
      .eq('_id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch tenant application: ${error.message}`);
    }

    return {
      ...data,
      id: data._id,
      app_name: data.application?.name,
      app_description: data.application?.description,
      app_icon: data.application?.icon_url
    };
  },

  /**
   * POST /tenant-applications
   * Create new tenant application
   */
  create: async (data: CreateTenantApplicationRequest): Promise<TenantApplication> => {
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
      // created_by: // TODO: Get from context or passed in
    };

    const { data: created, error } = await supabase
      .from('tenant_applications')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant application: ${error.message}`);
    }

    return { ...created, id: created._id };
  },

  /**
   * PUT /tenant-applications/:id
   * Update tenant application with optimistic locking
   */
  update: async (id: string, data: UpdateTenantApplicationRequest): Promise<TenantApplication> => {
    const supabase = getSupabaseClient();

    // 1. Get current version if not provided
    let currentVersion = data.version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('tenant_applications')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
        throw new Error('Tenant application not found');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    // Remove version from data to avoid sending it as update field (except we use it for check)
    const { version, ...updateFields } = data;

    const { data: updated, error } = await supabase
      .from('tenant_applications')
      .update({
        ...updateFields,
        updated_at: now,
        version: nextVersion,
      })
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant application: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }

    return { ...updated, id: updated._id };
  },

  /**
   * DELETE /tenant-applications/:id
   * Soft delete tenant application
   */
  delete: async (id: string, deletedBy?: string, version?: number): Promise<void> => {
    const supabase = getSupabaseClient();

    // 1. Get current version if not provided
    let currentVersion = version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('tenant_applications')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
         return; // Already deleted or not found
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;

    const { error } = await supabase
      .from('tenant_applications')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy || null,
        updated_at: new Date().toISOString(),
        version: nextVersion,
      })
      .eq('_id', id)
      .eq('version', currentVersion);

    if (error) {
      throw new Error(`Failed to delete tenant application: ${error.message}`);
    }
  },

  /**
   * Soft delete tenant application (alias for delete)
   */
  softDelete: async (id: string, deletedBy?: string): Promise<void> => {
    return tenantApplicationsApi.delete(id, deletedBy);
  },

  /**
   * Permanently delete tenant application (hard delete)
   */
  hardDelete: async (id: string): Promise<void> => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('tenant_applications').delete().eq('_id', id);
    if (error) throw new Error(`Failed to hard delete tenant application: ${error.message}`);
  },

  /**
   * Restore soft-deleted tenant application
   */
  restore: async (id: string): Promise<TenantApplication> => {
    const supabase = getSupabaseClient();
    
    // Get current version (even if deleted)
    const { data: current, error: fetchError } = await supabase
      .from('tenant_applications')
      .select('version')
      .eq('_id', id)
      .single();

    if (fetchError || !current) throw new Error('Tenant application not found');

    const nextVersion = current.version + 1;

    const { data: restored, error } = await supabase
      .from('tenant_applications')
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
        version: nextVersion
      })
      .eq('_id', id)
      .eq('version', current.version)
      .select()
      .single();
      
    if (error) throw new Error(`Failed to restore tenant application: ${error.message}`);
    return { ...restored, id: restored._id };
  },

  /**
   * Get only deleted tenant applications
   */
  getDeleted: async (): Promise<TenantApplication[]> => {
    return tenantApplicationsApi.getAll({ include_deleted: true }).then(apps => apps.filter(app => app.deleted_at !== null));
  },

  /**
   * POST /tenant-applications/:id/activate
   * Activate application
   */
  activate: async (id: string, version?: number): Promise<TenantApplication> => {
    return tenantApplicationsApi.update(id, {
      is_active: true,
      version,
      // We can also set activated_at/deactivated_at manually if needed, 
      // but strictly speaking update() handles generic fields.
      // Let's add specific logic here if we want to set timestamps:
    } as UpdateTenantApplicationRequest);
    
    // Actually, let's allow passing timestamps via update request or handle them here.
    // For consistency with original code:
    /*
    const { data, error } = await supabase
      .from('tenant_applications')
      .update({
        is_active: true,
        activated_at: new Date().toISOString(),
        deactivated_at: null,
        updated_at: new Date().toISOString(),
      }) ...
    */
   
    // Let's reimplement properly with optimistic locking
    const supabase = getSupabaseClient();
    
    let currentVersion = version;
    if (currentVersion === undefined) {
       const { data: current } = await supabase.from('tenant_applications').select('version').eq('_id', id).single();
       if (current) currentVersion = current.version;
    }

    if (currentVersion === undefined) throw new Error('Application not found');

    const { data, error } = await supabase
      .from('tenant_applications')
      .update({
        is_active: true,
        activated_at: new Date().toISOString(),
        deactivated_at: null,
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
      })
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) throw new Error(`Failed to activate: ${error.message}`);
    if (!data) throw new Error('Concurrent modification detected');

    return { ...data, id: data._id };
  },

  /**
   * POST /tenant-applications/:id/deactivate
   * Deactivate application
   */
  deactivate: async (id: string, version?: number): Promise<TenantApplication> => {
    const supabase = getSupabaseClient();
    
    let currentVersion = version;
    if (currentVersion === undefined) {
       const { data: current } = await supabase.from('tenant_applications').select('version').eq('_id', id).single();
       if (current) currentVersion = current.version;
    }

    if (currentVersion === undefined) throw new Error('Application not found');

    const { data, error } = await supabase
      .from('tenant_applications')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
      })
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) throw new Error(`Failed to deactivate: ${error.message}`);
    if (!data) throw new Error('Concurrent modification detected');

    return { ...data, id: data._id };
  },

  /**
   * GET /tenant-applications/statistics
   * Get tenant applications statistics
   */
  getStatistics: async (tenantId: string): Promise<TenantApplicationStatistics> => {
    const apps = await tenantApplicationsApi.getAll({ tenant_id: tenantId });
    return calculateStatistics(apps);
  },

  /**
   * Client-side validation
   */
  validate: (data: CreateTenantApplicationRequest | UpdateTenantApplicationRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate max_users
    if ('max_users' in data && data.max_users !== undefined) {
      if (data.max_users <= 0) {
        errors.push('Max users phải lớn hơn 0');
      }
    }

    // Validate license_type
    if ('license_type' in data && data.license_type !== undefined) {
      const validTypes: LicenseType[] = ['TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
      if (!validTypes.includes(data.license_type)) {
        errors.push('License type không hợp lệ');
      }
    }

    // Validate expires_at
    if ('expires_at' in data && data.expires_at !== undefined && data.expires_at !== null) {
      const expiresAt = new Date(data.expires_at);
      if (isNaN(expiresAt.getTime())) {
        errors.push('Ngày hết hạn không hợp lệ');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate statistics from applications array
 */
export function calculateStatistics(apps: TenantApplication[]): TenantApplicationStatistics {
  const byLicenseType: Record<LicenseType, number> = {
    TRIAL: 0,
    BASIC: 0,
    PREMIUM: 0,
    ENTERPRISE: 0,
  };

  let activeApps = 0;
  let inactiveApps = 0;
  let expiringSoon = 0;
  let expired = 0;
  let totalMaxUsers = 0;

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  apps.forEach((app) => {
    // Active/Inactive
    if (app.is_active) {
      activeApps++;
    } else {
      inactiveApps++;
    }

    // By license type
    if (byLicenseType[app.license_type] !== undefined) {
      byLicenseType[app.license_type]++;
    }

    // Expiring/Expired
    if (app.expires_at) {
      const expiresAt = new Date(app.expires_at);
      if (expiresAt < now) {
        expired++;
      } else if (expiresAt < thirtyDaysFromNow) {
        expiringSoon++;
      }
    }

    // Total max users
    totalMaxUsers += app.max_users;
  });

  return {
    total_apps: apps.length,
    active_apps: activeApps,
    inactive_apps: inactiveApps,
    by_license_type: byLicenseType,
    expiring_soon: expiringSoon,
    expired,
    total_max_users: totalMaxUsers,
  };
}

/**
 * Get license type label
 */
export function getLicenseTypeLabel(type: LicenseType): string {
  const labels: Record<LicenseType, string> = {
    TRIAL: 'Dùng thử',
    BASIC: 'Cơ bản',
    PREMIUM: 'Cao cấp',
    ENTERPRISE: 'Doanh nghiệp',
  };
  return labels[type] || type;
}

/**
 * Get license type color
 */
export function getLicenseTypeColor(type: LicenseType): string {
  const colors: Record<LicenseType, string> = {
    TRIAL: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PREMIUM: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    ENTERPRISE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

/**
 * Get status badge color
 */
export function getStatusBadgeColor(isActive: boolean): string {
  return isActive
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
}

/**
 * Check if application is expired
 */
export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Check if application is expiring soon (within 30 days)
 */
export function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiresDate = new Date(expiresAt);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiresDate > now && expiresDate < thirtyDaysFromNow;
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const expiresDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiresDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format expiry text
 */
export function formatExpiryText(expiresAt: string | null): string {
  if (!expiresAt) return 'Không giới hạn';
  
  const days = getDaysUntilExpiry(expiresAt);
  if (days === null) return 'Không giới hạn';
  
  if (days < 0) {
    return `Đã hết hạn ${Math.abs(days)} ngày`;
  } else if (days === 0) {
    return 'Hết hạn hôm nay';
  } else if (days === 1) {
    return 'Hết hạn ngày mai';
  } else if (days <= 7) {
    return `Còn ${days} ngày`;
  } else {
    return `Còn ${days} ngày`;
  }
}

export default tenantApplicationsApi;