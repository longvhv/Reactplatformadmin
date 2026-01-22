/**
 * SubscriptionTab Component
 * Subscription tier and billing settings
 * Updated for new TenantDetailPage interface
 */

import { CreditCard, Calendar, Shield, Award } from 'lucide-react';
import { useLanguage } from '../../../providers/LanguageProvider';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface SubscriptionTabProps {
  formData: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

export function SubscriptionTab({ formData, errors, onChange }: SubscriptionTabProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier */}
        <div>
          <Label className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            {t('tenants.tier') || 'Subscription Tier'}
          </Label>
          <Select 
            value={formData.tier || 'FREE'} 
            onValueChange={(v) => onChange('tier', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">🆓 Free</SelectItem>
              <SelectItem value="PRO">⭐ Pro</SelectItem>
              <SelectItem value="ENTERPRISE">🏢 Enterprise</SelectItem>
              <SelectItem value="PARTNER_BASIC">🤝 Partner Basic</SelectItem>
              <SelectItem value="PARTNER_PREMIUM">💎 Partner Premium</SelectItem>
              <SelectItem value="PARTNER_ELITE">👑 Partner Elite</SelectItem>
              <SelectItem value="PROVIDER">🚀 Provider</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <Label className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('tenants.status') || 'Status'}
          </Label>
          <Select 
            value={formData.status || 'TRIAL'} 
            onValueChange={(v) => onChange('status', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRIAL">🧪 Trial</SelectItem>
              <SelectItem value="ACTIVE">✅ Active</SelectItem>
              <SelectItem value="SUSPENDED">⏸️ Suspended</SelectItem>
              <SelectItem value="CANCELLED">❌ Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Billing Type */}
        <div>
          <Label className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {t('tenants.billingType') || 'Billing Type'}
          </Label>
          <Select 
            value={formData.billing_type || 'POSTPAID'} 
            onValueChange={(v) => onChange('billing_type', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PREPAID">💳 Prepaid</SelectItem>
              <SelectItem value="POSTPAID">📋 Postpaid (Invoice)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tier Benefits Info */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Award className="w-4 h-4" />
          {t('tenants.tierBenefits') || 'Tier Benefits'}
        </h4>
        <div className="text-sm text-muted-foreground space-y-2">
          {formData.tier === 'FREE' && (
            <ul className="space-y-1">
              <li>• Up to 10 users</li>
              <li>• 50 GB storage</li>
              <li>• Basic support</li>
              <li>• Community access</li>
            </ul>
          )}
          {formData.tier === 'PRO' && (
            <ul className="space-y-1">
              <li>• Up to 50 users</li>
              <li>• 200 GB storage</li>
              <li>• Priority support</li>
              <li>• API access</li>
              <li>• Custom branding</li>
            </ul>
          )}
          {formData.tier === 'ENTERPRISE' && (
            <ul className="space-y-1">
              <li>• Unlimited users</li>
              <li>• Unlimited storage</li>
              <li>• 24/7 dedicated support</li>
              <li>• SSO & MFA</li>
              <li>• Custom domain</li>
              <li>• Advanced analytics</li>
              <li>• SLA guarantee</li>
            </ul>
          )}
          {formData.tier?.startsWith('PARTNER_') && (
            <ul className="space-y-1">
              <li>• White-label options</li>
              <li>• Multi-tenant management</li>
              <li>• Revenue sharing</li>
              <li>• Partner portal access</li>
              <li>• Co-marketing opportunities</li>
            </ul>
          )}
          {formData.tier === 'PROVIDER' && (
            <ul className="space-y-1">
              <li>• Full platform access</li>
              <li>• System administration</li>
              <li>• All features enabled</li>
              <li>• Platform-level controls</li>
            </ul>
          )}
        </div>
      </div>

      {/* Billing Info */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          {t('tenants.billingInfo') || 'Billing Information'}
        </h4>
        <p className="text-sm text-muted-foreground">
          {formData.billing_type === 'PREPAID' ? (
            'Prepaid: Payment required before service usage. Credit-based billing.'
          ) : (
            'Postpaid: Invoiced monthly based on usage. Payment terms negotiable.'
          )}
        </p>
      </div>
    </div>
  );
}