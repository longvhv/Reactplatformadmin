'use client';

import { useLanguage } from '@/providers/LanguageProvider';
import { NavigationTest } from '@/components/common/NavigationTest';
import { useDashboardData } from '@/hooks/useDashboardData';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { stats, activities, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.welcome')}</h1>
        <p className="text-muted-foreground mt-2">BasicSoftTemplate</p>
      </div>

      {/* Navigation Debug Component */}
      <NavigationTest />

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Recent Activity */}
      <RecentActivity activities={activities} />
    </div>
  );
}