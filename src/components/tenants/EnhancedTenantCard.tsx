import { useNavigate } from "react-router";
import { 
  Building2, Edit, Trash2, ExternalLink, Users, Database, 
  Shield, MapPin, CreditCard, Calendar, Network 
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  Tenant, 
  tenantStatusColors, 
  tenantTierColors, 
  complianceLevelColors,
  dataRegionColors,
  billingTypeColors
} from "@/data/tenants";

interface EnhancedTenantCardProps {
  tenant: Tenant;
  onDelete: (id: string) => void;
  showHierarchy?: boolean;
}

export function EnhancedTenantCard({ tenant, onDelete, showHierarchy = true }: EnhancedTenantCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const userPercentage = tenant.settings?.max_users 
    ? (tenant.settings.current_users || 0) / tenant.settings.max_users * 100 
    : 0;

  const storagePercentage = tenant.settings?.max_storage 
    ? (tenant.settings.current_storage || 0) / tenant.settings.max_storage * 100 
    : 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{tenant.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">/{tenant.code}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/core/tenants/${tenant._id}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/core/tenants/edit/${tenant._id}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(tenant._id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status & Tier Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={tenantStatusColors[tenant.status]}>
            {tenant.status}
          </Badge>
          <Badge variant="outline" className={tenantTierColors[tenant.tier]}>
            {tenant.tier}
          </Badge>
          <Badge variant="outline" className={complianceLevelColors[tenant.compliance_level]}>
            <Shield className="w-3 h-3 mr-1" />
            {tenant.compliance_level}
          </Badge>
          <Badge variant="outline" className={dataRegionColors[tenant.data_region]}>
            <MapPin className="w-3 h-3 mr-1" />
            {tenant.data_region}
          </Badge>
          <Badge variant="outline" className={billingTypeColors[tenant.billing_type]}>
            <CreditCard className="w-3 h-3 mr-1" />
            {tenant.billing_type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Info */}
        {tenant.profile?.billing_email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="text-xs">📧</div>
            <span className="truncate">{tenant.profile.billing_email}</span>
          </div>
        )}

        {/* Hierarchy Indicator */}
        {showHierarchy && tenant.parent_tenant_id && (
          <div className="flex items-center gap-2 text-sm">
            <Network className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("tenants.hasParent")}</span>
          </div>
        )}

        {/* Usage Metrics */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                {t("tenants.users")}
              </span>
              <span className="font-medium">
                {tenant.settings?.current_users || 0} / {tenant.settings?.max_users || 0}
              </span>
            </div>
            <Progress value={userPercentage} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Database className="w-4 h-4" />
                {t("tenants.storage")}
              </span>
              <span className="font-medium">
                {tenant.settings?.current_storage || 0} / {tenant.settings?.max_storage || 0} GB
              </span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </div>
        </div>

        {/* Features */}
        {tenant.settings?.features && tenant.settings.features.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
            {tenant.settings.features.slice(0, 3).map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {tenant.settings.features.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tenant.settings.features.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>
            {t("tenants.created")}: {new Date(tenant.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}