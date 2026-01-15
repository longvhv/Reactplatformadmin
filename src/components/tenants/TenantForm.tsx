/**
 * TenantForm Component
 * Refactored with useTenantForm hook - Under 300 lines
 */

import { useNavigate } from 'react-router';
import { ArrowLeft, Save, Building2, MapPin, CreditCard, Settings } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenantForm } from '@/hooks/useTenantForm';
import type { Tenant } from '@/data/tenants';

// Import sub-components
import { BasicInfoTab } from './form-tabs/BasicInfoTab';
import { InfrastructureTab } from './form-tabs/InfrastructureTab';
import { SubscriptionTab } from './form-tabs/SubscriptionTab';
import { SettingsTab } from './form-tabs/SettingsTab';

interface TenantFormProps {
  tenant?: Tenant;
  tenants?: Tenant[];
  onSubmit: (data: Partial<Tenant>) => Promise<void>;
  isEdit?: boolean;
}

export function TenantForm({ tenant, tenants = [], onSubmit, isEdit = false }: TenantFormProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    formData,
    errors,
    loading,
    updateField,
    updateProfile,
    updateSettings,
    generateCode,
    handleSubmit,
  } = useTenantForm({
    initialData: tenant,
    onSubmit: async (data) => {
      await onSubmit(data);
      navigate('/core/tenants');
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/core/tenants')} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-2xl font-semibold">
            {isEdit ? t('tenants.editTenant') : t('tenants.addTenant')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit ? t('tenants.editTenantDescription') : t('tenants.addTenantDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">
              <Building2 className="w-4 h-4 mr-2" />
              {t('tenants.tabs.basic')}
            </TabsTrigger>
            <TabsTrigger value="infrastructure">
              <MapPin className="w-4 h-4 mr-2" />
              {t('tenants.tabs.infrastructure')}
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              {t('tenants.tabs.subscription')}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              {t('tenants.tabs.settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab
              formData={formData}
              errors={errors}
              updateField={updateField}
              updateProfile={updateProfile}
              generateCode={generateCode}
            />
          </TabsContent>

          <TabsContent value="infrastructure">
            <InfrastructureTab
              formData={formData}
              errors={errors}
              tenants={tenants}
              updateField={updateField}
            />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab
              formData={formData}
              errors={errors}
              updateField={updateField}
              updateSettings={updateSettings}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab
              formData={formData}
              errors={errors}
              updateSettings={updateSettings}
            />
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/core/tenants')} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? t('common.saveChanges') : t('tenants.createTenant')}
              </>
            )}
          </Button>
        </div>

        {errors.submit && (
          <p className="text-sm text-destructive text-center mt-4">{errors.submit}</p>
        )}
      </form>
    </div>
  );
}