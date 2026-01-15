/**
 * Regions API Client
 * Handles all region CRUD operations
 * 
 * Architecture:
 * - Uses Adapter pattern for data source abstraction
 * - Supports Supabase (current) and Golang API (future)
 * - Switch between backends via API_MODE config
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export interface Region {
  _id: string;
  code: string;
  name: string;
  name_en?: string;
  type: 'country' | 'province' | 'district';
  parent_id: string | null;
  start_date: string;
  end_date: string | null;
  description?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CreateRegionRequest {
  code: string;
  name: string;
  name_en?: string;
  type: 'country' | 'province' | 'district';
  parent_id: string | null;
  start_date: string;
  end_date?: string | null;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateRegionRequest {
  code?: string;
  name?: string;
  name_en?: string;
  type?: 'country' | 'province' | 'district';
  parent_id?: string | null;
  start_date?: string;
  end_date?: string | null;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RegionFilters extends BaseFilters {
  type?: 'country' | 'province' | 'district';
  parent_id?: string | null;
  active_only?: boolean;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Region, CreateRegionRequest, UpdateRegionRequest>(
  'regions',
  '/regions'
);

// ==================== API CLIENT ====================

export const regionsApi = {
  /**
   * GET /regions
   * List all regions with filters
   */
  getAll: async (params?: RegionFilters): Promise<Region[]> => {
    return adapter.getAll(params);
  },

  /**
   * GET /regions/:id
   * Get region by ID
   */
  getById: async (id: string): Promise<Region> => {
    return adapter.getById(id);
  },

  /**
   * POST /regions
   * Create new region
   */
  create: async (data: CreateRegionRequest): Promise<Region> => {
    return adapter.create(data);
  },

  /**
   * PATCH /regions/:id
   * Update region
   */
  update: async (id: string, data: UpdateRegionRequest): Promise<Region> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /regions/:id
   * Soft delete region
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * GET /regions?type=country
   * Get all countries
   */
  getCountries: async (): Promise<Region[]> => {
    return adapter.getAll({ type: 'country' });
  },

  /**
   * GET /regions?type=province&parent_id={countryId}
   * Get provinces by country
   */
  getProvinces: async (countryId: string): Promise<Region[]> => {
    return adapter.getAll({ type: 'province', parent_id: countryId });
  },

  /**
   * GET /regions?type=district&parent_id={provinceId}
   * Get districts by province
   */
  getDistricts: async (provinceId: string): Promise<Region[]> => {
    return adapter.getAll({ type: 'district', parent_id: provinceId });
  },

  /**
   * GET /regions (hierarchy view)
   * Get all regions for hierarchy display
   */
  getHierarchy: async (): Promise<Region[]> => {
    return adapter.getAll({ order_by: 'parent_id,name' });
  },
};