/**
 * Dashboard Overview Stats Cards Component
 * Displays key metrics in a modern card grid layout
 */

import { useLanguage } from '../../providers/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Users, 
  Building2, 
  CreditCard, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  LucideIcon
} from 'lucide-react';
import type { DashboardStats } from '../../services/dashboardService';

interface OverviewStatsProps {
  stats: DashboardStats[];
  loading?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Building2,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
};

export function OverviewStats({ stats, loading }: OverviewStatsProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-10 w-10 bg-muted rounded-lg" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-4 w-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.icon] || Users;
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
        const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600';

        return (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(stat.label)}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2.5} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stat.value}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                <span className={`text-sm font-medium ${trendColor}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {t('dashboard.fromLastMonth')}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
