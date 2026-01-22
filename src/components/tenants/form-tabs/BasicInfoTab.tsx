/**
 * BasicInfoTab Component
 * Basic tenant information form fields
 * Updated for new TenantDetailPage interface
 */

import { Building2, Globe, Mail, Phone, User, MapPin } from 'lucide-react';
import { useLanguage } from '../../../providers/LanguageProvider';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface BasicInfoTabProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  onNestedChange: (parent: string, field: string, value: any) => void;
}

export function BasicInfoTab({ formData, errors, onChange, onNestedChange }: BasicInfoTabProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Core Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">
            {t('tenants.name') || 'Tenant Name'} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder={t('tenants.namePlaceholder') || 'Enter tenant name'}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="code">
            {t('tenants.code') || 'Code'} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="code"
            value={formData.code || ''}
            onChange={(e) => onChange('code', e.target.value)}
            placeholder={t('tenants.codePlaceholder') || 'lowercase-slug'}
            className={errors.code ? 'border-destructive' : ''}
          />
          {errors.code && <p className="text-sm text-destructive mt-1">{errors.code}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Lowercase letters, numbers, and hyphens only
          </p>
        </div>

        <div>
          <Label htmlFor="timezone">
            {t('tenants.timezone') || 'Timezone'}
          </Label>
          <Input
            id="timezone"
            value={formData.timezone || 'UTC'}
            onChange={(e) => onChange('timezone', e.target.value)}
            placeholder="UTC"
          />
        </div>
      </div>

      {/* Profile Information */}
      <div className="border-t border-border pt-6">
        <h3 className="text-base font-medium mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          {t('tenants.profileInfo') || 'Profile Information'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="billing_email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('tenants.billingEmail') || 'Billing Email'}
            </Label>
            <Input
              id="billing_email"
              type="email"
              value={formData.profile?.billing_email || ''}
              onChange={(e) => onNestedChange('profile', 'billing_email', e.target.value)}
              placeholder="billing@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('tenants.phone') || 'Phone'}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.profile?.phone || ''}
              onChange={(e) => onNestedChange('profile', 'phone', e.target.value)}
              placeholder="+1-555-0100"
            />
          </div>

          <div>
            <Label htmlFor="domain" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('tenants.domain') || 'Domain'}
            </Label>
            <Input
              id="domain"
              value={formData.profile?.domain || ''}
              onChange={(e) => onNestedChange('profile', 'domain', e.target.value)}
              placeholder="tenant.example.com"
            />
          </div>

          <div>
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('tenants.website') || 'Website'}
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.profile?.website || ''}
              onChange={(e) => onNestedChange('profile', 'website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor="contact_person" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('tenants.contactPerson') || 'Contact Person'}
            </Label>
            <Input
              id="contact_person"
              value={formData.profile?.contact_person || ''}
              onChange={(e) => onNestedChange('profile', 'contact_person', e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="industry">
              {t('tenants.industry') || 'Industry'}
            </Label>
            <Input
              id="industry"
              value={formData.profile?.industry || ''}
              onChange={(e) => onNestedChange('profile', 'industry', e.target.value)}
              placeholder="Technology"
            />
          </div>

          <div>
            <Label htmlFor="company_size">
              {t('tenants.companySize') || 'Company Size'}
            </Label>
            <Input
              id="company_size"
              value={formData.profile?.company_size || ''}
              onChange={(e) => onNestedChange('profile', 'company_size', e.target.value)}
              placeholder="10-50"
            />
          </div>

          <div>
            <Label htmlFor="country" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('tenants.country') || 'Country'}
            </Label>
            <Input
              id="country"
              value={formData.profile?.country || ''}
              onChange={(e) => onNestedChange('profile', 'country', e.target.value)}
              placeholder="USA"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">
              {t('tenants.address') || 'Address'}
            </Label>
            <Textarea
              id="address"
              value={formData.profile?.address || ''}
              onChange={(e) => onNestedChange('profile', 'address', e.target.value)}
              placeholder="123 Main Street, City, State, ZIP"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="tax_id">
              {t('tenants.taxId') || 'Tax ID'}
            </Label>
            <Input
              id="tax_id"
              value={formData.profile?.tax_id || ''}
              onChange={(e) => onNestedChange('profile', 'tax_id', e.target.value)}
              placeholder="US-123456789"
            />
          </div>

          <div>
            <Label htmlFor="logo_url">
              {t('tenants.logoUrl') || 'Logo URL'}
            </Label>
            <Input
              id="logo_url"
              type="url"
              value={formData.profile?.logo_url || ''}
              onChange={(e) => onNestedChange('profile', 'logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
}