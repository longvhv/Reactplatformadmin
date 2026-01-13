/**
 * useTenantTree Hook
 * Manages hierarchical tenant tree structure
 * Optimized with memoization and efficient tree building
 */

import { useMemo, useState, useCallback } from 'react';
import type { Tenant } from '@/data/tenants';

export interface TenantNode extends Tenant {
  children?: TenantNode[];
  depth?: number;
  hasChildren?: boolean;
}

export interface UseTenantTreeReturn {
  tree: TenantNode[];
  flattenedTree: Array<TenantNode & { depth: number }>;
  expandedIds: Set<string>;
  selectedId: string | null;
  selectedTenant: Tenant | null;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  selectTenant: (id: string | null) => void;
  getChildren: (parentId: string) => Tenant[];
  getDescendants: (tenant: Tenant) => Tenant[];
  getParent: (tenant: Tenant) => Tenant | null;
  getAncestors: (tenant: Tenant) => Tenant[];
  isExpanded: (id: string) => boolean;
  isSelected: (id: string) => boolean;
}

export function useTenantTree(tenants: Tenant[]): UseTenantTreeReturn {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /**
   * Build hierarchical tree structure
   * Optimized with Map for O(1) lookups
   */
  const tree = useMemo(() => {
    if (!tenants.length) return [];

    const map = new Map<string, TenantNode>();
    const roots: TenantNode[] = [];

    // First pass: Create all nodes
    tenants.forEach(tenant => {
      map.set(tenant._id, { ...tenant, children: [], hasChildren: false });
    });

    // Second pass: Build hierarchy
    tenants.forEach(tenant => {
      const node = map.get(tenant._id)!;
      
      if (tenant.parent_tenant_id && map.has(tenant.parent_tenant_id)) {
        const parent = map.get(tenant.parent_tenant_id)!;
        parent.children?.push(node);
        parent.hasChildren = true;
      } else {
        // Root tenant (no parent or parent not in list)
        roots.push(node);
      }
    });

    // Sort children by name
    const sortChildren = (nodes: TenantNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => {
        if (node.children?.length) {
          sortChildren(node.children);
        }
      });
    };
    sortChildren(roots);

    return roots;
  }, [tenants]);

  /**
   * Flatten tree for rendering with depth information
   */
  const flattenedTree = useMemo(() => {
    const result: Array<TenantNode & { depth: number }> = [];

    const traverse = (nodes: TenantNode[], depth = 0) => {
      nodes.forEach(node => {
        result.push({ ...node, depth });
        
        // Only traverse children if node is expanded
        if (node.children?.length && expandedIds.has(node._id)) {
          traverse(node.children, depth + 1);
        }
      });
    };

    traverse(tree);
    return result;
  }, [tree, expandedIds]);

  /**
   * Toggle expand/collapse for a node
   */
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Expand all nodes
   */
  const expandAll = useCallback(() => {
    const allIds = new Set(tenants.map(t => t._id));
    setExpandedIds(allIds);
  }, [tenants]);

  /**
   * Collapse all nodes
   */
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  /**
   * Select a tenant
   */
  const selectTenant = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  /**
   * Get direct children of a tenant
   */
  const getChildren = useCallback((parentId: string): Tenant[] => {
    return tenants.filter(t => t.parent_tenant_id === parentId);
  }, [tenants]);

  /**
   * Get all descendants of a tenant (recursive)
   */
  const getDescendants = useCallback((tenant: Tenant): Tenant[] => {
    if (!tenant.path) return [];
    return tenants.filter(
      t => t.path?.startsWith(tenant.path!) && t._id !== tenant._id
    );
  }, [tenants]);

  /**
   * Get parent tenant
   */
  const getParent = useCallback((tenant: Tenant): Tenant | null => {
    if (!tenant.parent_tenant_id) return null;
    return tenants.find(t => t._id === tenant.parent_tenant_id) || null;
  }, [tenants]);

  /**
   * Get all ancestors of a tenant (from parent to root)
   */
  const getAncestors = useCallback((tenant: Tenant): Tenant[] => {
    const ancestors: Tenant[] = [];
    let current = tenant;

    while (current.parent_tenant_id) {
      const parent = tenants.find(t => t._id === current.parent_tenant_id);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
    }

    return ancestors;
  }, [tenants]);

  /**
   * Check if a tenant is expanded
   */
  const isExpanded = useCallback((id: string): boolean => {
    return expandedIds.has(id);
  }, [expandedIds]);

  /**
   * Check if a tenant is selected
   */
  const isSelected = useCallback((id: string): boolean => {
    return selectedId === id;
  }, [selectedId]);

  /**
   * Get currently selected tenant
   */
  const selectedTenant = useMemo(
    () => (selectedId ? tenants.find(t => t._id === selectedId) || null : null),
    [selectedId, tenants]
  );

  return {
    tree,
    flattenedTree,
    expandedIds,
    selectedId,
    selectedTenant,
    toggleExpand,
    expandAll,
    collapseAll,
    selectTenant,
    getChildren,
    getDescendants,
    getParent,
    getAncestors,
    isExpanded,
    isSelected,
  };
}
