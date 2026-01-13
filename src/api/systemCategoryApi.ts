/**
 * System Category API
 * 3-Level Hierarchy: Group -> Type -> Category
 */

import { supabase } from '../utils/supabase/client';

const TABLE_NAME = 'system_categories';

// ============================================
// Types & Interfaces
// ============================================

export type CategoryStatus = 0 | 1;

export const CategoryStatusHelper = {
  INACTIVE: 0 as CategoryStatus,
  ACTIVE: 1 as CategoryStatus,
  isActive: (status: CategoryStatus) => status === 1,
  isInactive: (status: CategoryStatus) => status === 0,
  toString: (status: CategoryStatus) => status === 1 ? 'active' : 'inactive',
  fromString: (str: string): CategoryStatus => str === 'active' ? 1 : 0,
};

// Extra field definition for SystemCategoryType
export interface ExtraField {
  code: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'uuid' | 'date';
  defaultValue: any;
  config?: Record<string, any>;
}

// Base SystemCategory interface
export interface SystemCategory {
  id?: string;
  type: string; // 'SYSTEM_CATEGORY_GROUP', 'SYSTEM_CATEGORY_TYPE', or TYPE_XXX code
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

// Level 1: Category Group
export interface SystemCategoryGroup extends SystemCategory {
  type: 'SYSTEM_CATEGORY_GROUP';
}

// Level 2: Category Type
export interface SystemCategoryType extends SystemCategory {
  type: 'SYSTEM_CATEGORY_TYPE';
  group_category_id: string;
  collection_name: string;
  extra_fields: ExtraField[];
}

// Level 3: Category Instance
export interface CategoryInstance extends SystemCategory {
  group_category_id: string;
  // Dynamic fields from extraFields will be in metadata
}

// ============================================
// API Functions
// ============================================

export const systemCategoryApi = {
  // ========== LEVEL 1: Groups ==========
  
  /**
   * Get all category groups
   */
  getAllGroups: async (): Promise<SystemCategoryGroup[]> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', 'SYSTEM_CATEGORY_GROUP')
      .order('order');
    
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      ...item,
      status: CategoryStatusHelper.fromString(item.status),
    }));
  },

  /**
   * Get active category groups only
   */
  getActiveGroups: async (): Promise<SystemCategoryGroup[]> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', 'SYSTEM_CATEGORY_GROUP')
      .eq('status', 'active')
      .order('order');
    
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      ...item,
      status: CategoryStatusHelper.fromString(item.status),
    }));
  },

  // ========== LEVEL 2: Types ==========
  
  /**
   * Get all category types
   */
  getAllTypes: async (): Promise<SystemCategoryType[]> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', 'SYSTEM_CATEGORY_TYPE')
      .order('group_category_id', { ascending: true })
      .order('order', { ascending: true });
    
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      ...item,
      status: CategoryStatusHelper.fromString(item.status),
    }));
  },

  /**
   * Get category types by group
   */
  getTypesByGroup: async (groupCode: string): Promise<SystemCategoryType[]> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', 'SYSTEM_CATEGORY_TYPE')
      .eq('group_category_id', groupCode)
      .eq('status', 'active')
      .order('order');
    
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      ...item,
      status: CategoryStatusHelper.fromString(item.status),
    }));
  },

  /**
   * Get a single category type by code
   */
  getTypeByCode: async (code: string): Promise<SystemCategoryType | null> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', 'SYSTEM_CATEGORY_TYPE')
      .eq('code', code)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return {
      ...data,
      status: CategoryStatusHelper.fromString(data.status),
    };
  },

  // ========== LEVEL 3: Categories ==========
  
  /**
   * Get categories by type code
   */
  getCategoriesByType: async (typeCode: string): Promise<CategoryInstance[]> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', typeCode)
      .order('order');
    
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      ...item,
      status: CategoryStatusHelper.fromString(item.status),
    }));
  },

  /**
   * Get active categories by type code
   */
  getActiveCategoriesByType: async (typeCode: string): Promise<CategoryInstance[]> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', typeCode)
      .eq('status', 'active')
      .order('order');
    
    if (error) throw new Error(error.message);
    return (data || []).map(item => ({
      ...item,
      status: CategoryStatusHelper.fromString(item.status),
    }));
  },

  /**
   * Get a single category by code
   */
  getCategoryByCode: async (code: string): Promise<SystemCategory | null> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return {
      ...data,
      status: CategoryStatusHelper.fromString(data.status),
    };
  },

  /**
   * Get category by ID
   */
  getById: async (id: string): Promise<SystemCategory | null> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return {
      ...data,
      status: CategoryStatusHelper.fromString(data.status),
    };
  },

  // ========== CRUD Operations ==========
  
  /**
   * Create a new category (any level)
   */
  create: async (data: Partial<SystemCategory>): Promise<SystemCategory> => {
    // Convert status from number to string for database
    const dbData = {
      ...data,
      status: typeof data.status === 'number' 
        ? CategoryStatusHelper.toString(data.status as CategoryStatus)
        : data.status,
    };
    
    const { data: result, error } = await supabase
      .from(TABLE_NAME)
      .insert([dbData])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    // Convert status back to number for frontend
    return {
      ...result,
      status: CategoryStatusHelper.fromString(result.status),
    };
  },

  /**
   * Update a category
   */
  update: async (id: string, data: Partial<SystemCategory>): Promise<SystemCategory> => {
    // Convert status from number to string for database
    const dbData = {
      ...data,
      status: typeof data.status === 'number' 
        ? CategoryStatusHelper.toString(data.status as CategoryStatus)
        : data.status,
    };
    
    const { data: result, error } = await supabase
      .from(TABLE_NAME)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    // Convert status back to number for frontend
    return {
      ...result,
      status: CategoryStatusHelper.fromString(result.status),
    };
  },

  /**
   * Update category by code
   */
  updateByCode: async (code: string, data: Partial<SystemCategory>): Promise<SystemCategory> => {
    const { data: result, error } = await supabase
      .from(TABLE_NAME)
      .update(data)
      .eq('code', code)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return result;
  },

  /**
   * Delete a category (soft delete by setting status to 0)
   */
  softDelete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ status: 'inactive' })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  /**
   * Hard delete a category
   */
  hardDelete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  // ========== Utility Functions ==========
  
  /**
   * Check if code exists
   */
  codeExists: async (code: string, excludeId?: string): Promise<boolean> => {
    let query = supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('code', code);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(error.message);
    return (data?.length || 0) > 0;
  },

  /**
   * Get category hierarchy (for breadcrumb)
   */
  getHierarchy: async (categoryCode: string): Promise<SystemCategory[]> => {
    const category = await systemCategoryApi.getCategoryByCode(categoryCode);
    if (!category) return [];

    const hierarchy: SystemCategory[] = [category];

    // If has parentId, get parent
    if (category.parent_id) {
      const parent = await systemCategoryApi.getCategoryByCode(category.parent_id);
      if (parent) hierarchy.unshift(parent);
    }

    // If has groupCategoryId, get group
    if (category.group_category_id) {
      const group = await systemCategoryApi.getCategoryByCode(category.group_category_id);
      if (group) hierarchy.unshift(group);
    }

    return hierarchy;
  },

  /**
   * Get statistics
   */
  getStatistics: async (): Promise<{
    totalGroups: number;
    totalTypes: number;
    totalCategories: number;
    activeGroups: number;
    activeTypes: number;
    activeCategories: number;
  }> => {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('type, status');

    if (error) throw new Error(error.message);

    const stats = {
      totalGroups: 0,
      totalTypes: 0,
      totalCategories: 0,
      activeGroups: 0,
      activeTypes: 0,
      activeCategories: 0,
    };

    data?.forEach(item => {
      const isActive = item.status === 'active';
      
      if (item.type === 'SYSTEM_CATEGORY_GROUP') {
        stats.totalGroups++;
        if (isActive) stats.activeGroups++;
      } else if (item.type === 'SYSTEM_CATEGORY_TYPE') {
        stats.totalTypes++;
        if (isActive) stats.activeTypes++;
      } else {
        stats.totalCategories++;
        if (isActive) stats.activeCategories++;
      }
    });

    return stats;
  },
};

export default systemCategoryApi;