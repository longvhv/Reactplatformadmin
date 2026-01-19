/**
 * Add Tenant Page
 * ✅ UPDATED 2026-01-18: Support subscription creation
 * 
 * Features:
 * - Complete tenant creation form
 * - Hierarchical tenant support with autocomplete
 * - Partner relationship support with tier filtering
 * - Optional subscription creation immediately
 * - Dynamic profile and settings
 * - Full validation, i18n support, Indigo theme design
 * 
 * Database Schema: tenants table + tenant_subscriptions table
 * Route: /core/tenants/add
 * 
 * @see /api/tenantsApi.ts
 * @see /api/tenantSubscriptionsApi.ts
 * @see /data/tenants.ts
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2 } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { EnhancedTenantForm } from '../components/tenants/EnhancedTenantForm';
import { showToast } from '@/lib/toast';
import { tenantsApi, CreateTenantRequest, Tenant } from '../api/tenantsApi';
import { tenantSubscriptionsApi, CreateSubscriptionRequest } from '../api/tenantSubscriptionsApi';

export default function AddTenantPage() {
  const navigate = useNavigate();
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

  const handleSubmit = async (data: Partial<Tenant>, subscriptionData?: CreateSubscriptionRequest) => {
    try {
      setLoading(true);

      // Validate required fields
      if (!data.name?.trim()) {
        showToast.error(t('tenants.errors.nameRequired'));
        throw new Error('Name required');
      }

      if (!data.code?.trim()) {
        showToast.error(t('tenants.errors.codeRequired'));
        throw new Error('Code required');
      }

      // Create tenant
      const createData: CreateTenantRequest = data as CreateTenantRequest;
      const newTenant = await tenantsApi.create(createData);
      
      // Create subscription if data provided
      if (subscriptionData && newTenant._id) {
        try {
          const subscriptionPayload: CreateSubscriptionRequest = {
            ...subscriptionData,
            tenant_id: newTenant._id,
          };
          await tenantSubscriptionsApi.create(subscriptionPayload);
          showToast.success('Tenant và subscription đã được tạo thành công!');
        } catch (subError: any) {
          console.error('Failed to create subscription:', subError);
          showToast.warning(`Tenant đã tạo nhưng subscription thất bại: ${subError.message}`);
        }
      } else {
        showToast.success(t('tenants.createSuccess'));
      }
      
      navigate('/admin/tenants');
      
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      showToast.error(error.message || t('errors.somethingWentWrong'));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title={t('tenants.createTenant')}
      description={t('tenants.addTenantDescription')}
      icon={Building2}
      backPath="/admin/tenants"
      backLabel={t('common.backToList')}
    >
      <EnhancedTenantForm
        tenants={tenants}
        onSubmit={handleSubmit}
        isEdit={false}
      />
    </FormPageLayout>
  );
}