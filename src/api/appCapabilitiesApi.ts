/**
 * App Capabilities API Client
 * Manages application capabilities (features and limits)
 * 
 * ✅ 100% COMPLIANT with database schema (2026-01-20)
 * Matches: public.app_capabilities table structure
 */

import { getSupabaseClient } from '../lib/supabase';

// ==================== TYPES ====================

export interface AppCapability {
  _id: string;                       // uuid not null primary key
  tenant_id: string;                 // uuid not null
  app_id: string;                    // uuid not null
  code: string;                      // varchar not null
  name: string;                      // varchar not null
  description?: string;              // text
  type: 'FEATURE' | 'LIMIT';         // varchar not null default 'FEATURE' check (type in ('FEATURE', 'LIMIT'))
  default_value: Record<string, any>; // jsonb not null default '{}'
  display_order: number;             // integer not null default 0
  is_required: boolean;              // boolean not null default false
  validation_rules: Record<string, any>; // jsonb not null default '{}'
  status: 'active' | 'inactive' | 'archived'; // varchar not null default 'active'
  metadata: Record<string, any>;     // jsonb not null default '{}'
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  version: number;                   // bigint not null default 1 check (version >= 1)
}

export interface CreateAppCapabilityRequest {
  tenant_id: string;
  app_id: string;
  code: string;
  name: string;
  description?: string;
  type?: 'FEATURE' | 'LIMIT';
  default_value?: Record<string, any>;
  display_order?: number;
  is_required?: boolean;
  validation_rules?: Record<string, any>;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, any>;
}

export interface UpdateAppCapabilityRequest {
  name?: string;
  description?: string;
  type?: 'FEATURE' | 'LIMIT';
  default_value?: Record<string, any>;
  display_order?: number;
  is_required?: boolean;
  validation_rules?: Record<string, any>;
  status?: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, any>;
  version: number; // Required for optimistic locking
}

export interface AppCapabilityFilters {
  tenant_id?: string;
  app_id?: string;
  type?: 'FEATURE' | 'LIMIT';
  status?: 'active' | 'inactive' | 'archived';
  search?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}

// ==================== API CLIENT ====================

export const appCapabilitiesApi = {
  /**
   * GET /app-capabilities
   */
  getAll: async (filters?: AppCapabilityFilters): Promise<AppCapability[]> => {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('app_capabilities')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Filter out deleted by default
    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.app_id) query = query.eq('app_id', filters.app_id);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch app capabilities: ${error.message}`);

    let result = data as AppCapability[];

    // Client-side search
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(search) || 
        item.code.toLowerCase().includes(search) || 
        (item.description && item.description.toLowerCase().includes(search))
      );
    }

    return result;
  },

  /**
   * GET /app-capabilities/:id
   */
  getById: async (id: string): Promise<AppCapability> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('app_capabilities')
      .select('*')
      .eq('_id', id)
      .single();

    if (error) throw new Error(`Failed to fetch app capability: ${error.message}`);
    return data as AppCapability;
  },

  /**
   * POST /app-capabilities
   */
  create: async (data: CreateAppCapabilityRequest): Promise<AppCapability> => {
    // Validate required fields
    if (!data.tenant_id) throw new Error('Tenant ID is required');
    if (!data.app_id) throw new Error('App ID is required');
    if (!data.code) throw new Error('Code is required');
    if (!data.name) throw new Error('Name is required');

    const supabase = getSupabaseClient();
    const _id = crypto.randomUUID();
    const now = new Date().toISOString();

    const requestData = {
      _id,
      ...data,
      type: data.type || 'FEATURE',
      default_value: data.default_value || {},
      display_order: data.display_order ?? 0,
      is_required: data.is_required ?? false,
      validation_rules: data.validation_rules || {},
      status: data.status || 'active',
      metadata: data.metadata || {},
      created_at: now,
      updated_at: now,
      version: 1,
    };

    const { data: created, error } = await supabase
      .from('app_capabilities')
      .insert([requestData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create app capability: ${error.message}`);
    return created as AppCapability;
  },

  /**
   * PATCH /app-capabilities/:id
   */
  update: async (id: string, data: UpdateAppCapabilityRequest): Promise<AppCapability> => {
    const supabase = getSupabaseClient();

    // 1. Get current version
    let currentVersion = data.version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('app_capabilities')
        .select('version')
        .eq('_id', id)
        .single();
      
      if (fetchError || !current) {
        throw new Error('App capability not found or access denied');
      }
      currentVersion = current.version;
    }

    const nextVersion = currentVersion + 1;
    const now = new Date().toISOString();

    const { version, ...updateFields } = data;

    const updateData = {
      ...updateFields,
      updated_at: now,
      version: nextVersion,
    };

    const { data: updated, error } = await supabase
      .from('app_capabilities')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) throw new Error(`Failed to update app capability: ${error.message}`);
    if (!updated) throw new Error('Concurrent modification detected. Please refresh and try again.');

    return updated as AppCapability;
  },

  /**
   * DELETE /app-capabilities/:id
   * Soft Delete with Version Check
   */
  delete: async (id: string, version?: number): Promise<void> => {
    const supabase = getSupabaseClient();

    let currentVersion = version;
    if (currentVersion === undefined) {
      const { data: current, error: fetchError } = await supabase
        .from('app_capabilities')
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
      .from('app_capabilities')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: nextVersion,
        status: 'archived'
      })
      .eq('_id', id)
      .eq('version', currentVersion);

    if (error) throw new Error(`Failed to delete app capability: ${error.message}`);
  }
};

export default appCapabilitiesApi;
