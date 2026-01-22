/**
 * TenantOverview Component
 * Display tenant information overview with real data
 * Updated to use actual Tenant type from database schema
 */

import { 
  Building2, Globe, MapPin, Shield, CreditCard, Calendar, 
  Users, Database, Activity, Code, Package, TrendingUp 
} from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";
import type { Tenant } from "../../data/tenants";

interface TenantOverviewProps {
  tenant: Tenant;
}

export function TenantOverview({ tenant }: TenantOverviewProps) {
  const { t } = useLanguage();

  // Format date
  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Stats cards
  const stats = [
    {
      label: t("tenants.currentUsers") || "Current Users",
      value: tenant.settings?.current_users || 0,
      max: tenant.settings?.max_users || 0,
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      label: t("tenants.storageUsed") || "Storage Used",
      value: `${tenant.settings?.current_storage || 0} GB`,
      max: `${tenant.settings?.max_storage || 0} GB`,
      icon: Database,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: t("tenants.status") || "Status",
      value: tenant.status,
      icon: Activity,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: t("tenants.tier") || "Tier",
      value: tenant.tier,
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
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
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold">
                  {stat.value}
                </p>
                {stat.max && (
                  <p className="text-xs text-muted-foreground">
                    of {stat.max}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Basic Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {t("tenants.basicInformation") || "Basic Information"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label={t("tenants.name") || "Name"} value={tenant.name} />
          <InfoItem label={t("tenants.code") || "Code"} value={tenant.code} />
          <InfoItem 
            label={t("tenants.domain") || "Domain"} 
            value={tenant.profile?.domain || 'N/A'} 
            icon={Globe}
          />
          <InfoItem 
            label={t("tenants.billingEmail") || "Billing Email"} 
            value={tenant.profile?.billing_email || 'N/A'} 
          />
          <InfoItem 
            label={t("tenants.phone") || "Phone"} 
            value={tenant.profile?.phone || 'N/A'} 
          />
          <InfoItem 
            label={t("tenants.contactPerson") || "Contact Person"} 
            value={tenant.profile?.contact_person || 'N/A'} 
          />
        </div>
      </div>

      {/* Infrastructure */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {t("tenants.infrastructure") || "Infrastructure"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem 
            label={t("tenants.dataRegion") || "Data Region"} 
            value={tenant.data_region}
            icon={MapPin}
          />
          <InfoItem 
            label={t("tenants.complianceLevel") || "Compliance Level"} 
            value={tenant.compliance_level}
            icon={Shield}
          />
          <InfoItem 
            label={t("tenants.timezone") || "Timezone"} 
            value={tenant.timezone}
          />
          <InfoItem 
            label={t("tenants.billingType") || "Billing Type"} 
            value={tenant.billing_type}
            icon={CreditCard}
          />
        </div>
      </div>

      {/* Features & Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Code className="w-5 h-5" />
          {t("tenants.features") || "Features"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {tenant.settings?.mfa_enforced && (
            <Badge>MFA Enforced</Badge>
          )}
          {tenant.settings?.sso_enabled && (
            <Badge>SSO Enabled</Badge>
          )}
          {tenant.settings?.custom_branding && (
            <Badge>Custom Branding</Badge>
          )}
          {tenant.settings?.api_access && (
            <Badge>API Access</Badge>
          )}
          {tenant.settings?.features?.map((feature) => (
            <Badge key={feature}>{feature}</Badge>
          ))}
          {(!tenant.settings?.features || tenant.settings.features.length === 0) && 
           !tenant.settings?.mfa_enforced && !tenant.settings?.sso_enabled && 
           !tenant.settings?.custom_branding && !tenant.settings?.api_access && (
            <span className="text-sm text-muted-foreground">No additional features enabled</span>
          )}
        </div>
      </div>

      {/* Audit Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t("tenants.auditInfo") || "Audit Information"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem 
            label={t("tenants.createdAt") || "Created At"} 
            value={formatDate(tenant.created_at)}
          />
          <InfoItem 
            label={t("tenants.updatedAt") || "Updated At"} 
            value={formatDate(tenant.updated_at)}
          />
          <InfoItem 
            label={t("tenants.version") || "Version"} 
            value={tenant.version.toString()}
          />
          <InfoItem 
            label={t("tenants.path") || "Hierarchy Path"} 
            value={tenant.path || '/'}
          />
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying info items
function InfoItem({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  icon?: any;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

// Helper component for feature badges
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {children}
    </span>
  );
}