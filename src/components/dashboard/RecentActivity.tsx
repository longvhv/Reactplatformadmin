import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { User, Settings, FileText, Activity } from 'lucide-react';
import { CHART_COLORS } from '../../constants/chartColors';

// Color map for activity types using design tokens
const colorMap = {
  user: 'bg-primary/10 text-primary',
  system: 'bg-blue/10 text-blue',
  document: 'bg-accent/10 text-accent',
  activity: 'bg-success/10 text-success',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
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
      </CardHeader>
    </Card>
  );
}