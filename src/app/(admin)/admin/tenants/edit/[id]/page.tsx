/**
 * Edit Tenant Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../components/shim/next-navigation';
import { Building2 } from 'lucide-react';
import { useLanguage } from '../../../../../providers/LanguageProvider';
import { FormPageLayout } from '../../../../../components/layouts/FormPageLayout';
import { EnhancedTenantForm } from '../../../../../components/tenants/EnhancedTenantForm';
import { showToast } from '../../../../../lib/toast';
import { tenantsApi, Tenant, UpdateTenantRequest } from '../../../../../api/tenantsApi';
import { useTenant } from '../../../../../hooks/useTenant';

function EditTenantPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  const { tenant, loading: tenantLoading } = useTenant(id);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await tenantsApi.getAll();
      // Exclude current tenant from parent options
      setTenants(data.filter(t => t._id !== id));
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const handleSubmit = async (data: UpdateTenantRequest) => {
    setLoading(true);
    try {
      await tenantsApi.update(id, data);
      showToast.success(t('common.success'), t('tenants.updateSuccess'));
      router.push('/admin/tenants');
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      showToast.error(t('common.error'), error.message || t('tenants.updateError'));
    } finally {
      setLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title={t('tenants.editTenant')}
      description="Update tenant information"
      icon={Building2}
      backPath="/admin/tenants"
      backLabel={t('tenants.backToList')}
    >
      <EnhancedTenantForm
        tenant={tenant}
        tenants={tenants}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/admin/tenants')}
        isEdit={true}
      />
    </FormPageLayout>
  );
}

export { EditTenantPage };
export default EditTenantPage;