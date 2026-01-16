/**
 * Departments Hook
 * Manages department operations with optimistic updates and tree structure support
 * 
 * ✅ CREATED 2026-01-15
 * ✅ Production-ready with error handling
 * ✅ Optimistic UI updates
 * ✅ Tree structure support
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  departmentsApi, 
  Department, 
  DepartmentTreeNode,
  DepartmentFilters, 
  CreateDepartmentRequest, 
  UpdateDepartmentRequest,
  DepartmentStats,
  DepartmentStatus,
  MoveDepartmentRequest
} from '../api/departmentsApi';
import { toast } from 'sonner@2.0.3';

interface UseDepartmentsOptions {
  filters?: DepartmentFilters;
  autoLoad?: boolean;
  loadAsTree?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function useDepartments(options: UseDepartmentsOptions = {}) {
  const {
    filters,
    autoLoad = true,
    loadAsTree = false,
    onSuccess,
    onError,
  } = options;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [tree, setTree] = useState<DepartmentTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DepartmentStats | null>(null);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && filters?.tenant_id) {
      if (loadAsTree) {
        loadTree(filters.tenant_id);
      } else {
        loadDepartments(filters);
      }
    }
  }, [autoLoad, loadAsTree, filters?.tenant_id]);

  // Load departments (flat list)
  const loadDepartments = useCallback(async (customFilters?: DepartmentFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await departmentsApi.getAll(customFilters || filters);
      setDepartments(data);
      
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load departments';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters, onError]);

  // Load departments as tree
  const loadTree = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const treeData = await departmentsApi.getTree(tenantId);
      setTree(treeData);
      
      return treeData;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load department tree';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Load stats
  const loadStats = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      const data = await departmentsApi.getStats(tenantId);
      setStats(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load statistics';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create department
  const createDepartment = useCallback(async (data: CreateDepartmentRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const newDept = await departmentsApi.create(data);
      
      // Optimistic update
      setDepartments(prev => [...prev, newDept]);
      
      const successMsg = 'Department created successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return newDept;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Update department
  const updateDepartment = useCallback(async (id: string, data: UpdateDepartmentRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentsApi.update(id, data);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      const successMsg = 'Department updated successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Delete department (soft delete)
  const deleteDepartment = useCallback(async (id: string, deleted_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if can delete
      const check = await departmentsApi.canDelete(id);
      if (!check.can_delete) {
        throw new Error(check.reason || 'Cannot delete department');
      }
      
      await departmentsApi.delete(id, deleted_by);
      
      // Optimistic update
      setDepartments(prev => prev.filter(d => d._id !== id));
      
      const successMsg = 'Department deleted successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Hard delete (permanent)
  const hardDeleteDepartment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await departmentsApi.hardDelete(id);
      
      // Optimistic update
      setDepartments(prev => prev.filter(d => d._id !== id));
      
      const successMsg = 'Department permanently deleted';
      onSuccess?.(successMsg);
      toast.success(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Restore soft-deleted department
  const restoreDepartment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const restored = await departmentsApi.restore(id);
      
      // Optimistic update
      setDepartments(prev => [...prev, restored]);
      
      const successMsg = 'Department restored successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return restored;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to restore department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Get department by ID
  const getDepartmentById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const dept = await departmentsApi.getById(id);
      return dept;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load department';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get root departments
  const getRootDepartments = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      const roots = await departmentsApi.getRootDepartments(tenantId);
      return roots;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load root departments';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get children departments
  const getChildren = useCallback(async (parentId: string) => {
    try {
      setLoading(true);
      const children = await departmentsApi.getChildren(parentId);
      return children;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load child departments';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get department hierarchy (breadcrumb path)
  const getHierarchy = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const hierarchy = await departmentsApi.getHierarchy(id);
      return hierarchy;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load hierarchy';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all descendants (recursive)
  const getDescendants = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const descendants = await departmentsApi.getDescendants(id);
      return descendants;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load descendants';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Move department to new parent
  const moveDepartment = useCallback(async (id: string, data: MoveDepartmentRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate move if new parent specified
      if (data.new_parent_id) {
        const validation = await departmentsApi.validateMove(id, data.new_parent_id);
        if (!validation.valid) {
          throw new Error(validation.reason || 'Invalid move operation');
        }
      }
      
      const updated = await departmentsApi.move(id, data);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      const successMsg = 'Department moved successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to move department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Update department order
  const updateOrder = useCallback(async (id: string, order: number) => {
    try {
      setLoading(true);
      const updated = await departmentsApi.updateOrder(id, order);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      toast.success('Order updated successfully');
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update order';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign manager
  const assignManager = useCallback(async (id: string, managerId: string, updated_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentsApi.assignManager(id, managerId, updated_by);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      const successMsg = 'Manager assigned successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to assign manager';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Remove manager
  const removeManager = useCallback(async (id: string, updated_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentsApi.removeManager(id, updated_by);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      const successMsg = 'Manager removed successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove manager';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Update status
  const updateStatus = useCallback(async (id: string, status: DepartmentStatus, updated_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentsApi.updateStatus(id, status, updated_by);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      const successMsg = `Department ${status.toLowerCase()} successfully`;
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update status';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Archive department
  const archiveDepartment = useCallback(async (id: string, updated_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentsApi.archive(id, updated_by);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      const successMsg = 'Department archived successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to archive department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Activate department
  const activateDepartment = useCallback(async (id: string, updated_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updated = await departmentsApi.activate(id, updated_by);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => d._id === id ? updated : d));
      
      const successMsg = 'Department activated successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return updated;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to activate department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Search departments
  const searchDepartments = useCallback(async (tenantId: string, query: string) => {
    try {
      setLoading(true);
      const results = await departmentsApi.search(tenantId, query);
      return results;
    } catch (err: any) {
      const errorMsg = err.message || 'Search failed';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get by manager
  const getByManager = useCallback(async (managerId: string) => {
    try {
      setLoading(true);
      const depts = await departmentsApi.getByManager(managerId);
      return depts;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load departments';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get by status
  const getByStatus = useCallback(async (tenantId: string, status: DepartmentStatus) => {
    try {
      setLoading(true);
      const depts = await departmentsApi.getByStatus(tenantId, status);
      return depts;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load departments';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clone department
  const cloneDepartment = useCallback(async (id: string, newCode: string, newName?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const cloned = await departmentsApi.clone(id, newCode, newName);
      
      // Optimistic update
      setDepartments(prev => [...prev, cloned]);
      
      const successMsg = 'Department cloned successfully';
      onSuccess?.(successMsg);
      toast.success(successMsg);
      
      return cloned;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to clone department';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Bulk update status
  const bulkUpdateStatus = useCallback(async (ids: string[], status: DepartmentStatus, updated_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await departmentsApi.bulkUpdateStatus(ids, status, updated_by);
      
      // Optimistic update
      setDepartments(prev => prev.map(d => 
        ids.includes(d._id) ? { ...d, status } : d
      ));
      
      const successMsg = `${ids.length} departments updated successfully`;
      onSuccess?.(successMsg);
      toast.success(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to bulk update';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Bulk delete
  const bulkDelete = useCallback(async (ids: string[], deleted_by?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await departmentsApi.bulkDelete(ids, deleted_by);
      
      // Optimistic update
      setDepartments(prev => prev.filter(d => !ids.includes(d._id)));
      
      const successMsg = `${ids.length} departments deleted successfully`;
      onSuccess?.(successMsg);
      toast.success(successMsg);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to bulk delete';
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Refresh data
  const refresh = useCallback(async () => {
    if (loadAsTree && filters?.tenant_id) {
      return loadTree(filters.tenant_id);
    } else if (filters) {
      return loadDepartments(filters);
    }
  }, [loadAsTree, filters, loadTree, loadDepartments]);

  return {
    // State
    departments,
    tree,
    loading,
    error,
    stats,
    
    // CRUD Operations
    loadDepartments,
    loadTree,
    loadStats,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    hardDeleteDepartment,
    restoreDepartment,
    getDepartmentById,
    
    // Tree Operations
    getRootDepartments,
    getChildren,
    getHierarchy,
    getDescendants,
    moveDepartment,
    updateOrder,
    
    // Manager Operations
    assignManager,
    removeManager,
    
    // Status Operations
    updateStatus,
    archiveDepartment,
    activateDepartment,
    
    // Query Operations
    searchDepartments,
    getByManager,
    getByStatus,
    
    // Bulk Operations
    bulkUpdateStatus,
    bulkDelete,
    
    // Utility
    cloneDepartment,
    refresh,
  };
}

export default useDepartments;
