/**
 * TenantsPage Component
 * Main tenant management page with hooks - Under 400 lines
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ UPDATED 2026-01-15: Unified statistics design
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Plus, Search, LayoutGrid, Network, List, Building2, CheckCircle, Clock, Crown, Handshake, Users } from 'lucide-react';
import { useLanguage } from '../../../../providers/LanguageProvider';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { useTenants } from '../../../../hooks/useTenants';
import { useTenantTree } from '../../../../hooks/useTenantTree';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { TenantTreeView } from '../../../../components/tenants/TenantTreeView';
import { TenantFilters } from '../../../../components/tenants/TenantFilters';
import { TenantDetailView } from '../../../../components/tenants/TenantDetailView';
import { TenantGrid } from '../../../../components/tenants/TenantGrid';
import { TenantList } from '../../../../components/tenants/TenantList';
import { isRootTenant } from '../../../../utils/tenant-utils';
import { showToast } from '../../../../lib/toast';
import type { TenantStatus, TenantTier, DataRegion } from '../../../../data/tenants';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

type ViewMode = 'grid' | 'tree' | 'list';

function TenantsPage() {
  const { t } = useLanguage();
  const router = useRouter();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<TenantTier | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<DataRegion | 'all'>('all');
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'root' | 'children'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTenant(deleteId);
      showToast.success('Xóa thành công', t('tenants.deleteSuccess'));
    } catch (err) {
      showToast.error('Lỗi', t('tenants.deleteError'));
    } finally {
      setDeleteId(null);
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
    router.push('/admin/tenants/create');
  };

  const statCards = [
    { label: 'Total Tenants', value: stats.total, color: 'indigo' as const, icon: Building2 },
    { label: 'Active', value: stats.active, color: 'green' as const, icon: CheckCircle },
    { label: 'Trial', value: stats.trial, color: 'yellow' as const, icon: Clock },
    { label: 'Enterprise', value: stats.enterprise, color: 'purple' as const, icon: Crown },
    { label: 'Partners', value: stats.partners, color: 'blue' as const, icon: Handshake },
    { label: 'Root Tenants', value: stats.rootTenants, color: 'gray' as const, icon: Users },
  ];

  return (
    <>
      <PageLayout
        icon={Building2}
        title={t('tenants.title') || 'Tenant Management'}
        description={t('tenants.subtitle') || 'Manage organizations and hierarchical structure'}
        actions={
          <Button onClick={handleAddTenant} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {t('tenants.addTenant') || 'Add Tenant'}
          </Button>
        }
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  stat.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600' :
                  stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' :
                  stat.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' :
                  stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600' :
                  stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-600'
                }`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters & Search */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
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
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground mt-4">Loading tenants...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-6">
            <div className="text-center py-12 text-destructive">{error}</div>
          </Card>
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
                <Card className="p-6">
                  <div className="text-center py-12 text-muted-foreground">
                    Select a tenant to view details
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <TenantGrid tenants={filteredTenants} onDelete={handleDeleteClick} onSelect={selectTenant} />
        ) : (
          <TenantList tenants={filteredTenants} onDelete={handleDeleteClick} onSelect={selectTenant} />
        )}
      </PageLayout>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={t('tenants.deleteTitle') || 'Xóa Tenant'}
        description={t('tenants.confirmDelete') || 'Bạn có chắc chắn muốn xóa tenant này không?'}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </>
  );
}

// Named export for reuse
export { TenantsPage };

// Default export for routing
export default TenantsPage;