/**
 * System Categories API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * 3-Level Hierarchy: Group -> Type -> Category
 * IMPORTANT: status field is SMALLINT (0=inactive, 1=active)
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type CategoryStatus = 0 | 1;

export const CategoryStatusHelper = {
  INACTIVE: 0 as CategoryStatus,
  ACTIVE: 1 as CategoryStatus,
  isActive: (status: CategoryStatus) => status === 1,
  isInactive: (status: CategoryStatus) => status === 0,
  toString: (status: CategoryStatus) => (status === 1 ? 'Hoạt động' : 'Không hoạt động'),
  toNumber: (str: string): CategoryStatus => (str === 'active' || str === '1' ? 1 : 0),
  toDbValue: (status: CategoryStatus | string | undefined): number => {
    if (status === undefined) return 1;
    if (typeof status === 'number') return status;
    return status === 'active' || status === '1' ? 1 : 0;
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
  required?: boolean;
  config?: Record<string, any>;
}

// ==================== MAIN INTERFACE ====================

export interface SystemCategory {
  // I. IDENTITY & HIERARCHY
  _id: string;
  tenant_id: string;
  type: string;
  code: string;
  name: string;

  // II. STATUS & ORDERING
  status: CategoryStatus;
  order: number;

  // III. CONTENT
  description: string | null;

  // IV. HIERARCHY RELATIONSHIPS
  parent_id: string | null;
  group_category_id: string | null;

  // V. COLLECTION METADATA
  collection_name: string;
  extra_fields: ExtraField[];

  // VI. ADDITIONAL DATA
  metadata: Record<string, any>;

  // VII. SYSTEM FLAGS
  is_system: boolean;
  is_editable: boolean;

  // VIII. AUDIT TRAIL
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  version: number;
}

// ==================== SPECIALIZED INTERFACES ====================

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

// ==================== REQUEST INTERFACES ====================

export interface CreateCategoryRequest {
  // Required
  tenant_id: string;
  type: string;
  code: string;
  name: string;

  // Optional with defaults
  status?: CategoryStatus;
  order?: number;
  collection_name?: string;
  extra_fields?: ExtraField[];
  metadata?: Record<string, any>;
  is_system?: boolean;
  is_editable?: boolean;
  version?: number;

  // Optional
  description?: string;
  parent_id?: string;
  group_category_id?: string;
  created_by?: string;
}

export interface UpdateCategoryRequest {
  code?: string;
  name?: string;
  status?: CategoryStatus;
  order?: number;
  description?: string | null;
  parent_id?: string | null;
  group_category_id?: string | null;
  collection_name?: string;
  extra_fields?: ExtraField[];
  metadata?: Record<string, any>;
  is_editable?: boolean;
  updated_by?: string;
}

export interface CategoryFilters extends BaseFilters {
  tenant_id?: string;
  type?: string;
  status?: CategoryStatus;
  group_category_id?: string;
  parent_id?: string;
  collection_name?: string;
  is_system?: boolean;
  is_editable?: boolean;
  include_deleted?: boolean;
}

// ==================== STATISTICS ====================

export interface CategoryStatistics {
  total_categories: number;
  active_categories: number;
  inactive_categories: number;
  system_categories: number;
  editable_categories: number;
  total_groups: number;
  active_groups: number;
  total_types: number;
  active_types: number;
  by_type: Record<string, number>;
  by_collection: Record<string, number>;
}

// ==================== HIERARCHY NODE ====================

export interface CategoryHierarchyNode extends SystemCategory {
  children: CategoryHierarchyNode[];
  level: number;
  path: string[];
}

// ==================== ADAPTER ====================

const adapter = createAdapter<SystemCategory, CreateCategoryRequest, UpdateCategoryRequest>(
  'system_categories',
  '/system-categories',
  true
);

// ==================== API CLIENT ====================

export const systemCategoriesApi = {
  /**
   * GET /system-categories
   */
  getAll: async (filters?: CategoryFilters): Promise<SystemCategory[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('system_categories')
      .select('*')
      .order('order', { ascending: true })
      .order('name', { ascending: true });

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status !== undefined) {
      query = query.eq('status', filters.status);
    }
    if (filters?.group_category_id) {
      query = query.eq('group_category_id', filters.group_category_id);
    }
    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', filters.parent_id);
      }
    }
    if (filters?.collection_name) {
      query = query.eq('collection_name', filters.collection_name);
    }
    if (filters?.is_system !== undefined) {
      query = query.eq('is_system', filters.is_system);
    }
    if (filters?.is_editable !== undefined) {
      query = query.eq('is_editable', filters.is_editable);
    }

    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch system categories: ${error.message}`);
    }

    return data || [];
  },

  getById: async (id: string): Promise<SystemCategory> => {
    return adapter.getById(id);
  },

  create: async (data: CreateCategoryRequest): Promise<SystemCategory> => {
    const requestData = {
      status: 1 as CategoryStatus,
      order: 0,
      collection_name: 'system_categories',
      extra_fields: [],
      metadata: {},
      is_system: false,
      is_editable: true,
      version: 1,
      ...data,
    };

    return adapter.create(requestData);
  },

  update: async (id: string, data: UpdateCategoryRequest): Promise<SystemCategory> => {
    return adapter.update(id, data);
  },

  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  getByCode: async (tenantId: string, code: string): Promise<SystemCategory | null> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('code', code)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch category by code: ${error.message}`);
    }

    return data;
  },

  updateByCode: async (tenantId: string, code: string, data: UpdateCategoryRequest): Promise<SystemCategory> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data: updated, error } = await supabase
      .from('system_categories')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('code', code)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update category by code: ${error?.message || 'Unknown error'}`);
    }

    return updated;
  },

  activate: async (id: string): Promise<SystemCategory> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_categories')
      .update({
        status: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to activate category: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  deactivate: async (id: string): Promise<SystemCategory> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_categories')
      .update({
        status: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to deactivate category: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  reorder: async (items: Array<{ id: string; order: number }>): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const updates = items.map((item) =>
      supabase
        .from('system_categories')
        .update({
          order: item.order,
          updated_at: new Date().toISOString(),
        })
        .eq('_id', item.id)
    );

    await Promise.all(updates);
  },

  getAllGroups: async (tenantId: string): Promise<SystemCategoryGroup[]> => {
    return systemCategoriesApi.getAll({
      tenant_id: tenantId,
      type: 'SYSTEM_CATEGORY_GROUP',
    }) as Promise<SystemCategoryGroup[]>;
  },

  getActiveGroups: async (tenantId: string): Promise<SystemCategoryGroup[]> => {
    return systemCategoriesApi.getAll({
      tenant_id: tenantId,
      type: 'SYSTEM_CATEGORY_GROUP',
      status: 1,
    }) as Promise<SystemCategoryGroup[]>;
  },

  getAllTypes: async (tenantId: string): Promise<SystemCategoryType[]> => {
    return systemCategoriesApi.getAll({
      tenant_id: tenantId,
      type: 'SYSTEM_CATEGORY_TYPE',
    }) as Promise<SystemCategoryType[]>;
  },

  getTypesByGroup: async (tenantId: string, groupCode: string): Promise<SystemCategoryType[]> => {
    return systemCategoriesApi.getAll({
      tenant_id: tenantId,
      type: 'SYSTEM_CATEGORY_TYPE',
      group_category_id: groupCode,
      status: 1,
    }) as Promise<SystemCategoryType[]>;
  },

  getTypeByCode: async (tenantId: string, code: string): Promise<SystemCategoryType | null> => {
    const category = await systemCategoriesApi.getByCode(tenantId, code);
    return category && category.type === 'SYSTEM_CATEGORY_TYPE' ? (category as SystemCategoryType) : null;
  },

  getCategoriesByType: async (tenantId: string, typeCode: string): Promise<CategoryInstance[]> => {
    return systemCategoriesApi.getAll({
      tenant_id: tenantId,
      type: typeCode,
    }) as Promise<CategoryInstance[]>;
  },

  getActiveCategoriesByType: async (tenantId: string, typeCode: string): Promise<CategoryInstance[]> => {
    return systemCategoriesApi.getAll({
      tenant_id: tenantId,
      type: typeCode,
      status: 1,
    }) as Promise<CategoryInstance[]>;
  },

  getHierarchy: async (tenantId: string, categoryCode: string): Promise<SystemCategory[]> => {
    const category = await systemCategoriesApi.getByCode(tenantId, categoryCode);
    if (!category) return [];

    const hierarchy: SystemCategory[] = [category];

    let currentParentId = category.parent_id;
    while (currentParentId) {
      const parent = await systemCategoriesApi.getByCode(tenantId, currentParentId);
      if (!parent) break;
      hierarchy.unshift(parent);
      currentParentId = parent.parent_id;
    }

    return hierarchy;
  },

  getChildren: async (tenantId: string, parentId: string): Promise<SystemCategory[]> => {
    return systemCategoriesApi.getAll({
      tenant_id: tenantId,
      parent_id: parentId,
    });
  },

  getTree: async (tenantId: string, categoryCode: string): Promise<CategoryHierarchyNode> => {
    const buildTree = async (code: string, level: number, path: string[]): Promise<CategoryHierarchyNode> => {
      const category = await systemCategoriesApi.getByCode(tenantId, code);
      if (!category) {
        throw new Error(`Category not found: ${code}`);
      }

      const children = await systemCategoriesApi.getChildren(tenantId, category.code);
      const childNodes = await Promise.all(
        children.map((child) => buildTree(child.code, level + 1, [...path, category.code]))
      );

      return {
        ...category,
        children: childNodes,
        level,
        path,
      };
    };

    return buildTree(categoryCode, 0, []);
  },

  getStatistics: async (tenantId: string): Promise<CategoryStatistics> => {
    const categories = await systemCategoriesApi.getAll({ tenant_id: tenantId });
    return calculateStatistics(categories);
  },

  codeExists: async (tenantId: string, code: string, excludeId?: string): Promise<boolean> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('system_categories')
      .select('_id')
      .eq('tenant_id', tenantId)
      .eq('code', code)
      .is('deleted_at', null);

    if (excludeId) {
      query = query.neq('_id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check code existence: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  },

  validate: (data: CreateCategoryRequest | UpdateCategoryRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if ('code' in data && data.code !== undefined) {
      if (!data.code.trim()) {
        errors.push('Mã không được để trống');
      }
      if (data.code.length > 100) {
        errors.push('Mã không được vượt quá 100 ký tự');
      }
      if (!/^[A-Z0-9_]+$/.test(data.code)) {
        errors.push('Mã chỉ được chứa chữ in hoa, số và dấu gạch dưới');
      }
    }

    if ('name' in data && data.name !== undefined) {
      if (!data.name.trim()) {
        errors.push('Tên không được để trống');
      }
      if (data.name.length > 255) {
        errors.push('Tên không được vượt quá 255 ký tự');
      }
    }

    if ('type' in data && data.type !== undefined) {
      if (!data.type.trim()) {
        errors.push('Loại không được để trống');
      }
      if (data.type.length > 100) {
        errors.push('Loại không được vượt quá 100 ký tự');
      }
    }

    if ('order' in data && data.order !== undefined) {
      if (data.order < 0) {
        errors.push('Thứ tự phải >= 0');
      }
    }

    if ('status' in data && data.status !== undefined) {
      if (data.status !== 0 && data.status !== 1) {
        errors.push('Trạng thái phải là 0 hoặc 1');
      }
    }

    if ('collection_name' in data && data.collection_name !== undefined) {
      if (data.collection_name && data.collection_name.length > 100) {
        errors.push('Tên collection không được vượt quá 100 ký tự');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// Export alias for backward compatibility
export const systemCategoryApi = systemCategoriesApi;

export default systemCategoriesApi;

// ==================== HELPER FUNCTIONS ====================

export function calculateStatistics(categories: SystemCategory[]): CategoryStatistics {
  const byType: Record<string, number> = {};
  const byCollection: Record<string, number> = {};

  let activeCount = 0;
  let inactiveCount = 0;
  let systemCount = 0;
  let editableCount = 0;
  let groupCount = 0;
  let activeGroupCount = 0;
  let typeCount = 0;
  let activeTypeCount = 0;

  categories.forEach((cat) => {
    if (cat.status === 1) {
      activeCount++;
    } else {
      inactiveCount++;
    }

    if (cat.is_system) systemCount++;
    if (cat.is_editable) editableCount++;

    if (cat.type === 'SYSTEM_CATEGORY_GROUP') {
      groupCount++;
      if (cat.status === 1) activeGroupCount++;
    }

    if (cat.type === 'SYSTEM_CATEGORY_TYPE') {
      typeCount++;
      if (cat.status === 1) activeTypeCount++;
    }

    byType[cat.type] = (byType[cat.type] || 0) + 1;
    byCollection[cat.collection_name] = (byCollection[cat.collection_name] || 0) + 1;
  });

  return {
    total_categories: categories.length,
    active_categories: activeCount,
    inactive_categories: inactiveCount,
    system_categories: systemCount,
    editable_categories: editableCount,
    total_groups: groupCount,
    active_groups: activeGroupCount,
    total_types: typeCount,
    active_types: activeTypeCount,
    by_type: byType,
    by_collection: byCollection,
  };
}

export function getStatusLabel(status: CategoryStatus): string {
  return status === 1 ? 'Hoạt động' : 'Không hoạt động';
}

export function getStatusColor(status: CategoryStatus): string {
  return status === 1
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
}

export function buildBreadcrumb(hierarchy: SystemCategory[]): string {
  return hierarchy.map((cat) => cat.name).join(' / ');
}

export function flattenTree(node: CategoryHierarchyNode): SystemCategory[] {
  const result: SystemCategory[] = [node];
  node.children.forEach((child) => {
    result.push(...flattenTree(child));
  });
  return result;
}

export function findInTree(node: CategoryHierarchyNode, predicate: (cat: SystemCategory) => boolean): SystemCategory | null {
  if (predicate(node)) return node;
  for (const child of node.children) {
    const found = findInTree(child, predicate);
    if (found) return found;
  }
  return null;
}

export function sortCategories(categories: SystemCategory[]): SystemCategory[] {
  return [...categories].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.name.localeCompare(b.name, 'vi');
  });
}
