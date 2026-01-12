import { Users, Database, CreditCard, Calendar, TrendingUp, Activity } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface TenantOverviewProps {
  tenant: {
    id: string;
    name: string;
    users: number;
    storage: string;
    plan: string;
    billingCycle: string;
    createdAt: string;
    lastActive: string;
    monthlyRevenue: number;
    apiCalls: number;
  };
}

export function TenantOverview({ tenant }: TenantOverviewProps) {
  const { t } = useLanguage();

  const stats = [
    {
      label: t("tenants.totalUsers"),
      value: tenant.users.toLocaleString(),
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      change: "+12%",
      trend: "up",
    },
    {
      label: t("tenants.storageUsed"),
      value: tenant.storage,
      icon: Database,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      change: "+8%",
      trend: "up",
    },
    {
      label: t("tenants.monthlyRevenue"),
      value: `$${tenant.monthlyRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      change: "+23%",
      trend: "up",
    },
    {
      label: t("tenants.apiCalls"),
      value: tenant.apiCalls.toLocaleString(),
      icon: Activity,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      change: "+45%",
      trend: "up",
    },
  ];

  const details = [
    { label: t("tenants.plan"), value: tenant.plan },
    { label: t("tenants.billingCycle"), value: tenant.billingCycle },
    { label: t("tenants.createdAt"), value: new Date(tenant.createdAt).toLocaleDateString() },
    { label: t("tenants.lastActive"), value: new Date(tenant.lastActive).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("tenants.details")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.map((detail, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {detail.label}
              </span>
              <span className="text-sm text-gray-900 dark:text-white font-medium">
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Chart Placeholder */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("tenants.usageOverTime")}
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-600">
          {t("tenants.chartComingSoon")}
        </div>
      </div>
    </div>
  );
}
