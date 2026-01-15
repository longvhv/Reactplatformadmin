/**
 * Dashboard Recent Activities Component
 * Displays recent system activities with timeline layout
 */

import { useLanguage } from '@/providers/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserPlus, 
  Building2, 
  CreditCard, 
  ShoppingCart,
  Bell,
  Settings,
  LucideIcon
} from 'lucide-react';
import type { Activity } from '@/services/dashboardService';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS, ja, ko, es, zhCN } from 'date-fns/locale';

interface RecentActivitiesProps {
  activities: Activity[];
  loading?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  UserPlus,
  Building2,
  CreditCard,
  ShoppingCart,
  Bell,
  Settings,
};

const localeMap: Record<string, Locale> = {
  vi,
  en: enUS,
  ja,
  ko,
  es,
  zh: zhCN,
};

export function RecentActivitiesList({ activities, loading }: RecentActivitiesProps) {
  const { t, language } = useLanguage();
  const locale = localeMap[language] || enUS;

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {t('dashboard.recentActivities')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.recentActivitiesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('dashboard.noRecentActivities')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {t('dashboard.recentActivities')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.recentActivitiesDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = iconMap[activity.icon] || Bell;
            
            return (
              <div 
                key={activity._id} 
                className="flex gap-4 items-start group hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className={`p-2 rounded-full ${activity.color.replace('text-', 'bg-')}/10 shrink-0`}>
                  <Icon className={`h-4 w-4 ${activity.color}`} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none mb-1">
                    {t(activity.title)}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true,
                      locale 
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
