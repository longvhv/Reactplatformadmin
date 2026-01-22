/**
 * TenantList Component
 * List view for tenants
 * ✅ OPTIMIZED: Virtual scrolling for 100+ tenants, safe JSON parsing
 */

import { Edit, Trash2, Users, HardDrive } from 'lucide-react';
import { useRouter } from '../../shim/next-navigation';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import type { Tenant } from '../../api/tenantsApi';
import { VirtualList } from '../VirtualList';

interface TenantListProps {
  tenants: Tenant[];
  onDelete: (id: string) => void;
  onSelect: (tenant: Tenant) => void;
}

export function TenantList({ tenants, onDelete, onSelect }: TenantListProps) {
  const router = useRouter();

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-white rounded-lg border border-dashed">
        <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="font-medium">No tenants found</p>
        <p className="text-sm">Get started by adding a new tenant.</p>
      </div>
    );
  }

  // ✅ Use virtual scrolling for large datasets
  const useVirtualScrolling = tenants.length > 50;
  const ROW_HEIGHT = 88; // Height of each tenant card

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
      case 'TRIAL': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE': return 'border-gray-200 text-gray-600';
      case 'PRO': return 'border-blue-200 text-blue-700 bg-blue-50';
      case 'ENTERPRISE': return 'border-purple-200 text-purple-700 bg-purple-50';
      case 'PARTNER_ELITE': return 'border-amber-200 text-amber-700 bg-amber-50';
      case 'PROVIDER': return 'border-indigo-200 text-indigo-700 bg-indigo-50';
      default: return 'border-gray-200 text-gray-600';
    }
  };

  const renderTenantRow = (tenant: Tenant) => {
    // Safe parse settings
    const settings = typeof tenant.settings === 'string' 
      ? JSON.parse(tenant.settings) 
      : tenant.settings || {};

    return (
      <Card
        key={tenant._id}
        className="p-4 hover:shadow-md transition-all cursor-pointer group mb-2 border-l-4 border-l-transparent hover:border-l-indigo-500"
        onClick={() => router.push(`/admin/tenants/${tenant._id}`)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="min-w-[200px] truncate">
              <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {tenant.name}
              </div>
              <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded">{tenant.code}</span>
                {tenant.parent_tenant_id && (
                  <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">Child</span>
                )}
                {tenant.partner_tenant_id && (
                  <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Partner</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${getStatusColor(tenant.status)} border`}>
                {tenant.status}
              </Badge>
              <Badge variant="outline" className={`${getTierColor(tenant.tier)} border`}>
                {tenant.tier}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 hidden md:flex">
            <div className="flex items-center gap-1.5 w-24" title="Data Region">
              <span className="uppercase text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                {tenant.data_region?.split('-')[0] || 'UNK'}
              </span>
            </div>
            
            <div className="flex items-center gap-4 w-40">
              <div className="flex items-center gap-1.5" title="Users">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {settings.current_users || 0}/{settings.max_users || '∞'}
                </span>
              </div>
              <div className="flex items-center gap-1.5" title="Storage">
                <HardDrive className="w-3.5 h-3.5" />
                <span>
                  {settings.current_storage || 0}/{settings.max_storage || '∞'} GB
                </span>
              </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-20 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
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
                className="h-8 w-8 text-destructive hover:bg-red-50 hover:text-red-600"
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
    );
  };

  // Virtual scrolling for large datasets
  if (useVirtualScrolling) {
    return (
      <div className="h-[calc(100vh-250px)] min-h-[500px]">
        <VirtualList
          items={tenants}
          itemHeight={ROW_HEIGHT}
          renderItem={renderTenantRow}
          overscan={5}
        />
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Showing {tenants.length} tenants • Virtual scrolling active
        </div>
      </div>
    );
  }

  // Standard rendering for small datasets
  return (
    <div className="space-y-2 pb-10">
      {tenants.map(renderTenantRow)}
    </div>
  );
}
