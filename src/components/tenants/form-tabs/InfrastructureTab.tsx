/**
 * InfrastructureTab Component
 * Infrastructure and compliance settings
 * Updated for new TenantDetailPage interface
 */

import { MapPin, Shield, Clock, Network } from 'lucide-react';
import { useLanguage } from '../../../providers/LanguageProvider';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface InfrastructureTabProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function InfrastructureTab({ formData, errors, onChange }: InfrastructureTabProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data Region */}
        <div>
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t('tenants.dataRegion') || 'Data Region'}
          </Label>
          <Select 
            value={formData.data_region || 'ap-southeast-1'} 
            onValueChange={(v) => onChange('data_region', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ap-southeast-1">🌏 Asia Pacific (Singapore)</SelectItem>
              <SelectItem value="us-east-1">🇺🇸 US East (Virginia)</SelectItem>
              <SelectItem value="eu-central-1">🇪🇺 EU Central (Frankfurt)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Compliance Level */}
        <div>
          <Label className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('tenants.complianceLevel') || 'Compliance Level'}
          </Label>
          <Select 
            value={formData.compliance_level || 'STANDARD'} 
            onValueChange={(v) => onChange('compliance_level', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STANDARD">Standard</SelectItem>
              <SelectItem value="GDPR">GDPR (Europe)</SelectItem>
              <SelectItem value="HIPAA">HIPAA (Healthcare)</SelectItem>
              <SelectItem value="PCI-DSS">PCI-DSS (Payment)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timezone */}
        <div>
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('tenants.timezone') || 'Timezone'}
          </Label>
          <Select 
            value={formData.timezone || 'UTC'} 
            onValueChange={(v) => onChange('timezone', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
              <SelectItem value="America/Chicago">America/Chicago (CST)</SelectItem>
              <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
              <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
              <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
              <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
              <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parent Tenant */}
        <div>
          <Label className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            {t('tenants.parentTenant') || 'Parent Tenant'}
          </Label>
          <Select 
            value={formData.parent_tenant_id || 'none'} 
            onValueChange={(v) => onChange('parent_tenant_id', v === 'none' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('tenants.selectParent') || 'Select parent tenant (optional)'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('tenants.noParent') || 'Root Tenant (No Parent)'}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {t('tenants.parentTenantHint') || 'Set parent for hierarchical organization structure'}
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-medium mb-2">
          {t('tenants.infrastructureInfo') || 'Infrastructure Settings'}
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Data region determines where tenant data is stored</li>
          <li>• Compliance level affects data retention and security policies</li>
          <li>• Timezone is used for scheduling and timestamps</li>
          <li>• Parent tenant creates hierarchical organization structure</li>
        </ul>
      </div>
    </div>
  );
}
