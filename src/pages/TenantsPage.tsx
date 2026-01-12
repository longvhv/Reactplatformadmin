/**
 * Tenants Management Page
 * 
 * Multi-tenant SaaS management dashboard
 * Features: Tenant CRUD, Analytics, Subscription Plans, Billing
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Plus, Filter, BarChart3, CreditCard, Package } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TenantCard } from '../components/tenants/TenantCard';
import { SubscriptionPlanCard } from '../components/tenants/SubscriptionPlanCard';
import { TenantAnalyticsDashboard } from '../components/tenants/TenantAnalyticsDashboard';
import { Tenant, TenantStatus } from '../data/tenants';
import { subscriptionPlans } from '../data/subscription-plans';
import { getAllTenants, deleteTenant } from '../api/tenantApi';

export function TenantsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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
      setTenants(tenants.filter(t => t.id !== id));
    }
  };

  const filteredTenants = useMemo(() => {
    let filtered = tenants;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.billingEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [tenants, statusFilter, searchQuery]);

  const statusOptions: { value: TenantStatus | 'all'; label: string }[] = [
    { value: 'all', label: t('tenants.allStatus') },
    { value: 'active', label: t('tenants.status.active') },
    { value: 'trial', label: t('tenants.status.trial') },
    { value: 'suspended', label: t('tenants.status.suspended') },
    { value: 'cancelled', label: t('tenants.status.cancelled') },
  ];

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
            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Add Tenant Button */}
              <Button className="gap-2" onClick={() => navigate('/tenants/add')}>
                <Plus className="w-4 h-4" />
                {t('tenants.addTenant')}
              </Button>
            </div>

            {/* Tenants List */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-card rounded-xl border border-border/40 p-6 animate-pulse">
                    <div className="h-48 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : filteredTenants.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTenants.map((tenant) => (
                  <TenantCard
                    key={tenant.id}
                    tenant={tenant}
                    onDelete={handleDeleteTenant}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
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
            {/* Billing Cycle Toggle */}
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

            {/* Plans Grid */}
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
            <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('tenants.billingComingSoon')}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}