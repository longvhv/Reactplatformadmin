/**
 * Add Tenant Page
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 * 
 * Features:
 * - Complete tenant creation form
 * - Hierarchical tenant support (parent selection)
 * - Partner relationship support
 * - Dynamic profile and settings
 * - Full validation, i18n support, Indigo theme design
 * 
 * Database Schema: tenants table
 * Route: /core/tenants/add
 * 
 * @see /api/tenantsApi.ts
 * @see /data/tenants.ts
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2 } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { EnhancedTenantForm } from '../components/tenants/EnhancedTenantForm';
import { toast } from 'sonner@2.0.3';
import { tenantsApi, CreateTenantRequest, Tenant } from '../api/tenantsApi';

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

  const handleSubmit = async (data: Partial<Tenant>) => {
    try {
      setLoading(true);

      // Validate required fields
      if (!data.name?.trim()) {
        toast.error(t('tenants.errors.nameRequired'));
        throw new Error('Name required');
      }

      if (!data.code?.trim()) {
        toast.error(t('tenants.errors.codeRequired'));
        throw new Error('Code required');
      }

      // Create tenant
      const createData: CreateTenantRequest = data as CreateTenantRequest;
      await tenantsApi.create(createData);
      
      toast.success(t('tenants.createSuccess'));
      navigate('/core/tenants');
      
    } catch (error: any) {
      console.error('Error creating tenant:', error);
      toast.error(error.message || t('errors.somethingWentWrong'));
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
      backPath="/core/tenants"
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