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
  parent_department_id?: string;     // uuid nullable, self-reference
  manager_id?: string;               // uuid nullable, FK to tenant_members
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
 * Create Department Request
 */
export interface CreateDepartmentRequest {
  tenant_id: string;
  code: string;
  name: string;
  parent_department_id?: string;
  manager_id?: string;
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
  parent_department_id?: string;
  manager_id?: string;
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
export interface DepartmentTreeNode extends Department {
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
  getAll: async (filters?: DepartmentFilters): Promise<Department[]> => {
    return adapter.getAll(filters);
  },

  /**
   * GET /departments/:id
   */
  getById: async (id: string): Promise<Department> => {
    return adapter.getById(id);
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
    
    return adapter.create(data);
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
    
    return adapter.update(id, data);
  },

  /**
   * DELETE /departments/:id (SOFT DELETE)
   * Sets deleted_at to current timestamp
   * ✅ IMPROVEMENT: Now requires version
   */
  delete: async (id: string, deleted_by?: string, version?: number): Promise<void> => {
    // Get current version if not provided
    if (!version) {
      const dept = await adapter.getById(id);
      version = dept.version;
    }
    
    // Soft delete: set deleted_at
    await adapter.update(id, {
      deleted_at: new Date().toISOString(),
      deleted_by,
      version,
    } as any);
  },

  /**
   * Hard delete (permanently remove from database)
   * Use with caution!
   */
  hardDelete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * Restore soft-deleted department
   * ✅ IMPROVEMENT: Now requires version
   */
  restore: async (id: string, version?: number): Promise<Department> => {
    // Get current version if not provided
    if (!version) {
      const dept = await adapter.getById(id);
      version = dept.version;
    }
    
    return adapter.update(id, {
      deleted_at: undefined,
      deleted_by: undefined,
      version,
    } as any);
  },

  /**
   * Get departments by tenant
   */
  getByTenant: async (tenantId: string, includeDeleted: boolean = false): Promise<Department[]> => {
    return adapter.getAll({ 
      tenant_id: tenantId,
      include_deleted: includeDeleted,
    });
  },

  /**
   * Get root departments (no parent)
   */
  getRootDepartments: async (tenantId: string): Promise<Department[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      root_only: true,
    });
  },

  /**
   * Get children departments
   */
  getChildren: async (parentId: string): Promise<Department[]> => {
    return adapter.getAll({
      parent_department_id: parentId,
    });
  },

  /**
   * Get department tree (hierarchical structure)
   */
  getTree: async (tenantId: string): Promise<DepartmentTreeNode[]> => {
    const departments = await adapter.getAll({ tenant_id: tenantId });
    return buildTree(departments);
  },

  /**
   * Get department path (breadcrumb)
   */
  getPath: async (id: string): Promise<Department[]> => {
    // TODO: Implement in Golang backend
    // Returns array from root to this department
    throw new Error('Get path endpoint not implemented - migrate to Golang');
  },

  /**
   * Move department to new parent
   */
  move: async (id: string, data: MoveDepartmentRequest): Promise<Department> => {
    // Check for circular reference before moving
    // TODO: Implement in Golang backend with validation
    return adapter.update(id, {
      parent_department_id: data.new_parent_id,
      order: data.new_order,
      updated_by: data.updated_by,
    });
  },

  /**
   * Update department order
   */
  updateOrder: async (id: string, order: number): Promise<Department> => {
    return adapter.update(id, { order });
  },

  /**
   * Assign manager to department
   */
  assignManager: async (id: string, managerId: string, updated_by?: string): Promise<Department> => {
    return adapter.update(id, {
      manager_id: managerId,
      updated_by,
    });
  },

  /**
   * Remove manager from department
   */
  removeManager: async (id: string, updated_by?: string): Promise<Department> => {
    return adapter.update(id, {
      manager_id: undefined,
      updated_by,
    });
  },

  /**
   * Update department status
   */
  updateStatus: async (id: string, status: DepartmentStatus, updated_by?: string): Promise<Department> => {
    return adapter.update(id, {
      status,
      updated_by,
    });
  },

  /**
   * Archive department (set status to ARCHIVED)
   */
  archive: async (id: string, updated_by?: string): Promise<Department> => {
    return adapter.update(id, {
      status: 'ARCHIVED',
      updated_by,
    });
  },

  /**
   * Activate department (set status to ACTIVE)
   */
  activate: async (id: string, updated_by?: string): Promise<Department> => {
    return adapter.update(id, {
      status: 'ACTIVE',
      updated_by,
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
    
    // Calculate max depth
    const maxDepth = calculateMaxDepth(departments);
    
    // Calculate average children per department
    const deptWithChildren = departments.filter(d => 
      departments.some(child => child.parent_department_id === d._id)
    );
    const avgChildren = deptWithChildren.length > 0
      ? Math.round(departments.length / deptWithChildren.length * 10) / 10
      : 0;
    
    const withManager = departments.filter(d => d.manager_id).length;
    const withoutManager = departments.length - withManager;
    
    // TODO: Get member counts from Golang backend
    const totalMembers = 0;
    const avgMembers = 0;
    
    return {
      total: departments.length,
      by_status: byStatus,
      root_departments: rootDepartments,
      max_depth: maxDepth,
      avg_children_per_dept: avgChildren,
      departments_with_manager: withManager,
      departments_without_manager: withoutManager,
      total_members: totalMembers,
      avg_members_per_dept: avgMembers,
      largest_department: null,
    };
  },

  /**
   * Search departments
   */
  search: async (tenantId: string, query: string): Promise<Department[]> => {
    return adapter.getAll({
      tenant_id: tenantId,
      search: query,
    });
  },

  /**
   * Get departments by manager
   */
  getByManager: async (managerId: string): Promise<Department[]> => {
    return adapter.getAll({
      manager_id: managerId,
    });
  },

  /**
   * Get departments by status
   */
  getByStatus: async (tenantId: string, status: DepartmentStatus): Promise<Department[]> => {
    return adapter.getAll({
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
    const dept = await adapter.getById(id);
    
    // Check if has children
    const children = await departmentsApi.getChildren(id);
    if (children.length > 0) {
      return {
        can_delete: false,
        reason: 'Department has child departments',
        child_count: children.length,
      };
    }
    
    // TODO: Check if has members in Golang backend
    // SELECT COUNT(*) FROM tenant_members WHERE department_id = $1
    
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
    
    // TODO: Check for circular reference in Golang backend
    // Need to traverse up the tree from newParentId
    // If we encounter id, it's circular
    
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
      // Don't copy parent, manager, or audit fields
    });
  },

  /**
   * Get department hierarchy (from root to this dept)
   */
  getHierarchy: async (id: string): Promise<Department[]> => {
    const path: Department[] = [];
    let current = await adapter.getById(id);
    
    path.unshift(current);
    
    while (current.parent_department_id) {
      current = await adapter.getById(current.parent_department_id);
      path.unshift(current);
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
      ids.map(id => adapter.update(id, { status, updated_by }))
    );
  },

  /**
   * Bulk delete (soft delete)
   */
  bulkDelete: async (ids: string[], deleted_by?: string): Promise<void> => {
    const deleted_at = new Date().toISOString();
    await Promise.all(
      ids.map(id => adapter.update(id, { deleted_at, deleted_by } as any))
    );
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Build tree structure from flat list
 */
function buildTree(departments: Department[]): DepartmentTreeNode[] {
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
        // Parent not found (maybe deleted), treat as root
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
  const tree = buildTree(departments);
  
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