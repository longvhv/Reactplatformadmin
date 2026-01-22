/**
 * TenantDetailView Component
 * Displays comprehensive tenant details including profile, settings, and infrastructure
 * ✅ Aligned with tenants table schema and EnhancedTenantForm
 */

import { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Shield, 
  CreditCard,
  Calendar,
  Settings,
  GitBranch,
  Clock,
  Database,
  Mail,
  Phone,
  User,
  Briefcase,
  Handshake,
  HardDrive,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import type { Tenant } from '../../api/tenantsApi';
import { useLanguage } from '../../providers/LanguageProvider';

interface TenantDetailViewProps {
  tenant: Tenant;
}

export function TenantDetailView({ tenant }: TenantDetailViewProps) {
  const { t } = useLanguage();
  const [showRawData, setShowRawData] = useState(false);

  // Parse JSONB fields (handle both string and object)
  const profile = typeof tenant.profile === 'string' 
    ? JSON.parse(tenant.profile) 
    : tenant.profile || {};
  
  const settings = typeof tenant.settings === 'string'
    ? JSON.parse(tenant.settings)
    : tenant.settings || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'TRIAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE': return 'border-gray-300 text-gray-700';
      case 'PRO': return 'border-blue-300 text-blue-700 bg-blue-50';
      case 'ENTERPRISE': return 'border-purple-300 text-purple-700 bg-purple-50';
      case 'PARTNER_ELITE': return 'border-amber-300 text-amber-700 bg-amber-50';
      default: return 'border-gray-300 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('tenants.overview') || 'Tenant Overview'}</h2>
        <p className="text-sm text-gray-500">
          {t('tenants.overviewDescription') || 'Detailed information and configuration of the tenant'}
        </p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base">{t('tenants.basicInformation') || 'Basic Information'}</CardTitle>
              <CardDescription>{t('tenants.identityAndStatus') || 'Identity and status'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.name') || 'Tenant Name'}</label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.code') || 'Code (Subdomain)'}</label>
              <p className="text-sm font-mono font-semibold text-gray-900 mt-1 bg-gray-50 inline-block px-2 py-0.5 rounded">
                {tenant.code}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.tier') || 'Tier'}</label>
              <div className="mt-1">
                <Badge variant="outline" className={`font-semibold ${getTierColor(tenant.tier)}`}>
                  {tenant.tier}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.status') || 'Status'}</label>
              <div className="mt-1">
                <Badge variant="outline" className={getStatusColor(tenant.status)}>
                  {tenant.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure & Compliance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">{t('tenants.infrastructure') || 'Infrastructure & Compliance'}</CardTitle>
              <CardDescription>{t('tenants.regionAndCompliance') || 'Data region and compliance requirements'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t('tenants.dataRegion') || 'Data Region'}
              </label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.data_region}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {t('tenants.complianceLevel') || 'Compliance Level'}
              </label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.compliance_level}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {t('tenants.billingType') || 'Billing Type'}
              </label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.billing_type}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t('tenants.timezone') || 'Timezone'}
              </label>
              <p className="text-sm font-semibold text-gray-900 mt-1">{tenant.timezone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      {Object.keys(profile).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Briefcase className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">{t('tenants.profile') || 'Profile Information'}</CardTitle>
                <CardDescription>{t('tenants.contactAndBusiness') || 'Contact and business details'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.billing_email && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {t('tenants.billingEmail') || 'Billing Email'}
                  </label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{profile.billing_email}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {t('tenants.phone') || 'Phone'}
                  </label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{profile.phone}</p>
                </div>
              )}
              {profile.domain && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {t('tenants.domain') || 'Domain'}
                  </label>
                  <a 
                    href={`https://${profile.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-indigo-600 hover:underline mt-1 block"
                  >
                    {profile.domain}
                  </a>
                </div>
              )}
              {profile.contact_person && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {t('tenants.contactPerson') || 'Contact Person'}
                  </label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{profile.contact_person}</p>
                </div>
              )}
              {profile.tax_id && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.taxId') || 'Tax ID'}</label>
                  <p className="text-sm font-mono font-semibold text-gray-900 mt-1">{profile.tax_id}</p>
                </div>
              )}
              {profile.industry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.industry') || 'Industry'}</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{profile.industry}</p>
                </div>
              )}
              {profile.company_size && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.companySize') || 'Company Size'}</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{profile.company_size}</p>
                </div>
              )}
              {profile.country && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.country') || 'Country'}</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{profile.country}</p>
                </div>
              )}
              {profile.address && (
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t('tenants.address') || 'Address'}
                  </label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{profile.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarchy */}
      {(tenant.parent_tenant_id || tenant.partner_tenant_id) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <GitBranch className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">{t('tenants.hierarchy') || 'Hierarchy'}</CardTitle>
                <CardDescription>{t('tenants.relationships') || 'Parent and partner relationships'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenant.parent_tenant_id && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.parentTenant') || 'Parent Tenant ID'}</label>
                  <p className="text-sm font-mono font-semibold text-gray-900 mt-1">
                    {tenant.parent_tenant_id}
                  </p>
                  {tenant.path && (
                    <div className="mt-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.path') || 'Path'}</label>
                      <p className="text-xs font-mono text-gray-600 mt-1 bg-gray-50 p-1.5 rounded border border-gray-100">{tenant.path}</p>
                    </div>
                  )}
                </div>
              )}
              
              {tenant.partner_tenant_id && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Handshake className="w-3 h-3" />
                    {t('tenants.partnerTenant') || 'Partner Tenant ID'}
                  </label>
                  <p className="text-sm font-mono font-semibold text-gray-900 mt-1">
                    {tenant.partner_tenant_id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings & Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">{t('tenants.systemConfiguration') || 'System Configuration'}</CardTitle>
                <CardDescription>{t('tenants.settingsAndFeatures') || 'Settings and features'}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
              className="text-xs"
            >
              <Database className="w-3 h-3 mr-1.5" />
              {showRawData ? (t('common.hideJson') || 'Hide JSON') : (t('common.viewJson') || 'View JSON')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showRawData ? (
            <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96 font-mono text-gray-700">
              {JSON.stringify(settings, null, 2)}
            </pre>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t('tenants.users') || 'Users'}
                  </label>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-gray-900">{settings.current_users || 0}</span>
                    <span className="text-sm text-gray-500">/ {settings.max_users || 'Unlimited'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {t('tenants.storage') || 'Storage'}
                  </label>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-gray-900">{settings.current_storage || 0} GB</span>
                    <span className="text-sm text-gray-500">/ {settings.max_storage || 'Unlimited'} GB</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.security') || 'Security'}</label>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${settings.mfa_enforced ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-gray-700">MFA Enforced</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${settings.sso_enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-gray-700">SSO Enabled</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tenants.features') || 'Features'}</label>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${settings.custom_branding ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-gray-700">Custom Branding</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${settings.api_access ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-gray-700">API Access</span>
                    </div>
                  </div>
                </div>
              </div>

              {settings.features && Array.isArray(settings.features) && settings.features.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">{t('tenants.additionalFeatures') || 'Additional Features'}</label>
                  <div className="flex flex-wrap gap-2">
                    {settings.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {feature.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Created: {new Date(tenant.created_at).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated: {new Date(tenant.updated_at).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5" />
          <span>Version: {tenant.version}</span>
        </div>
      </div>
    </div>
  );
}
