/**
 * Tenant Analytics Dashboard Component
 * 
 * Displays tenant metrics and analytics
 */

import { useEffect, useState } from 'react';
import { Building2, Users, DollarSign, TrendingUp, HardDrive, Activity } from 'lucide-react';
import { getTenantAnalytics, TenantAnalytics } from '../../api/tenantApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { subscriptionTierColors } from '../../data/tenants';

export function TenantAnalyticsDashboard() {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getTenantAnalytics();
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-xl border border-border/40 p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: t('tenants.analytics.totalTenants'),
      value: analytics.totalTenants,
      icon: Building2,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      title: t('tenants.analytics.activeTenants'),
      value: analytics.activeTenants,
      icon: Activity,
      color: 'bg-emerald-500',
      iconBg: 'bg-emerald-500/10',
      subtitle: `${Math.round((analytics.activeTenants / analytics.totalTenants) * 100)}% ${t('tenants.analytics.active')}`,
    },
    {
      title: t('tenants.analytics.mrr'),
      value: `$${analytics.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
      iconBg: 'bg-indigo-500/10',
      subtitle: `ARR: $${analytics.arr.toLocaleString()}`,
    },
    {
      title: t('tenants.analytics.avgUsers'),
      value: Math.round(analytics.averageUsersPerTenant),
      icon: Users,
      color: 'bg-purple-500',
      iconBg: 'bg-purple-500/10',
      subtitle: t('tenants.analytics.perTenant'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-card rounded-xl border border-border/40 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Breakdown */}
      <div className="bg-card rounded-xl border border-border/40 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t('tenants.analytics.subscriptionBreakdown')}</h3>
            <p className="text-sm text-muted-foreground">{t('tenants.analytics.byTier')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.subscriptionBreakdown).map(([tier, count]) => (
            <div key={tier} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{t(`tenants.tier.${tier}`)}</span>
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${subscriptionTierColors[tier as keyof typeof subscriptionTierColors]}`}
                  style={{ width: `${(count / analytics.totalTenants) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((count / analytics.totalTenants) * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <p className="font-semibold">{t('tenants.analytics.trialTenants')}</p>
          </div>
          <p className="text-3xl font-bold">{analytics.trialTenants}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round((analytics.trialTenants / analytics.totalTenants) * 100)}% {t('tenants.analytics.ofTotal')}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Building2 className="w-5 h-5 text-red-500" />
            </div>
            <p className="font-semibold">{t('tenants.analytics.suspendedTenants')}</p>
          </div>
          <p className="text-3xl font-bold">{analytics.suspendedTenants}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round((analytics.suspendedTenants / analytics.totalTenants) * 100)}% {t('tenants.analytics.ofTotal')}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <HardDrive className="w-5 h-5 text-cyan-500" />
            </div>
            <p className="font-semibold">{t('tenants.analytics.totalStorage')}</p>
          </div>
          <p className="text-3xl font-bold">{analytics.totalStorageUsed.toFixed(1)} GB</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('tenants.analytics.acrossAllTenants')}
          </p>
        </div>
      </div>
    </div>
  );
}
