/**
 * Tenant Tree View Component
 * Visualizes hierarchical tenant structure using materialized path
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Network } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { Tenant } from '../../data/tenants';
import { 
  getHierarchyDepth, 
  isRootTenant, 
  tenantStatusColors, 
  tenantTierColors 
} from '../../utils/tenant-utils';

interface TenantNode extends Tenant {
  children?: TenantNode[];
}

interface TenantTreeViewProps {
  tenants: Tenant[];
  onSelectTenant?: (tenant: Tenant) => void;
  selectedTenantId?: string;
}

export function TenantTreeView({ tenants, onSelectTenant, selectedTenantId }: TenantTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Build tree structure
  const buildTree = (tenants: Tenant[]): TenantNode[] => {
    const map = new Map<string, TenantNode>();
    const roots: TenantNode[] = [];

    // Create map
    tenants.forEach(tenant => {
      map.set(tenant._id, { ...tenant, children: [] });
    });

    // Build hierarchy
    tenants.forEach(tenant => {
      const node = map.get(tenant._id)!;
      if (tenant.parent_tenant_id && map.has(tenant.parent_tenant_id)) {
        const parent = map.get(tenant.parent_tenant_id)!;
        parent.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const tree = buildTree(tenants);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderNode = (node: TenantNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node._id);
    const isSelected = node._id === selectedTenantId;

    return (
      <div key={node._id}>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer
            transition-colors duration-150
            ${isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/50'}
          `}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => onSelectTenant?.(node)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node._id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`p-1.5 rounded ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
              {hasChildren ? (
                <Network className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{node.name}</span>
                <Badge className={`${tenantStatusColors[node.status]} text-xs px-1.5 py-0`}>
                  {node.status}
                </Badge>
                <Badge variant="outline" className={`${tenantTierColors[node.tier]} text-xs px-1.5 py-0`}>
                  {node.tier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {node.code}
              </p>
            </div>

            {hasChildren && (
              <Badge variant="secondary" className="text-xs">
                {node.children?.length}
              </Badge>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children?.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (tree.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Network className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No tenants found</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-1">
        {tree.map(node => renderNode(node))}
      </div>
    </Card>
  );
}