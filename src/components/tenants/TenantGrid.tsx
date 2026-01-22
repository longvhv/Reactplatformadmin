/**
 * TenantGrid Component
 * Grid view for tenants
 */

import { Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { Tenant } from '../../data/tenants';
import { tenantStatusColors, tenantTierColors } from '../../utils/tenant-utils';

interface TenantGridProps {
  tenants: Tenant[];
  onDelete: (id: string) => void;
  onSelect: (tenant: Tenant) => void;
}

export function TenantGrid({ tenants, onDelete, onSelect }: TenantGridProps) {
  const navigate = useNavigate();

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tenants found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tenants.map((tenant) => (
        <Card 
          key={tenant._id} 
          className="group hover:shadow-lg transition-all cursor-pointer"
          onClick={() => navigate(`/admin/tenants/${tenant._id}`)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="hover:text-primary transition-colors">{tenant.name}</CardTitle>
                <CardDescription className="font-mono">/{tenant.code}</CardDescription>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/tenants/edit/${tenant._id}`);
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
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={tenantStatusColors[tenant.status]}>{tenant.status}</Badge>
              <Badge variant="outline" className={tenantTierColors[tenant.tier]}>{tenant.tier}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Region:</span>
                <span className="font-medium">{tenant.data_region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Users:</span>
                <span className="font-medium">
                  {tenant.settings.current_users} / {tenant.settings.max_users}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}