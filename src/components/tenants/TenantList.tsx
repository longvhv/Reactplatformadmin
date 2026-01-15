/**
 * TenantList Component
 * List view for tenants
 */

import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Tenant } from '@/data/tenants';
import { tenantStatusColors, tenantTierColors } from '@/utils/tenant-utils';

interface TenantListProps {
  tenants: Tenant[];
  onDelete: (id: string) => void;
  onSelect: (tenant: Tenant) => void;
}

export function TenantList({ tenants, onDelete, onSelect }: TenantListProps) {
  const navigate = useNavigate();

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tenants found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tenants.map((tenant) => (
        <Card
          key={tenant._id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => navigate(`/core/tenants/${tenant._id}`)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="font-semibold min-w-[200px] hover:text-primary transition-colors">{tenant.name}</div>
              <div className="text-sm text-muted-foreground font-mono">/{tenant.code}</div>
              <Badge className={`${tenantStatusColors[tenant.status]} text-xs`}>
                {tenant.status}
              </Badge>
              <Badge variant="outline" className={`${tenantTierColors[tenant.tier]} text-xs`}>
                {tenant.tier}
              </Badge>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground">{tenant.data_region}</span>
              <span className="text-sm text-muted-foreground">
                {tenant.settings.current_users}/{tenant.settings.max_users} users
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/core/tenants/edit/${tenant._id}`);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(tenant._id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}