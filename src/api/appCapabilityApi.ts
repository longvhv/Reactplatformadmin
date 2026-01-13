/**
 * App Capability API
 * Complete CRUD operations for application features and limits
 */

import { supabase } from '../utils/supabase/client';

const TABLE_NAME = 'app_capabilities';

// ============================================
// Types & Interfaces
// ============================================

export type CapabilityType = 'FEATURE' | 'LIMIT';
export type CapabilityStatus = 'active' | 'inactive' | 'archived';

export interface DefaultValue {
  enabled?: boolean;  // For FEATURE
  value?: number;     // For LIMIT
  unit?: string;      // For LIMIT (users, GB, requests/day, etc.)
}

export interface AppCapability {
  _id?: string;
  tenant_id: string;
  app_id: string;
  code: string;
  name: string;
  description?: string;
  type: CapabilityType;
  default_value: DefaultValue;
  display_order: number;
  is_required: boolean;
  validation_rules: Record<string, any>;
  status: CapabilityStatus;
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  version?: number;
}

export interface CapabilityFilters {
  tenant_id?: string;
  app_id?: string;
  type?: CapabilityType;
  status?: CapabilityStatus;
  search?: string;
}

export interface CapabilityStatistics {
  total: number;
  features: number;
  limits: number;
  active: number;
  inactive: number;
}

// ============================================
// API Functions
// ============================================

export const appCapabilityApi = {
  /**
   * Get all capabilities with optional filters
   */
  getAll: async (filters?: CapabilityFilters): Promise<AppCapability[]> => {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.app_id) {
      query = query.eq('app_id', filters.app_id);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Get capabilities by application ID
   */
  getByAppId: async (app_id: string, tenant_id?: string): Promise<AppCapability[]> => {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('app_id', app_id)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Get features only
   */
  getFeatures: async (app_id: string, tenant_id?: string): Promise<AppCapability[]> => {
    return appCapabilityApi.getAll({ app_id, tenant_id, type: 'FEATURE' });
  },

  /**
   * Get limits only
   */
  getLimits: async (app_id: string, tenant_id?: string): Promise<AppCapability[]> => {
    return appCapabilityApi.getAll({ app_id, tenant_id, type: 'LIMIT' });
  },

  /**
   * Get a single capability by ID
   */
  getById: async (id: string): Promise<AppCapability | null> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('_id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Get a single capability by code
   */
  getByCode: async (code: string, app_id: string, tenant_id: string): Promise<AppCapability | null> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('code', code)
      .eq('app_id', app_id)
      .eq('tenant_id', tenant_id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Create a new capability
   */
  create: async (capability: Omit<AppCapability, '_id' | 'created_at' | 'updated_at' | 'version'>): Promise<AppCapability> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        ...capability,
        version: 1,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update a capability
   */
  update: async (id: string, updates: Partial<AppCapability>, currentVersion: number): Promise<AppCapability> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...updates,
        version: currentVersion + 1,
      })
      .eq('_id', id)
      .eq('version', currentVersion) // Optimistic locking
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Version conflict: Capability was modified by another user. Please refresh and try again.');
      }
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Soft delete a capability
   */
  softDelete: async (id: string, deleted_by?: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by,
      })
      .eq('_id', id)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
  },

  /**
   * Restore a soft-deleted capability
   */
  restore: async (id: string): Promise<AppCapability> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        deleted_at: null,
        deleted_by: null,
      })
      .eq('_id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Hard delete a capability (permanent)
   */
  hardDelete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('_id', id);

    if (error) throw new Error(error.message);
  },

  /**
   * Change capability status
   */
  changeStatus: async (id: string, status: CapabilityStatus, currentVersion: number): Promise<AppCapability> => {
    return appCapabilityApi.update(id, { status }, currentVersion);
  },

  /**
   * Update display order
   */
  updateDisplayOrder: async (id: string, display_order: number, currentVersion: number): Promise<AppCapability> => {
    return appCapabilityApi.update(id, { display_order }, currentVersion);
  },

  /**
   * Bulk update display orders
   */
  bulkUpdateDisplayOrder: async (items: Array<{ id: string; order: number; version: number }>): Promise<void> => {
    const promises = items.map(item =>
      appCapabilityApi.update(item.id, { display_order: item.order }, item.version)
    );

    await Promise.all(promises);
  },

  /**
   * Check if code exists
   */
  codeExists: async (code: string, app_id: string, tenant_id: string, excludeId?: string): Promise<boolean> => {
    let query = supabase
      .from(TABLE_NAME)
      .select('_id')
      .eq('code', code)
      .eq('app_id', app_id)
      .eq('tenant_id', tenant_id)
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('_id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return (data?.length || 0) > 0;
  },

  /**
   * Get statistics for an application
   */
  getStatistics: async (app_id: string, tenant_id?: string): Promise<CapabilityStatistics> => {
    let query = supabase
      .from(TABLE_NAME)
      .select('type, status')
      .eq('app_id', app_id)
      .is('deleted_at', null);

    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const stats: CapabilityStatistics = {
      total: 0,
      features: 0,
      limits: 0,
      active: 0,
      inactive: 0,
    };

    data?.forEach(item => {
      stats.total++;
      
      if (item.type === 'FEATURE') stats.features++;
      else if (item.type === 'LIMIT') stats.limits++;

      if (item.status === 'active') stats.active++;
      else if (item.status === 'inactive') stats.inactive++;
    });

    return stats;
  },

  /**
   * Clone capabilities from one app to another
   */
  cloneFromApp: async (sourceAppId: string, targetAppId: string, tenant_id: string): Promise<AppCapability[]> => {
    const sourceCapabilities = await appCapabilityApi.getByAppId(sourceAppId, tenant_id);

    const promises = sourceCapabilities.map(cap => {
      const { _id, created_at, updated_at, version, app_id, ...capData } = cap;
      return appCapabilityApi.create({
        ...capData,
        app_id: targetAppId,
        tenant_id,
      });
    });

    return Promise.all(promises);
  },
};

export default appCapabilityApi;
