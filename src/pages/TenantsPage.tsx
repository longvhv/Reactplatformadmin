/**
 * TenantsPage Component
 * Main tenant management page with hooks - Under 400 lines
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, LayoutGrid, Network, List, Building2 } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenants } from '@/hooks/useTenants';
import { useTenantTree } from '@/hooks/useTenantTree';
import { TenantFilters } from '@/components/tenants/TenantFilters';
import { TenantOverviewStats } from '@/components/tenants/TenantOverviewStats';
import { TenantTreeView } from '@/components/tenants/TenantTreeView';
import { TenantDetailView } from '@/components/tenants/TenantDetailView';
import { TenantGrid } from '@/components/tenants/TenantGrid';
import { TenantList } from '@/components/tenants/TenantList';
import { isRootTenant } from '@/utils/tenant-utils';
import { toast } from 'sonner';
import type { TenantStatus, TenantTier, DataRegion } from '@/data/tenants';

type ViewMode = 'grid' | 'tree' | 'list';

export default function TenantsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<TenantTier | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<DataRegion | 'all'>('all');
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'root' | 'children'>('all');

  // Hooks
  const { tenants, loading, error, deleteTenant } = useTenants({ autoLoad: true });
  const {
    tree,
    selectedTenant,
    selectTenant,
    getChildren,
  } = useTenantTree(tenants);

  // Apply filters
  const filteredTenants = tenants.filter(tenant => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matches = 
        tenant.name.toLowerCase().includes(query) ||
        tenant.code.toLowerCase().includes(query) ||
        tenant.profile.billing_email?.toLowerCase().includes(query);
      if (!matches) return false;
    }

    // Status
    if (statusFilter !== 'all' && tenant.status !== statusFilter) return false;

    // Tier
    if (tierFilter !== 'all' && tenant.tier !== tierFilter) return false;

    // Region
    if (regionFilter !== 'all' && tenant.data_region !== regionFilter) return false;

    // Hierarchy
    if (hierarchyFilter === 'root' && !isRootTenant(tenant)) return false;
    if (hierarchyFilter === 'children' && isRootTenant(tenant)) return false;

    return true;
  });

  // Stats
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'ACTIVE').length,
    trial: tenants.filter(t => t.status === 'TRIAL').length,
    enterprise: tenants.filter(t => t.tier === 'ENTERPRISE').length,
    partners: tenants.filter(t => t.tier?.startsWith('PARTNER_')).length,
    rootTenants: tenants.filter(t => isRootTenant(t)).length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('tenants.confirmDelete'))) return;
    try {
      await deleteTenant(id);
      toast.success(t('tenants.deleteSuccess'));
    } catch (err) {
      toast.error(t('tenants.deleteError'));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTierFilter('all');
    setRegionFilter('all');
    setHierarchyFilter('all');
  };

  const handleAddTenant = () => {
    navigate('/core/tenants/add');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - NOT sticky anymore */}
      <div className="border-b border-border bg-card">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-foreground">
                  {t('tenants.title') || 'Tenant Management'}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('tenants.subtitle') || 'Manage organizations and hierarchical structure'}
              </p>
            </div>
            <Button onClick={handleAddTenant} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('tenants.addTenant') || 'Add Tenant'}
            </Button>
          </div>

          {/* Collapsible Stats */}
          <TenantOverviewStats stats={stats} />
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1920px] mx-auto px-6 py-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('tenants.searchPlaceholder') || 'Search tenants...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-2">
            <TenantFilters
              statusFilter={statusFilter}
              tierFilter={tierFilter}
              regionFilter={regionFilter}
              hierarchyFilter={hierarchyFilter}
              onStatusChange={setStatusFilter}
              onTierChange={setTierFilter}
              onRegionChange={setRegionFilter}
              onHierarchyChange={setHierarchyFilter}
              onClear={clearFilters}
            />

            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('tree')}
              >
                <Network className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filteredTenants.length} of {tenants.length} tenants
        </p>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-6 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground mt-4">Loading tenants...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : viewMode === 'tree' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <TenantTreeView
                tenants={filteredTenants}
                onSelectTenant={selectTenant}
                selectedTenantId={selectedTenant?._id}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedTenant ? (
                <TenantDetailView
                  tenant={selectedTenant}
                  parentTenant={
                    selectedTenant.parent_tenant_id
                      ? tenants.find(t => t._id === selectedTenant.parent_tenant_id)
                      : null
                  }
                  childrenCount={getChildren(selectedTenant._id).length}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Select a tenant to view details
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <TenantGrid tenants={filteredTenants} onDelete={handleDelete} onSelect={selectTenant} />
        ) : (
          <TenantList tenants={filteredTenants} onDelete={handleDelete} onSelect={selectTenant} />
        )}
      </div>
    </div>
  );
}