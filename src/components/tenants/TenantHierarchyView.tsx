import { useMemo } from "react";
import { ChevronRight, Building2, Users, Database } from "lucide-react";
import { useNavigate } from "react-router";
import { useLanguage } from "@/providers/LanguageProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Tenant, 
  tenantStatusColors, 
  tenantTierColors 
} from "@/data/tenants";

interface TenantHierarchyViewProps {
  tenants: Tenant[];
}

interface TenantNode {
  tenant: Tenant;
  children: TenantNode[];
  level: number;
}

export function TenantHierarchyView({ tenants }: TenantHierarchyViewProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Build hierarchy tree from flat array
  const tenantTree = useMemo(() => {
    const buildTree = (parentId: string | null, level: number = 0): TenantNode[] => {
      return tenants
        .filter(t => t.parent_tenant_id === parentId)
        .map(tenant => ({
          tenant,
          children: buildTree(tenant._id, level + 1),
          level,
        }))
        .sort((a, b) => a.tenant.name.localeCompare(b.tenant.name));
    };

    return buildTree(null);
  }, [tenants]);

  const renderTenantNode = (node: TenantNode) => {
    const hasChildren = node.children.length > 0;
    const indentLevel = node.level * 24;

    return (
      <div key={node.tenant._id} style={{ marginLeft: `${indentLevel}px` }}>
        <Collapsible defaultOpen={node.level === 0}>
          <div className="group flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">
            {hasChildren ? (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="w-6 h-6">
                  <ChevronRight className="w-4 h-4 transition-transform ui-state-open:rotate-90" />
                </Button>
              </CollapsibleTrigger>
            ) : (
              <div className="w-6" />
            )}

            <div 
              className="flex-1 flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/core/tenants/${node.tenant._id}`)}
            >
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Building2 className="w-4 h-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{node.tenant.name}</span>
                  <Badge className={tenantStatusColors[node.tenant.status]} size="sm">
                    {node.tenant.status}
                  </Badge>
                  <Badge variant="outline" className={tenantTierColors[node.tenant.tier]} size="sm">
                    {node.tenant.tier}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="font-mono">/{node.tenant.code}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {node.tenant.settings?.current_users || 0} / {node.tenant.settings?.max_users || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    {node.tenant.settings?.current_storage || 0} GB
                  </span>
                </div>
              </div>

              {hasChildren && (
                <Badge variant="secondary" className="shrink-0">
                  {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
                </Badge>
              )}
            </div>
          </div>

          {hasChildren && (
            <CollapsibleContent className="space-y-1">
              {node.children.map(child => renderTenantNode(child))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  const totalTenants = tenants.length;
  const rootTenants = tenantTree.length;
  const childTenants = totalTenants - rootTenants;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("tenants.hierarchyView")}</span>
          <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground">
            <span>{rootTenants} root</span>
            <span>{childTenants} children</span>
            <span>{totalTenants} total</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tenantTree.length > 0 ? (
          <div className="space-y-1">
            {tenantTree.map(node => renderTenantNode(node))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t("tenants.noTenants")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}