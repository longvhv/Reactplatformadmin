import { useLanguage } from '@/providers/LanguageProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, User, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Activity } from '@/services/dashboardApi';

interface RecentActivityProps {
  activities: Activity[];
}

const iconMap = {
  user: User,
  system: RefreshCw,
  alert: AlertTriangle,
  update: Bell,
};

const colorMap = {
  user: 'bg-[#6366f1]/10 text-[#6366f1]',
  system: 'bg-[#3b82f6]/10 text-[#3b82f6]',
  alert: 'bg-[#f59e0b]/10 text-[#f59e0b]',
  update: 'bg-[#10b981]/10 text-[#10b981]',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  const { t } = useLanguage();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
        <CardDescription>
          {t('dashboard.recentActivityDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = iconMap[activity.type];
            const colorClass = colorMap[activity.type];

            return (
              <div
                key={activity.id}
                className={`flex items-start space-x-4 ${
                  index !== activities.length - 1 ? 'pb-4 border-b' : ''
                }`}
              >
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
