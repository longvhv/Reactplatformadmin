/**
 * System Category API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * 3-Level Hierarchy: Group -> Type -> Category
 * IMPORTANT: status field is INT2 (0=inactive, 1=active)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type CategoryStatus = 0 | 1;

export const CategoryStatusHelper = {
  INACTIVE: 0 as CategoryStatus,
  ACTIVE: 1 as CategoryStatus,
  isActive: (status: CategoryStatus) => status === 1,
  isInactive: (status: CategoryStatus) => status === 0,
  toString: (status: CategoryStatus) => (status === 1 ? 'active' : 'inactive'),
  toNumber: (str: string): CategoryStatus => (str === 'active' ? 1 : 0),
  toDbValue: (status: CategoryStatus | string | undefined): number => {
    if (status === undefined) return 1;
    if (typeof status === 'number') return status;
    return status === 'active' ? 1 : 0;
  },
  fromDbValue: (value: number | string): CategoryStatus => {
    if (typeof value === 'number') return value as CategoryStatus;
    return value === 'active' || value === '1' || value === 1 ? 1 : 0;
  },
};

export interface ExtraField {
  code: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'date';
  defaultValue: any;
  config?: Record<string, any>;
}

export interface SystemCategory {
  _id?: string;
  type: string;
  code: string;
  name: string;
  status: CategoryStatus;
  parent_id?: string | null;
  group_category_id?: string | null;
  collection_name?: string;
  extra_fields?: ExtraField[];
  description?: string;
  metadata?: Record<string, any>;
  is_system?: boolean;
  is_editable?: boolean;
  order?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface SystemCategoryGroup extends SystemCategory {
  type: 'SYSTEM_CATEGORY_GROUP';
}

export interface SystemCategoryType extends SystemCategory {
  type: 'SYSTEM_CATEGORY_TYPE';
  group_category_id: string;
  collection_name: string;
  extra_fields: ExtraField[];
}

export interface CategoryInstance extends SystemCategory {
  group_category_id: string;
}

export interface CreateCategoryRequest {
  type: string;
  code: string;
  name: string;
  status?: CategoryStatus;
  parent_id?: string;
  group_category_id?: string;
  collection_name?: string;
  extra_fields?: ExtraField[];
  description?: string;
  metadata?: Record<string, any>;
  order?: number;
}

export interface UpdateCategoryRequest {
  code?: string;
  name?: string;
  status?: CategoryStatus;
  parent_id?: string;
  collection_name?: string;
  extra_fields?: ExtraField[];
  description?: string;
  metadata?: Record<string, any>;
  order?: number;
}

export interface CategoryFilters extends BaseFilters {
  type?: string;
  status?: CategoryStatus;
  group_category_id?: string;
  parent_id?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<SystemCategory, CreateCategoryRequest, UpdateCategoryRequest>(
  'system_categories',
  '/system-categories'
);

// ==================== API CLIENT ====================

export const systemCategoryApi = {
  /**
   * GET /system-categories
   */
  getAll: async (filters?: CategoryFilters): Promise<SystemCategory[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /system-categories/:id
   */
  getById: async (id: string): Promise<SystemCategory> => {
    return adapter.getById(id);
  },

  /**
   * POST /system-categories
   */
  create: async (data: CreateCategoryRequest): Promise<SystemCategory> => {
    return adapter.create(data);
  },

  /**
   * PATCH /system-categories/:id
   */
  update: async (id: string, data: UpdateCategoryRequest): Promise<SystemCategory> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /system-categories/:id (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  // ========== LEVEL 1: Groups ==========

  /**
   * GET /system-categories/groups
   * TODO (Golang): Implement dedicated endpoint
   */
  getAllGroups: async (): Promise<SystemCategoryGroup[]> => {
    return adapter.getAll({ type: 'SYSTEM_CATEGORY_GROUP' }) as Promise<SystemCategoryGroup[]>;
  },

  /**
   * GET /system-categories/groups?status=1
   */
  getActiveGroups: async (): Promise<SystemCategoryGroup[]> => {
    return adapter.getAll({ 
      type: 'SYSTEM_CATEGORY_GROUP', 
      status: 1 
    }) as Promise<SystemCategoryGroup[]>;
  },

  // ========== LEVEL 2: Types ==========

  /**
   * GET /system-categories/types
   * TODO (Golang): Implement dedicated endpoint
   */
  getAllTypes: async (): Promise<SystemCategoryType[]> => {
    return adapter.getAll({ type: 'SYSTEM_CATEGORY_TYPE' }) as Promise<SystemCategoryType[]>;
  },

  /**
   * GET /system-categories/types?group_category_id={groupCode}
   */
  getTypesByGroup: async (groupCode: string): Promise<SystemCategoryType[]> => {
    return adapter.getAll({ 
      type: 'SYSTEM_CATEGORY_TYPE',
      group_category_id: groupCode,
      status: 1
    }) as Promise<SystemCategoryType[]>;
  },

  /**
   * GET /system-categories/by-code/:code
   * TODO (Golang): Implement dedicated endpoint
   */
  getTypeByCode: async (code: string): Promise<SystemCategoryType | null> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  // ========== LEVEL 3: Categories ==========

  /**
   * GET /system-categories?type={typeCode}
   */
  getCategoriesByType: async (typeCode: string): Promise<CategoryInstance[]> => {
    return adapter.getAll({ type: typeCode }) as Promise<CategoryInstance[]>;
  },

  /**
   * GET /system-categories?type={typeCode}&status=1
   */
  getActiveCategoriesByType: async (typeCode: string): Promise<CategoryInstance[]> => {
    return adapter.getAll({ 
      type: typeCode, 
      status: 1 
    }) as Promise<CategoryInstance[]>;
  },

  /**
   * GET /system-categories/by-code/:code
   * TODO (Golang): Implement dedicated endpoint
   */
  getCategoryByCode: async (code: string): Promise<SystemCategory | null> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * PATCH /system-categories/by-code/:code
   * TODO (Golang): Implement dedicated endpoint
   */
  updateByCode: async (code: string, data: UpdateCategoryRequest): Promise<SystemCategory> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * DELETE /system-categories/:id?hard=true
   * TODO (Golang): Implement hard delete endpoint
   */
  hardDelete: async (id: string): Promise<void> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  // ========== Utility Functions ==========

  /**
   * GET /system-categories/exists/:code
   * TODO (Golang): Implement code uniqueness check
   */
  codeExists: async (code: string, excludeId?: string): Promise<boolean> => {
    throw new Error('Not implemented - migrate to Golang');
  },

  /**
   * GET /system-categories/:code/hierarchy
   * TODO (Golang): Implement hierarchy traversal
   */
  getHierarchy: async (categoryCode: string): Promise<SystemCategory[]> => {
    throw new Error('Not implemented - complex hierarchy, migrate to Golang');
  },

  /**
   * GET /system-categories/statistics
   * TODO (Golang): Implement statistics aggregation
   */
  getStatistics: async (): Promise<{
    totalGroups: number;
    totalTypes: number;
    totalCategories: number;
    activeGroups: number;
    activeTypes: number;
    activeCategories: number;
  }> => {
    throw new Error('Not implemented - complex aggregation, migrate to Golang');
  },
};

export default systemCategoryApi;
