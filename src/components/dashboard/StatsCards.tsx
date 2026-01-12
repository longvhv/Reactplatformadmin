import { useLanguage } from '@/providers/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon
} from 'lucide-react';
import type { Stat } from '@/services/dashboardApi';

interface StatsCardsProps {
  stats: Stat[];
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Activity,
  TrendingUp,
  Bell,
};

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon] || Users;
        return (
          <Card key={stat.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t(stat.title)}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                <span className="ml-1">{t('dashboard.fromLastMonth')}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
