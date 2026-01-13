/**
 * Tenants Management Page
 * Enhanced with hierarchical structure and new database schema
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, LayoutGrid, Network, List, Eye 
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TenantTreeView } from '@/components/tenants/TenantTreeView';
import { TenantDetailView } from '@/components/tenants/TenantDetailView';
import type { Tenant, TenantStatus, TenantTier, DataRegion } from '@/data/tenants';
import { mockTenants } from '@/data/tenants';
import { tenantsService } from '@/services/tenants-service';
import { isRootTenant } from '@/utils/tenant-utils';

export default function TenantsManagementPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>(mockTenants);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedTenantChildren, setSelectedTenantChildren] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'tree' | 'list'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<TenantTier | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<DataRegion | 'all'>('all');
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'root' | 'children'>('all');

  // Statistics
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'ACTIVE').length,
    trial: tenants.filter(t => t.status === 'TRIAL').length,
    enterprise: tenants.filter(t => t.tier === 'ENTERPRISE').length,
    partners: tenants.filter(t => t.tier.startsWith('PARTNER_')).length,
    rootTenants: tenants.filter(t => isRootTenant(t)).length,
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...tenants];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.code.toLowerCase().includes(query) ||
          t.profile.billing_email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(t => t.tier === tierFilter);
    }

    // Region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(t => t.data_region === regionFilter);
    }

    // Hierarchy filter
    if (hierarchyFilter === 'root') {
      filtered = filtered.filter(t => isRootTenant(t));
    } else if (hierarchyFilter === 'children') {
      filtered = filtered.filter(t => !isRootTenant(t));
    }

    setFilteredTenants(filtered);
  }, [tenants, searchQuery, statusFilter, tierFilter, regionFilter, hierarchyFilter]);

  // Load children when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      const children = tenants.filter(t => t.parent_tenant_id === selectedTenant._id);
      setSelectedTenantChildren(children);
    } else {
      setSelectedTenantChildren([]);
    }
  }, [selectedTenant, tenants]);

  // Load tenants (in real app, from API)
  const loadTenants = async () => {
    setLoading(true);
    try {
      // const data = await tenantsService.listTenants();
      // setTenants(data.data);
      setTenants(mockTenants);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleCreateTenant = () => {
    navigate('/core/tenants/new');
  };

  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm(t('tenants.confirmDelete'))) return;

    try {
      // await tenantsService.deleteTenant(id);
      setTenants(tenants.filter(t => t._id !== id));
      if (selectedTenant?._id === id) {
        setSelectedTenant(null);
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      alert('Failed to delete tenant');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTierFilter('all');
    setRegionFilter('all');
    setHierarchyFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">
                {t('tenants.title') || 'Tenant Management'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('tenants.subtitle') || 'Manage organizations and hierarchical structure'}
              </p>
            </div>
            <Button onClick={handleCreateTenant} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('tenants.addTenant') || 'Add Tenant'}
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.trial}</div>
                <p className="text-xs text-muted-foreground">Trial</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-600">{stats.enterprise}</div>
                <p className="text-xs text-muted-foreground">Enterprise</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-teal-600">{stats.partners}</div>
                <p className="text-xs text-muted-foreground">Partners</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-indigo-600">{stats.rootTenants}</div>
                <p className="text-xs text-muted-foreground">Root Tenants</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
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

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                <SelectItem value="PARTNER_BASIC">Partner Basic</SelectItem>
                <SelectItem value="PARTNER_PREMIUM">Partner Premium</SelectItem>
                <SelectItem value="PARTNER_ELITE">Partner Elite</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={(v) => setRegionFilter(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="ap-southeast-1">🌏 Singapore</SelectItem>
                <SelectItem value="us-east-1">🇺🇸 Virginia</SelectItem>
                <SelectItem value="eu-central-1">🇪🇺 Frankfurt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hierarchyFilter} onValueChange={(v) => setHierarchyFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Hierarchy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="root">Root Only</SelectItem>
                <SelectItem value="children">Children Only</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>

            {/* View Mode Toggle */}
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

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTenants.length} of {tenants.length} tenants
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-6 pb-6">
        {viewMode === 'tree' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tree View */}
            <div className="lg:col-span-1">
              <TenantTreeView
                tenants={filteredTenants}
                onSelectTenant={handleSelectTenant}
                selectedTenantId={selectedTenant?._id}
              />
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2">
              {selectedTenant ? (
                <TenantDetailView
                  tenant={selectedTenant}
                  parentTenant={
                    selectedTenant.parent_tenant_id
                      ? tenants.find(t => t._id === selectedTenant.parent_tenant_id)
                      : null
                  }
                  childrenCount={selectedTenantChildren.length}
                />
              ) : (
                <Card className="p-12 text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Select a tenant from the tree to view details
                  </p>
                </Card>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTenants.map((tenant) => (
              <Card key={tenant._id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectTenant(tenant)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{tenant.name}</CardTitle>
                      <CardDescription className="font-mono">/{tenant.code}</CardDescription>
                    </div>
                    <Badge className={`${tenant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-500'} text-white`}>
                      {tenant.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tier:</span>
                      <span className="font-medium">{tenant.tier}</span>
                    </div>
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
        ) : (
          <div className="space-y-2">
            {filteredTenants.map((tenant) => (
              <Card key={tenant._id} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectTenant(tenant)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold">{tenant.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">/{tenant.code}</div>
                    <Badge className={`${tenant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-500'} text-white text-xs`}>
                      {tenant.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{tenant.tier}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{tenant.data_region}</span>
                    <span>{tenant.settings.current_users}/{tenant.settings.max_users} users</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredTenants.length === 0 && (
          <Card className="p-12 text-center">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tenants found matching your filters</p>
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Clear filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}