/**
 * SettingsTab Component
 * Advanced tenant settings and quotas
 * Updated for new TenantDetailPage interface
 */

import { Settings, Users, Database, Shield, Key, Palette, Code } from 'lucide-react';
import { useLanguage } from '../../../providers/LanguageProvider';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';

interface SettingsTabProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (parent: string, field: string, value: any) => void;
}

export function SettingsTab({ formData, errors, onChange }: SettingsTabProps) {
  const { t } = useLanguage();

  const settings = formData.settings || {
    max_users: 10,
    max_storage: 10,
    current_users: 0,
    current_storage: 0,
    mfa_enforced: false,
    sso_enabled: false,
    custom_branding: false,
    api_access: false,
    features: [],
  };

  return (
    <div className="space-y-6">
      {/* Resource Quotas */}
      <div>
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" />
          {t('tenants.resourceQuotas') || 'Resource Quotas'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('tenants.maxUsers') || 'Max Users'}
            </Label>
            <Input
              type="number"
              min="1"
              max="10000"
              value={settings.max_users}
              onChange={(e) => onChange('settings', 'max_users', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {settings.current_users} users
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              {t('tenants.maxStorage') || 'Max Storage'} (GB)
            </Label>
            <Input
              type="number"
              min="1"
              max="100000"
              value={settings.max_storage}
              onChange={(e) => onChange('settings', 'max_storage', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {settings.current_storage} GB used
            </p>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="border-t border-border pt-6">
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {t('tenants.securityFeatures') || 'Security Features'}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex-1">
              <Label htmlFor="mfa" className="cursor-pointer">
                {t('tenants.mfaEnforced') || 'Multi-Factor Authentication (MFA)'}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Require all users to enable MFA
              </p>
            </div>
            <Switch
              id="mfa"
              checked={settings.mfa_enforced}
              onCheckedChange={(v) => onChange('settings', 'mfa_enforced', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex-1">
              <Label htmlFor="sso" className="cursor-pointer">
                {t('tenants.ssoEnabled') || 'Single Sign-On (SSO)'}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Enable SAML/OAuth SSO integration
              </p>
            </div>
            <Switch
              id="sso"
              checked={settings.sso_enabled}
              onCheckedChange={(v) => onChange('settings', 'sso_enabled', v)}
            />
          </div>
        </div>
      </div>

      {/* Platform Features */}
      <div className="border-t border-border pt-6">
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t('tenants.platformFeatures') || 'Platform Features'}
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex-1">
              <Label htmlFor="branding" className="cursor-pointer flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('tenants.customBranding') || 'Custom Branding'}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Allow custom logo, colors, and themes
              </p>
            </div>
            <Switch
              id="branding"
              checked={settings.custom_branding}
              onCheckedChange={(v) => onChange('settings', 'custom_branding', v)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex-1">
              <Label htmlFor="api" className="cursor-pointer flex items-center gap-2">
                <Code className="w-4 h-4" />
                {t('tenants.apiAccess') || 'API Access'}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Enable REST API and webhooks
              </p>
            </div>
            <Switch
              id="api"
              checked={settings.api_access}
              onCheckedChange={(v) => onChange('settings', 'api_access', v)}
            />
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          {t('tenants.usageStatistics') || 'Current Usage'}
        </h4>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Users</span>
              <span className="font-medium">
                {settings.current_users} / {settings.max_users}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min((settings.current_users / settings.max_users) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium">
                {settings.current_storage} GB / {settings.max_storage} GB
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min((settings.current_storage / settings.max_storage) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}