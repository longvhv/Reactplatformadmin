import { UserPlus, Settings, CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface ActivityItem {
  id: string;
  type: string;
  user: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface TenantActivityProps {
  tenantId: string;
}

export function TenantActivity({ tenantId }: TenantActivityProps) {
  const { t } = useLanguage();

  // Mock data - in real app, fetch from API
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "user.added",
      user: "Admin",
      action: "Added new user: Jane Smith",
      timestamp: "2024-01-08T10:30:00Z",
    },
    {
      id: "2",
      type: "settings.updated",
      user: "John Doe",
      action: "Updated tenant settings",
      timestamp: "2024-01-08T09:15:00Z",
    },
    {
      id: "3",
      type: "billing.payment",
      user: "System",
      action: "Payment processed successfully",
      timestamp: "2024-01-07T14:20:00Z",
      metadata: { amount: "$99.00" },
    },
    {
      id: "4",
      type: "user.removed",
      user: "Admin",
      action: "Removed user: Bob Wilson",
      timestamp: "2024-01-07T11:45:00Z",
    },
    {
      id: "5",
      type: "settings.updated",
      user: "Jane Smith",
      action: "Changed notification preferences",
      timestamp: "2024-01-06T16:30:00Z",
    },
  ];

  const getActivityIcon = (type: string) => {
    const icons = {
      "user.added": UserPlus,
      "user.removed": UserPlus,
      "settings.updated": Settings,
      "billing.payment": CreditCard,
      "error": AlertCircle,
      "success": CheckCircle,
    };
    return icons[type as keyof typeof icons] || Clock;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      "user.added": "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
      "user.removed": "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
      "settings.updated": "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
      "billing.payment": "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
      "error": "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
      "success": "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    };
    return colors[type as keyof typeof colors] || "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("time.justNow");
    if (diffInSeconds < 3600) return t("time.minutesAgo", { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t("time.hoursAgo", { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 2592000) return t("time.daysAgo", { count: Math.floor(diffInSeconds / 86400) });
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("tenants.activityLog")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("tenants.activityLogDescription")}
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClasses = getActivityColor(activity.type);

          return (
            <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${colorClasses} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.user}
                    </p>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                  {activity.metadata && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span key={key} className="inline-block mr-3">
                          <span className="font-medium">{key}:</span> {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          {t("tenants.noActivityYet")}
        </div>
      )}
    </div>
  );
}
