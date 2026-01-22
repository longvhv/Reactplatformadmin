'use client';

/**
 * TenantGrid Component
 * Grid view for tenants
 */

import { Edit, Trash2 } from 'lucide-react';
import { useRouter } from '../shim/next-navigation';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import type { Tenant } from '../../api/tenantsApi';
import { tenantStatusColors, tenantTierColors } from '../../utils/tenant-utils';

interface TenantGridProps {
  tenants: Tenant[];
  onDelete: (id: string) => void;
  onSelect: (tenant: Tenant) => void;
}

export function TenantGrid({ tenants, onDelete, onSelect }: TenantGridProps) {
  const router = useRouter();

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tenants found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tenants.map((tenant) => {
         // Safe parse settings
         const settings = typeof tenant.settings === 'string' 
         ? JSON.parse(tenant.settings) 
         : tenant.settings || {};

         return (
        <Card 
          key={tenant._id} 
          className="group hover:shadow-lg transition-all cursor-pointer"
          onClick={() => router.push(`/admin/tenants/${tenant._id}`)}
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
                    router.push(`/admin/tenants/${tenant._id}/edit`);
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
              <Badge className={tenantStatusColors[tenant.status] || 'bg-gray-100'}>{tenant.status}</Badge>
              <Badge variant="outline" className={tenantTierColors[tenant.tier] || 'border-gray-200'}>{tenant.tier}</Badge>
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
                  {settings.current_users || 0} / {settings.max_users || '∞'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )})}
    </div>
  );
}
