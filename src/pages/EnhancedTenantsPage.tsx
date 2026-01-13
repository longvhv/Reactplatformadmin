import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, Plus, Filter, BarChart3, CreditCard, 
  Package, Network, Shield, MapPin, X 
} from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { EnhancedTenantCard } from '../components/tenants/EnhancedTenantCard';
import { SubscriptionPlanCard } from '../components/tenants/SubscriptionPlanCard';
import { TenantAnalyticsDashboard } from '../components/tenants/TenantAnalyticsDashboard';
import { 
  Tenant, TenantStatus, TenantTier, DataRegion, 
  ComplianceLevel, BillingType 
} from '../data/tenants';
import { subscriptionPlans } from '../data/subscription-plans';
import { getAllTenants, deleteTenant } from '../api/tenantApi';

export function EnhancedTenantsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Advanced filters
  const [filters, setFilters] = useState({
    status: 'all' as TenantStatus | 'all',
    tier: 'all' as TenantTier | 'all',
    data_region: 'all' as DataRegion | 'all',
    compliance_level: 'all' as ComplianceLevel | 'all',
    billing_type: 'all' as BillingType | 'all',
    has_parent: 'all' as 'all' | 'yes' | 'no',
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await getAllTenants();
      setTenants(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm(t('tenants.confirmDelete'))) return;
    
    const success = await deleteTenant(id);
    if (success) {
      setTenants(tenants.filter(t => t._id !== id));
    }
  };

  const filteredTenants = useMemo(() => {
    let filtered = tenants;

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Tier filter
    if (filters.tier !== 'all') {
      filtered = filtered.filter(t => t.tier === filters.tier);
    }

    // Region filter
    if (filters.data_region !== 'all') {
      filtered = filtered.filter(t => t.data_region === filters.data_region);
    }

    // Compliance filter
    if (filters.compliance_level !== 'all') {
      filtered = filtered.filter(t => t.compliance_level === filters.compliance_level);
    }

    // Billing type filter
    if (filters.billing_type !== 'all') {
      filtered = filtered.filter(t => t.billing_type === filters.billing_type);
    }

    // Hierarchy filter
    if (filters.has_parent === 'yes') {
      filtered = filtered.filter(t => t.parent_tenant_id !== null);
    } else if (filters.has_parent === 'no') {
      filtered = filtered.filter(t => t.parent_tenant_id === null);
    }

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.profile?.billing_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [tenants, filters, searchQuery]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length;

  const clearFilters = () => {
    setFilters({
      status: 'all',
      tier: 'all',
      data_region: 'all',
      compliance_level: 'all',
      billing_type: 'all',
      has_parent: 'all',
    });
  };

  const statsData = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter(t => t.status === 'ACTIVE').length;
    const trial = tenants.filter(t => t.status === 'TRIAL').length;
    const enterprise = tenants.filter(t => t.tier === 'ENTERPRISE').length;

    return { total, active, trial, enterprise };
  }, [tenants]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('tenants.title')}</h1>
              <p className="text-muted-foreground">{t('tenants.subtitle')}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold">{statsData.total}</div>
              <div className="text-sm text-muted-foreground">{t('tenants.totalTenants')}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{statsData.active}</div>
              <div className="text-sm text-muted-foreground">{t('tenants.activeTenants')}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{statsData.trial}</div>
              <div className="text-sm text-muted-foreground">{t('tenants.trialTenants')}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{statsData.enterprise}</div>
              <div className="text-sm text-muted-foreground">{t('tenants.enterpriseTenants')}</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('tenants.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="tenants" className="gap-2">
              <Building2 className="w-4 h-4" />
              {t('tenants.tenantsTab')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {t('tenants.analyticsTab')}
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Package className="w-4 h-4" />
              {t('tenants.plansTab')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="w-4 h-4" />
              {t('tenants.billingTab')}
            </TabsTrigger>
          </TabsList>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-6">
            {/* Advanced Filters */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{t('tenants.filters')}</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary">{activeFiltersCount}</Badge>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="w-4 h-4" />
                    {t('tenants.clearFilters')}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tenants.statusLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tenants.allStatus')}</SelectItem>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.tier} onValueChange={(v) => setFilters({ ...filters, tier: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tenants.tier')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tenants.allTiers')}</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    <SelectItem value="PARTNER_BASIC">Partner Basic</SelectItem>
                    <SelectItem value="PARTNER_PREMIUM">Partner Premium</SelectItem>
                    <SelectItem value="PARTNER_ELITE">Partner Elite</SelectItem>
                    <SelectItem value="PROVIDER">Provider</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.data_region} onValueChange={(v) => setFilters({ ...filters, data_region: v as any })}>
                  <SelectTrigger className="gap-2">
                    <MapPin className="w-4 h-4" />
                    <SelectValue placeholder={t('tenants.region')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tenants.allRegions')}</SelectItem>
                    <SelectItem value="ap-southeast-1">🌏 Asia Pacific</SelectItem>
                    <SelectItem value="us-east-1">🇺🇸 US East</SelectItem>
                    <SelectItem value="eu-central-1">🇪🇺 EU Central</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.compliance_level} onValueChange={(v) => setFilters({ ...filters, compliance_level: v as any })}>
                  <SelectTrigger className="gap-2">
                    <Shield className="w-4 h-4" />
                    <SelectValue placeholder={t('tenants.compliance')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tenants.allCompliance')}</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="GDPR">GDPR</SelectItem>
                    <SelectItem value="HIPAA">HIPAA</SelectItem>
                    <SelectItem value="PCI-DSS">PCI-DSS</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.billing_type} onValueChange={(v) => setFilters({ ...filters, billing_type: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('tenants.billing')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tenants.allBilling')}</SelectItem>
                    <SelectItem value="PREPAID">Prepaid</SelectItem>
                    <SelectItem value="POSTPAID">Postpaid</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.has_parent} onValueChange={(v) => setFilters({ ...filters, has_parent: v as any })}>
                  <SelectTrigger className="gap-2">
                    <Network className="w-4 h-4" />
                    <SelectValue placeholder={t('tenants.hierarchy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tenants.allHierarchy')}</SelectItem>
                    <SelectItem value="yes">{t('tenants.childTenants')}</SelectItem>
                    <SelectItem value="no">{t('tenants.rootTenants')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('tenants.showing')} {filteredTenants.length} / {tenants.length}
              </div>
              <Button className="gap-2" onClick={() => navigate('/core/tenants/add')}>
                <Plus className="w-4 h-4" />
                {t('tenants.addTenant')}
              </Button>
            </div>

            {/* Tenants List */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
                    <div className="h-48 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : filteredTenants.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTenants.map((tenant) => (
                  <EnhancedTenantCard
                    key={tenant._id}
                    tenant={tenant}
                    onDelete={handleDeleteTenant}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('tenants.noResults')}</p>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <TenantAnalyticsDashboard />
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'outline'}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('tenants.monthly')}
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'outline'}
                onClick={() => setBillingCycle('yearly')}
              >
                {t('tenants.yearly')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subscriptionPlans.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                />
              ))}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('tenants.billingComingSoon')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}