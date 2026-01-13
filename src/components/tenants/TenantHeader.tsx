import { Building2, Crown, ArrowLeft, Settings, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

interface TenantHeaderProps {
  tenant: {
    id: string;
    name: string;
    domain: string;
    tier: string;
    status: string;
    logo?: string;
  };
}

export function TenantHeader({ tenant }: TenantHeaderProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const statusColors = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    trial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    suspended: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const tierColors = {
    starter: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    professional: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tenants")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {tenant.logo ? (
                <img src={tenant.logo} alt={tenant.name} className="w-full h-full rounded-lg object-cover" />
              ) : (
                <Building2 className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {tenant.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[tenant.status as keyof typeof statusColors]}`}>
                  {t(`tenants.status.${tenant.status}`)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${tierColors[tenant.tier as keyof typeof tierColors]}`}>
                  {tenant.tier === 'enterprise' && <Crown className="w-3 h-3" />}
                  {t(`tenants.tier.${tenant.tier}`)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tenant.domain}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate(`/core/tenants/edit/${tenant.id}`)}
            >
              <Settings className="w-4 h-4" />
              {t("tenants.editTenant")}
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}