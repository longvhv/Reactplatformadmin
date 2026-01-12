/**
 * Activity Section Component
 * Recent activity and statistics
 */

import { Card } from "../ui/card";
import type { Activity } from "../../types/profile";

interface ActivitySectionProps {
  activities: Activity[];
}

export function ActivitySection({ activities }: ActivitySectionProps) {
  const activityStats = [
    { label: "Tác vụ hoàn thành", value: "156" },
    { label: "Dự án tham gia", value: "24" },
    { label: "Code reviews", value: "89" },
    { label: "Commits", value: "320" },
  ];

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Hoạt động gần đây</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Lịch sử hoạt động của bạn trên hệ thống
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
            >
              <div>
                <p className="font-medium text-sm">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.project}</p>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h3 className="font-semibold mb-4">Thống kê hoạt động</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {activityStats.map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
