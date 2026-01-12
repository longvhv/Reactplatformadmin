import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "@/providers/LanguageProvider";
import { TenantHeader } from "@/components/tenants/TenantHeader";
import { TenantOverview } from "@/components/tenants/TenantOverview";
import { TenantUsers } from "@/components/tenants/TenantUsers";
import { TenantActivity } from "@/components/tenants/TenantActivity";

type TabType = "overview" | "users" | "activity" | "settings";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenantData();
  }, [id]);

  const loadTenantData = () => {
    // Mock data - in real app, fetch from API
    // GET /api/tenants/:id
    const mockTenant = {
      id: id || "1",
      name: "Acme Corporation",
      domain: "acme.example.com",
      tier: "enterprise",
      status: "active",
      users: 142,
      storage: "45.2 GB",
      plan: "Enterprise Plan",
      billingCycle: "Yearly",
      createdAt: "2023-06-15T00:00:00Z",
      lastActive: "2024-01-08T10:30:00Z",
      monthlyRevenue: 2499,
      apiCalls: 45230,
    };

    // Simulate API call
    setTimeout(() => {
      setTenant(mockTenant);
      setLoading(false);
    }, 300);
  };

  const tabs = [
    { id: "overview", label: t("tenants.overviewTab") },
    { id: "users", label: t("tenants.usersTab") },
    { id: "activity", label: t("tenants.activityTab") },
    { id: "settings", label: t("tenants.settingsTab") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">{t("errors.notFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TenantHeader tenant={tenant} />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-6">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "overview" && <TenantOverview tenant={tenant} />}
        {activeTab === "users" && <TenantUsers tenantId={tenant.id} />}
        {activeTab === "activity" && <TenantActivity tenantId={tenant.id} />}
        {activeTab === "settings" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t("tenants.settingsComingSoon")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
