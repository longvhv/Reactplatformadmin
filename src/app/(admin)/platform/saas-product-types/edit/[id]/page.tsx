/**
 * REMAINING LIST PAGES BATCH: Feature Flags | Regions | Product Types | SaaS Product Types | Service Packages | Service Deliveries | Notifications | Invoices | User Registrations | API Usage Logs
 * ✅ MIGRATED: 10 list pages + Edit SaaS Product Type
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../../components/shim/next-navigation';
import { Layers } from 'lucide-react';
import { FormPageLayout } from '../../../../../../components/layouts/FormPageLayout';
import { saasProductTypesApi } from '../../../../../api/saasProductTypesApi';
import { SaasProductTypeForm } from '../../../../../components/saas-product-types/SaasProductTypeForm';
import { showToast } from '../../../../../lib/toast';

function EditSaasProductTypePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { setDataLoading(true); const result = await saasProductTypesApi.getById(id); setData(result); } catch (error: any) { showToast.error('Error', 'Failed'); } finally { setDataLoading(false); } };
  const handleSubmit = async (formData: any) => { setLoading(true); try { await saasProductTypesApi.update(id, formData); showToast.success('Success', 'Updated'); router.push('/platform/saas-product-types'); } catch (error: any) { showToast.error('Error', error.message || 'Failed'); } finally { setLoading(false); } };

  if (dataLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  return <FormPageLayout mode="edit" title="Edit SaaS Product Type" description="Update SaaS product type" icon={Layers} backPath="/platform/saas-product-types" backLabel="Back"><SaasProductTypeForm initialData={data} onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/saas-product-types')} /></FormPageLayout>;
}

export { EditSaasProductTypePage };
export default EditSaasProductTypePage;