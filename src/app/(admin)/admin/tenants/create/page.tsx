/**
 * Add Tenant Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ UPDATED 2026-01-18: Support subscription creation
 * 
 * Features:
 * - Complete tenant creation form
 * - Hierarchical tenant support with autocomplete
 * - Partner relationship support with tier filtering
 * - Optional subscription creation immediately
 * - Dynamic profile and settings
 * - Full validation, i18n support, Indigo theme design
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Building2 } from 'lucide-react';
import { useLanguage } from '../../../../../providers/LanguageProvider';
import { FormPageLayout } from '../../../../../components/layouts/FormPageLayout';
import { EnhancedTenantForm } from '../../../../../components/tenants/EnhancedTenantForm';
import { showToast } from '../../../../../lib/toast';
import { tenantsApi, CreateTenantRequest, Tenant } from '../../../../../api/tenantsApi';
import { tenantSubscriptionsApi, CreateSubscriptionRequest } from '../../../../../api/tenantSubscriptionsApi';

function AddTenantPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Load existing tenants for parent selection
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await tenantsApi.getAll();
      setTenants(data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const handleSubmit = async (data: CreateTenantRequest & { createSubscription?: boolean; subscriptionData?: CreateSubscriptionRequest }) => {
    setLoading(true);
    try {
      // Create tenant
      const { createSubscription, subscriptionData, ...tenantData } = data;
      const newTenant = await tenantsApi.create(tenantData);
      
      // Optionally create subscription
      if (createSubscription && subscriptionData) {
        try {
          await tenantSubscriptionsApi.create({
            ...subscriptionData,
            tenant_id: newTenant._id,
          });
          showToast.success(t('common.success'), 'Tenant and subscription created successfully');
        } catch (subError: any) {
          console.error('Subscription creation failed:', subError);
          showToast.warning('Warning', 'Tenant created but subscription failed: ' + subError.message);
        }
      } else {
        showToast.success(t('common.success'), t('tenants.createSuccess'));
      }
      
      router.push('/admin/tenants');
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      showToast.error(t('common.error'), error.message || t('tenants.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title={t('tenants.addTenant')}
      description="Create new tenant with optional subscription"
      icon={Building2}
      backPath="/admin/tenants"
      backLabel={t('tenants.backToList')}
    >
      <EnhancedTenantForm
        tenants={tenants}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/admin/tenants')}
      />
    </FormPageLayout>
  );
}

export { AddTenantPage };
export default AddTenantPage;