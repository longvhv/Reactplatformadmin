import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogIn, User, Shield, Settings } from 'lucide-react';
import type { ProfileActivity } from '@/services/profileApi';

interface RecentActivityProps {
  activities: ProfileActivity[];
}

const iconMap = {
  auth: LogIn,
  profile: User,
  security: Shield,
  settings: Settings,
};

const colorMap = {
  auth: 'bg-blue-500/10 text-blue-600',
  profile: 'bg-green-500/10 text-green-600',
  security: 'bg-red-500/10 text-red-600',
  settings: 'bg-purple-500/10 text-purple-600',
};

const badgeColorMap = {
  auth: 'bg-blue-500',
  profile: 'bg-green-500',
  security: 'bg-red-500',
  settings: 'bg-purple-500',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type];
            const colorClass = colorMap[activity.type];
            const badgeColor = badgeColorMap[activity.type];

            return (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
                <Badge 
                  className={`${badgeColor} hover:${badgeColor} text-white capitalize`}
                >
                  {activity.type}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
