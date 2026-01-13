/**
 * Tenant Detail View Component
 * Comprehensive view of all tenant information
 */

import { 
  Building2, Globe, Mail, Phone, MapPin, Clock, Shield, 
  Database, Users, CreditCard, Calendar, Settings, Network,
  TrendingUp, CheckCircle2, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Tenant } from '@/data/tenants';
import { 
  tenantStatusColors, 
  tenantTierColors, 
  complianceLevelColors,
  dataRegionColors,
  dataRegionNames,
  tierNames,
  statusNames,
  formatRelativeDate,
  formatStorage,
  calculateUsagePercentage,
  getUsageColor,
  getUsageBarColor,
  getFeatureDisplayNames,
  isRootTenant,
  getHierarchyDepth
} from '@/utils/tenant-utils';

interface TenantDetailViewProps {
  tenant: Tenant;
  parentTenant?: Tenant | null;
  childrenCount?: number;
}

export function TenantDetailView({ tenant, parentTenant, childrenCount = 0 }: TenantDetailViewProps) {
  const userPercentage = calculateUsagePercentage(
    tenant.settings.current_users,
    tenant.settings.max_users
  );
  
  const storagePercentage = calculateUsagePercentage(
    tenant.settings.current_storage,
    tenant.settings.max_storage
  );

  const depth = getHierarchyDepth(tenant);
  const isRoot = isRootTenant(tenant);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{tenant.name}</h2>
                <p className="text-muted-foreground font-mono">/{tenant.code}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={tenantStatusColors[tenant.status]}>
                    {statusNames[tenant.status]}
                  </Badge>
                  <Badge variant="outline" className={tenantTierColors[tenant.tier]}>
                    {tierNames[tenant.tier]}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              <p>Created {formatRelativeDate(tenant.created_at)}</p>
              <p>Updated {formatRelativeDate(tenant.updated_at)}</p>
              <p className="text-xs">v{tenant.version}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Infrastructure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Infrastructure & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data Region</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={dataRegionColors[tenant.data_region]}>
                  {dataRegionNames[tenant.data_region]}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Compliance Level</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={complianceLevelColors[tenant.compliance_level]}>
                  <Shield className="w-3 h-3 mr-1" />
                  {tenant.compliance_level}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Timezone</label>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{tenant.timezone}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Billing Type</label>
              <div className="flex items-center gap-2 mt-1">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span>{tenant.billing_type}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy */}
      {(parentTenant || childrenCount > 0 || !isRoot) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Organizational Hierarchy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Hierarchy Depth:</span>
              <Badge variant="outline">{depth}</Badge>
            </div>
            
            {parentTenant && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Parent Tenant</label>
                <div className="flex items-center gap-2 mt-1 p-2 border rounded-md">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{parentTenant.name}</span>
                  <span className="text-sm text-muted-foreground font-mono">/{parentTenant.code}</span>
                </div>
              </div>
            )}

            {isRoot && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Root Tenant (No Parent)</span>
              </div>
            )}

            {childrenCount > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Child Tenants</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{childrenCount} children</Badge>
                </div>
              </div>
            )}

            {tenant.path && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Materialized Path</label>
                <code className="block mt-1 p-2 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  {tenant.path}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenant.profile.billing_email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Billing Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${tenant.profile.billing_email}`} className="text-primary hover:underline">
                    {tenant.profile.billing_email}
                  </a>
                </div>
              </div>
            )}

            {tenant.profile.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{tenant.profile.phone}</span>
                </div>
              </div>
            )}

            {tenant.profile.contact_person && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{tenant.profile.contact_person}</span>
                </div>
              </div>
            )}

            {tenant.profile.domain && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Custom Domain</label>
                <div className="flex items-center gap-2 mt-1">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a href={`https://${tenant.profile.domain}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {tenant.profile.domain}
                  </a>
                </div>
              </div>
            )}

            {tenant.profile.country && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{tenant.profile.country}</span>
                </div>
              </div>
            )}

            {tenant.profile.industry && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Industry</label>
                <div className="flex items-center gap-2 mt-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span>{tenant.profile.industry}</span>
                </div>
              </div>
            )}
          </div>

          {tenant.profile.address && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="mt-1 text-sm">{tenant.profile.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Resource Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Users */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Users</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(userPercentage)}`}>
                {tenant.settings.current_users} / {tenant.settings.max_users}
              </span>
            </div>
            <Progress value={userPercentage} className="h-2" />
          </div>

          {/* Storage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Storage</span>
              </div>
              <span className={`text-sm font-medium ${getUsageColor(storagePercentage)}`}>
                {formatStorage(tenant.settings.current_storage)} / {formatStorage(tenant.settings.max_storage)}
              </span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </div>

          {tenant.settings.subscription_end_date && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Subscription Ends</span>
                </div>
                <span className="text-sm">
                  {new Date(tenant.settings.subscription_end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Features & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Feature Flags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Enabled Features</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {getFeatureDisplayNames(tenant.settings.features).map((feature, idx) => (
                <Badge key={idx} variant="secondary">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {feature}
                </Badge>
              ))}
              {tenant.settings.features.length === 0 && (
                <span className="text-sm text-muted-foreground">No features enabled</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Security Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">MFA Enforced</span>
              {tenant.settings.mfa_enforced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">SSO Enabled</span>
              {tenant.settings.sso_enabled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Custom Branding</span>
              {tenant.settings.custom_branding ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">API Access</span>
              {tenant.settings.api_access ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
