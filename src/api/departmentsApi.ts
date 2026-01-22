/**
 * Departments API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ CREATED 2026-01-14: 100% matches departments schema (17 fields)
 * ⚠️ SOFT DELETE: Has deleted_at, deleted_by fields
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

/**
 * Department Status - 3 statuses
 */
export type DepartmentStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

/**
 * Department - 100% matches departments table (17 fields)
 */
export interface Department {
  // Identity & Relationships (2)
  _id: string;
  tenant_id: string;
  
  // Department Information (5)
  code: string;                      // varchar(50) not null, unique per tenant
  name: string;                      // varchar(255) not null
  parent_department_id?: string | null; // uuid nullable, self-reference
  manager_id?: string | null;        // uuid nullable, FK to tenant_members
  description?: string;              // text nullable
  
  // Status & Configuration (3)
  status: DepartmentStatus;          // varchar(20) not null default 'ACTIVE'
  order?: number;                    // integer default 0, for sorting
  metadata?: Record<string, any>;    // jsonb default '{}'
  
  // Audit Fields (4)
  created_at: string;                // timestamptz not null
  updated_at: string;                // timestamptz not null
  created_by?: string;               // uuid nullable
  updated_by?: string;               // uuid nullable
  
  // Soft Delete (2)
  deleted_at?: string;               // timestamptz nullable - SOFT DELETE!
  deleted_by?: string;               // uuid nullable
  
  // Versioning (1)
  version: number;                   // bigint not null default 1
}

/**
 * Enriched Department with joined data
 */
export interface EnrichedDepartment extends Department {
  manager?: {
    _id: string;
    user?: {
      full_name: string;
      email: string;
      avatar_url?: string;
    };
  };
  parent?: {
    _id: string;
    name: string;
  };
}

/**
 * Create Department Request
 */
export interface CreateDepartmentRequest {
  tenant_id: string;
  code: string;
  name: string;
  parent_department_id?: string | null;
  manager_id?: string | null;
  description?: string;
  status?: DepartmentStatus;         // Default 'ACTIVE' in database
  order?: number;                    // Default 0 in database
  metadata?: Record<string, any>;    // Default '{}' in database
  created_by?: string;
}

/**
 * Update Department Request
 * ✅ IMPROVEMENT: Added version for optimistic locking
 */
export interface UpdateDepartmentRequest {
  code?: string;
  name?: string;
  parent_department_id?: string | null;
  manager_id?: string | null;
  description?: string;
  status?: DepartmentStatus;
  order?: number;
  metadata?: Record<string, any>;
  updated_by?: string;
  version: number;  // ✅ REQUIRED for optimistic locking
}

/**
 * Department Filters
 */
export interface DepartmentFilters extends BaseFilters {
  tenant_id?: string;
  status?: DepartmentStatus;
  parent_department_id?: string;     // Filter by parent
  manager_id?: string;               // Filter by manager
  search?: string;                   // Search by name or code
  include_deleted?: boolean;         // Include soft-deleted departments
  root_only?: boolean;               // Only root departments (no parent)
}

/**
 * Department with computed fields (for tree view)
 */
export interface DepartmentTreeNode extends EnrichedDepartment {
  children?: DepartmentTreeNode[];  // Child departments
  level?: number;                   // Tree level (0 for root)
  path?: string;                    // Full path like "Engineering/Backend/Team1"
  member_count?: number;            // Number of members in this department
  total_member_count?: number;      // Including all children
  has_children?: boolean;           // Quick check
}

/**
 * Department Statistics
 */
export interface DepartmentStats {
  total: number;
  by_status: {
    ACTIVE: number;
    INACTIVE: number;
    ARCHIVED: number;
  };
  root_departments: number;
  max_depth: number;
  avg_children_per_dept: number;
  departments_with_manager: number;
  departments_without_manager: number;
  total_members: number;
  avg_members_per_dept: number;
  largest_department: {
    _id: string;
    name: string;
    member_count: number;
  } | null;
}

/**
 * Move Department Request
 */
export interface MoveDepartmentRequest {
  new_parent_id?: string;            // null = move to root
  new_order?: number;
  updated_by?: string;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<Department, CreateDepartmentRequest, UpdateDepartmentRequest>(
  'departments',
  '/departments'
);

// ==================== API CLIENT ====================

export const departmentsApi = {
  /**
   * GET /departments
   */
  getAll: async (filters?: DepartmentFilters): Promise<EnrichedDepartment[]> => {
    // If we have filters that adapter handles well, use adapter, but standard getAll doesn't join.
    // For enriched data, we need a custom query or rely on Supabase joins.
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('departments')
      .select(`
        *,
        manager:tenant_members!manager_id(
          _id,
          user:users!user_id(full_name, email, avatar_url)
        ),
        parent:departments!parent_department_id(
          _id,
          name
        )
      `);

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.parent_department_id) query = query.eq('parent_department_id', filters.parent_department_id);
    if (filters?.manager_id) query = query.eq('manager_id', filters.manager_id);
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }
    
    // Soft delete handling
    if (!filters?.include_deleted) {
      query = query.is('deleted_at', null);
    }

    if (filters?.root_only) {
      query = query.is('parent_department_id', null);
    }

    query = query.order('order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.warn('Failed to fetch enriched departments, falling back to simple fetch', error);
      return adapter.getAll(filters) as Promise<EnrichedDepartment[]>;
    }

    return (data || []) as EnrichedDepartment[];
  },

  /**
   * GET /departments/:id
   */
  getById: async (id: string): Promise<EnrichedDepartment> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        manager:tenant_members!manager_id(
          _id,
          user:users!user_id(full_name, email, avatar_url)
        ),
        parent:departments!parent_department_id(
          _id,
          name
        )
      `)
      .eq('_id', id)
      .single();

    if (error || !data) {
      return adapter.getById(id) as Promise<EnrichedDepartment>;
    }

    return data as EnrichedDepartment;
  },

  /**
   * POST /departments
   */
  create: async (data: CreateDepartmentRequest): Promise<Department> => {
    // Validate code format
    if (!data.code || data.code.trim().length === 0) {
      throw new Error('Department code is required');
    }
    
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Department name is required');
    }

    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const _id = crypto.randomUUID();

    const requestData = {
      _id,
      tenant_id: data.tenant_id,
      code: data.code,
      name: data.name,
      parent_department_id: data.parent_department_id || null,
      manager_id: data.manager_id || null,
      description: data.description || null,
      status: data.status || 'ACTIVE',
      order: data.order || 0,
      metadata: data.metadata || {},
      created_by: data.created_by || null,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { data: created, error } = await supabase
      .from('departments')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create department: ${error.message}`);
    }

    return created;
  },

  /**
   * PATCH /departments/:id
   */
  update: async (id: string, data: UpdateDepartmentRequest): Promise<Department> => {
    // Validate code if provided
    if (data.code !== undefined && data.code.trim().length === 0) {
      throw new Error('Department code cannot be empty');
    }
    
    // Validate name if provided
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Department name cannot be empty');
    }

    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current version for optimistic locking if not provided
    let currentVersion = data.version;

    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('departments')
            .select('version')
            .eq('_id', id)
            .single();
            
        if (fetchError || !current) {
            throw new Error(`Department not found: ${fetchError?.message || 'Unknown error'}`);
        }
        currentVersion = current.version;
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
      version: currentVersion + 1,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.parent_department_id !== undefined) updateData.parent_department_id = data.parent_department_id;
    if (data.manager_id !== undefined) updateData.manager_id = data.manager_id;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.updated_by !== undefined) updateData.updated_by = data.updated_by;
    
    const { data: updated, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update department: ${error.message}`);
    }

    if (!updated) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }

    return updated;
  },

  /**
   * DELETE /departments/:id (SOFT DELETE)
   */
  delete: async (id: string, deleted_by?: string, version?: number): Promise<void> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current version if not provided
    let currentVersion = version;
    if (!currentVersion) {
        const { data: current, error: fetchError } = await supabase
            .from('departments')
            .select('version')
            .eq('_id', id)
            .single();
        
        if (fetchError || !current) {
             if (fetchError) throw new Error(fetchError.message);
             return;
        }
        currentVersion = current.version;
    }

    const { error, data } = await supabase
      .from('departments')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deleted_by || null,
        version: currentVersion + 1
      })
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to delete department: ${error.message}`);
    }
    
    if (!data) {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
    }
  },

  /**
   * Hard delete (permanently remove from database)
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Restore soft-deleted department
   */
  restore: async (id: string, version?: number): Promise<Department> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let currentVersion = version;
    if (!currentVersion) {
        const { data: current, error } = await supabase
            .from('departments')
            .select('version')
            .eq('_id', id)
            .single();
        if (error || !current) throw new Error(`Department not found: ${error?.message}`);
        currentVersion = current.version;
    }
    
    const { data: updated, error } = await supabase
      .from('departments')
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
        version: currentVersion + 1
      })
      .eq('_id', id)
      .eq('version', currentVersion)
      .select()
      .single();

    if (error) throw new Error(`Failed to restore department: ${error.message}`);
    if (!updated) throw new Error('Concurrent modification detected.');
    
    return updated;
  },

  /**
   * Get departments by tenant
   */
  getByTenant: async (tenantId: string, includeDeleted: boolean = false): Promise<EnrichedDepartment[]> => {
    return departmentsApi.getAll({ 
      tenant_id: tenantId,
      include_deleted: includeDeleted,
    });
  },

  /**
   * Get root departments (no parent)
   */
  getRootDepartments: async (tenantId: string): Promise<EnrichedDepartment[]> => {
    return departmentsApi.getAll({
      tenant_id: tenantId,
      root_only: true,
    });
  },

  /**
   * Get children departments
   */
  getChildren: async (parentId: string): Promise<EnrichedDepartment[]> => {
    return departmentsApi.getAll({
      parent_department_id: parentId,
    });
  },

  /**
   * Get department tree (hierarchical structure)
   */
  getTree: async (tenantId: string): Promise<DepartmentTreeNode[]> => {
    const departments = await departmentsApi.getAll({ tenant_id: tenantId });
    return buildTree(departments);
  },

  /**
   * Get department path (breadcrumb)
   */
  getPath: async (id: string): Promise<Department[]> => {
    // Implement client-side path construction via recursive getById
    // Since we don't have a direct backend endpoint yet
    const path: Department[] = [];
    try {
        let current = await departmentsApi.getById(id);
        path.unshift(current);
        
        while (current.parent_department_id) {
            current = await departmentsApi.getById(current.parent_department_id);
            path.unshift(current);
        }
    } catch (e) {
        console.error('Error fetching path:', e);
    }
    return path;
  },

  /**
   * Move department to new parent
   */
  move: async (id: string, data: MoveDepartmentRequest): Promise<Department> => {
    const dept = await departmentsApi.getById(id);
    
    return departmentsApi.update(id, {
      parent_department_id: data.new_parent_id,
      order: data.new_order,
      updated_by: data.updated_by,
      version: dept.version
    });
  },

  /**
   * Update department order
   */
  updateOrder: async (id: string, order: number): Promise<Department> => {
    const dept = await departmentsApi.getById(id);
    return departmentsApi.update(id, { order, version: dept.version });
  },

  /**
   * Assign manager to department
   */
  assignManager: async (id: string, managerId: string, updated_by?: string): Promise<Department> => {
    const dept = await departmentsApi.getById(id);
    return departmentsApi.update(id, {
      manager_id: managerId,
      updated_by,
      version: dept.version
    });
  },

  /**
   * Remove manager from department
   */
  removeManager: async (id: string, updated_by?: string): Promise<Department> => {
    const dept = await departmentsApi.getById(id);
    
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();
    
    const { data: updated, error } = await supabase
        .from('departments')
        .update({
            manager_id: null,
            updated_by,
            updated_at: new Date().toISOString(),
            version: dept.version + 1
        })
        .eq('_id', id)
        .eq('version', dept.version)
        .select()
        .single();
        
    if (error) throw new Error(error.message);
    if (!updated) throw new Error('Concurrent modification detected');
    return updated;
  },

  /**
   * Update department status
   */
  updateStatus: async (id: string, status: DepartmentStatus, updated_by?: string): Promise<Department> => {
    const dept = await departmentsApi.getById(id);
    return departmentsApi.update(id, {
      status,
      updated_by,
      version: dept.version
    });
  },

  /**
   * Archive department (set status to ARCHIVED)
   */
  archive: async (id: string, updated_by?: string): Promise<Department> => {
    const dept = await departmentsApi.getById(id);
    return departmentsApi.update(id, {
      status: 'ARCHIVED',
      updated_by,
      version: dept.version
    });
  },

  /**
   * Activate department (set status to ACTIVE)
   */
  activate: async (id: string, updated_by?: string): Promise<Department> => {
    const dept = await departmentsApi.getById(id);
    return departmentsApi.update(id, {
      status: 'ACTIVE',
      updated_by,
      version: dept.version
    });
  },

  /**
   * Get department statistics
   */
  getStats: async (tenantId: string): Promise<DepartmentStats> => {
    const departments = await adapter.getAll({ tenant_id: tenantId });
    
    const byStatus = {
      ACTIVE: departments.filter(d => d.status === 'ACTIVE').length,
      INACTIVE: departments.filter(d => d.status === 'INACTIVE').length,
      ARCHIVED: departments.filter(d => d.status === 'ARCHIVED').length,
    };
    
    const rootDepartments = departments.filter(d => !d.parent_department_id).length;
    
    const maxDepth = calculateMaxDepth(departments);
    
    const deptWithChildren = departments.filter(d => 
      departments.some(child => child.parent_department_id === d._id)
    );
    const avgChildren = deptWithChildren.length > 0
      ? Math.round(departments.length / deptWithChildren.length * 10) / 10
      : 0;
    
    const withManager = departments.filter(d => d.manager_id).length;
    const withoutManager = departments.length - withManager;
    
    return {
      total: departments.length,
      by_status: byStatus,
      root_departments: rootDepartments,
      max_depth: maxDepth,
      avg_children_per_dept: avgChildren,
      departments_with_manager: withManager,
      departments_without_manager: withoutManager,
      total_members: 0,
      avg_members_per_dept: 0,
      largest_department: null,
    };
  },

  /**
   * Search departments
   */
  search: async (tenantId: string, query: string): Promise<EnrichedDepartment[]> => {
    return departmentsApi.getAll({
      tenant_id: tenantId,
      search: query,
    });
  },

  /**
   * Get departments by manager
   */
  getByManager: async (managerId: string): Promise<EnrichedDepartment[]> => {
    return departmentsApi.getAll({
      manager_id: managerId,
    });
  },

  /**
   * Get departments by status
   */
  getByStatus: async (tenantId: string, status: DepartmentStatus): Promise<EnrichedDepartment[]> => {
    return departmentsApi.getAll({
      tenant_id: tenantId,
      status,
    });
  },

  /**
   * Check if department can be deleted
   */
  canDelete: async (id: string): Promise<{
    can_delete: boolean;
    reason?: string;
    member_count?: number;
    child_count?: number;
  }> => {
    const children = await departmentsApi.getChildren(id);
    if (children.length > 0) {
      return {
        can_delete: false,
        reason: 'Department has child departments',
        child_count: children.length,
      };
    }
    
    return {
      can_delete: true,
    };
  },

  /**
   * Validate circular reference when moving
   */
  validateMove: async (id: string, newParentId: string): Promise<{
    valid: boolean;
    reason?: string;
  }> => {
    if (id === newParentId) {
      return {
        valid: false,
        reason: 'Cannot set department as its own parent',
      };
    }
    
    // Simple check: fetch hierarchy of newParentId
    try {
        const path = await departmentsApi.getHierarchy(newParentId);
        const circular = path.some(d => d._id === id);
        if (circular) {
            return {
                valid: false,
                reason: 'Cannot move department into its own child',
            };
        }
    } catch (e) {
        // Ignore error
    }
    
    return {
      valid: true,
    };
  },

  /**
   * Clone department (create copy with new code)
   */
  clone: async (id: string, newCode: string, newName?: string): Promise<Department> => {
    const original = await adapter.getById(id);
    
    return adapter.create({
      tenant_id: original.tenant_id,
      code: newCode,
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      status: original.status,
      order: original.order,
      metadata: original.metadata ? { ...original.metadata } : undefined,
    });
  },

  /**
   * Get department hierarchy (from root to this dept)
   */
  getHierarchy: async (id: string): Promise<Department[]> => {
    const path: Department[] = [];
    let current = await adapter.getById(id);
    
    path.unshift(current);
    
    // Safety break loop to prevent infinite loops if circular reference exists (DB constraints should prevent, but safe coding)
    let depth = 0;
    const MAX_DEPTH = 20;

    while (current.parent_department_id && depth < MAX_DEPTH) {
      current = await adapter.getById(current.parent_department_id);
      path.unshift(current);
      depth++;
    }
    
    return path;
  },

  /**
   * Get all descendants (recursive)
   */
  getDescendants: async (id: string): Promise<Department[]> => {
    const descendants: Department[] = [];
    const children = await departmentsApi.getChildren(id);
    
    for (const child of children) {
      descendants.push(child);
      const childDescendants = await departmentsApi.getDescendants(child._id);
      descendants.push(...childDescendants);
    }
    
    return descendants;
  },

  /**
   * Bulk update status
   */
  bulkUpdateStatus: async (ids: string[], status: DepartmentStatus, updated_by?: string): Promise<void> => {
    await Promise.all(
      ids.map(id => departmentsApi.updateStatus(id, status, updated_by))
    );
  },

  /**
   * Bulk delete (soft delete)
   */
  bulkDelete: async (ids: string[], deleted_by?: string): Promise<void> => {
    await Promise.all(
      ids.map(id => departmentsApi.delete(id, deleted_by))
    );
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Build tree structure from flat list
 */
function buildTree(departments: EnrichedDepartment[]): DepartmentTreeNode[] {
  const map = new Map<string, DepartmentTreeNode>();
  const roots: DepartmentTreeNode[] = [];
  
  // Create map
  departments.forEach(dept => {
    map.set(dept._id, { ...dept, children: [] });
  });
  
  // Build tree
  departments.forEach(dept => {
    const node = map.get(dept._id)!;
    
    if (dept.parent_department_id) {
      const parent = map.get(dept.parent_department_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
        parent.has_children = true;
      } else {
        // Parent not found (maybe deleted or filtered out), treat as root
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });
  
  // Calculate levels and paths
  const calculateLevelAndPath = (node: DepartmentTreeNode, level: number = 0, parentPath: string = '') => {
    node.level = level;
    node.path = parentPath ? `${parentPath}/${node.name}` : node.name;
    
    if (node.children) {
      node.children.forEach(child => calculateLevelAndPath(child, level + 1, node.path));
    }
  };
  
  roots.forEach(root => calculateLevelAndPath(root));
  
  // Sort by order
  const sortByOrder = (nodes: DepartmentTreeNode[]) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    nodes.forEach(node => {
      if (node.children) {
        sortByOrder(node.children);
      }
    });
  };
  
  sortByOrder(roots);
  
  return roots;
}

/**
 * Calculate max depth of department tree
 */
function calculateMaxDepth(departments: Department[]): number {
  // Convert to Enriched for buildTree type compatibility (safe cast as we only use structure)
  const tree = buildTree(departments as EnrichedDepartment[]);
  
  const getDepth = (node: DepartmentTreeNode): number => {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    return 1 + Math.max(...node.children.map(getDepth));
  };
  
  if (tree.length === 0) return 0;
  
  return Math.max(...tree.map(getDepth));
}

/**
 * Flatten tree to array
 */
export function flattenTree(tree: DepartmentTreeNode[]): Department[] {
  const result: Department[] = [];
  
  const traverse = (node: DepartmentTreeNode) => {
    result.push(node);
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  
  tree.forEach(traverse);
  
  return result;
}

export default departmentsApi;
