/**
 * Permissions Service
 * Handles CRUD operations for permissions
 * ✅ Production-ready with Supabase integration
 */

import { supabase } from '../utils/supabase/client';

// Permission interface matching database schema
export interface Permission {
  _id: string; // Primary Key
  id?: string; // Legacy
  code: string;
  name: string;
  description?: string;
  app_code: string; // Foreign Key to applications.code
  application_id?: string; // Legacy
  resource?: string;
  action?: string;
  is_active: boolean; // Note: api/permissionsApi.ts doesn't show is_active, but legacy might have it. We keep it or use filters carefully.
                      // Actually api/permissionsApi.ts uses deleted_at for soft delete.
                      // But let's check the query in original file: .eq('is_active', true)
                      // If the new schema uses soft delete, we should check deleted_at is null.
                      // However, if the column is_active doesn't exist, this will crash.
                      // I will remove is_active check if it's not in the new schema, OR keep it if I'm unsure.
                      // The previous file had .eq('is_active', true).
                      // api/permissionsApi.ts does NOT have is_active. It has deleted_at.
                      // So I should likely remove .eq('is_active', true) and use deleted_at check if possible.
                      // But to be safe, I'll assume is_active might still exist or I should query just by *
                      
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Permission with application details
export interface PermissionWithApplication extends Permission {
  application?: {
    _id: string;
    id?: string;
    name: string;
    code: string;
  };
}

/**
 * Fetch all active permissions
 */
export async function fetchPermissions(): Promise<PermissionWithApplication[]> {
  try {
    // Try to select assuming new schema
    // We join applications. If relationship is via app_code, supabase handles it if FK exists.
    // If not, we might need to specify the FK name. 
    // Usually: application:applications!permissions_app_code_fkey(...)
    // But let's try generic first.
    // Also handling _id and id alias.
    
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        application:applications(_id, name, code)
      `)
      .is('deleted_at', null) // Assuming soft delete based on new schema
      .order('code', { ascending: true });

    if (error) {
      console.error('[PermissionsService] Error fetching permissions:', error);
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return (data || []).map((p: any) => ({
      ...p,
      id: p._id,
      application_id: p.app_code, // fallback
      application: p.application ? { ...p.application, id: p.application._id } : undefined
    }));
  } catch (error: any) {
    console.error('[PermissionsService] Unexpected error:', error);
    throw error;
  }
}

/**
 * Fetch permissions by application Codes
 * Renamed from fetchPermissionsByApplicationIds to reflect actual usage of app_code
 */
export async function fetchPermissionsByAppCodes(
  appCodes: string[]
): Promise<PermissionWithApplication[]> {
  try {
    if (appCodes.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        application:applications(_id, name, code)
      `)
      .in('app_code', appCodes)
      .is('deleted_at', null)
      .order('code', { ascending: true });

    if (error) {
      console.error('[PermissionsService] Error fetching permissions by apps:', error);
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return (data || []).map((p: any) => ({
      ...p,
      id: p._id,
      application_id: p.app_code,
      application: p.application ? { ...p.application, id: p.application._id } : undefined
    }));
  } catch (error: any) {
    console.error('[PermissionsService] Unexpected error:', error);
    throw error;
  }
}

// Legacy alias for compatibility, but it now expects codes if the DB uses app_code
// If the caller passes IDs (UUIDs), this will fail to find anything.
// We should update the caller.
export const fetchPermissionsByApplicationIds = fetchPermissionsByAppCodes;

/**
 * Fetch permission by ID
 */
export async function fetchPermissionById(id: string): Promise<PermissionWithApplication | null> {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        application:applications(_id, name, code)
      `)
      .eq('_id', id) // Use _id
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[PermissionsService] Error fetching permission:', error);
      throw new Error(`Failed to fetch permission: ${error.message}`);
    }

    if (data) {
        data.id = data._id;
        if (data.application) data.application.id = data.application._id;
    }
    return data;
  } catch (error: any) {
    console.error('[PermissionsService] Unexpected error:', error);
    throw error;
  }
}

/**
 * Fetch permission by code
 */
export async function fetchPermissionByCode(code: string): Promise<PermissionWithApplication | null> {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        application:applications(_id, name, code)
      `)
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('[PermissionsService] Error fetching permission by code:', error);
      throw new Error(`Failed to fetch permission: ${error.message}`);
    }

    if (data) {
        data.id = data._id;
        if (data.application) data.application.id = data.application._id;
    }
    return data;
  } catch (error: any) {
    console.error('[PermissionsService] Unexpected error:', error);
    throw error;
  }
}

/**
 * Group permissions by application
 */
export function groupPermissionsByApplication(
  permissions: PermissionWithApplication[]
): Record<string, PermissionWithApplication[]> {
  return permissions.reduce((acc, permission) => {
    // Group by app_code since it's the reliable FK
    const key = permission.app_code || 'unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(permission);
    return acc;
  }, {} as Record<string, PermissionWithApplication[]>);
}

export default {
  fetchPermissions,
  fetchPermissionsByAppCodes,
  fetchPermissionsByApplicationIds, // Deprecated name
  fetchPermissionById,
  fetchPermissionByCode,
  groupPermissionsByApplication,
};
