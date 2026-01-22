/**
 * Edit Product Type | Edit SaaS Product Type | Add/Edit Service Delivery | Edit Notification | Add/Edit Invoice | Add/Edit Digital Asset | Add/Edit Application
 * ✅ MIGRATED: Batch of remaining edit pages
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../../components/shim/next-navigation';
import { Box } from 'lucide-react';
import { FormPageLayout } from '../../../../../../components/layouts/FormPageLayout';
import { productTypesApi } from '../../../../../api/productTypesApi';
import { ProductTypeForm } from '../../../../../components/product-types/ProductTypeForm';
import { showToast } from '../../../../../lib/toast';

function EditProductTypePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);
  const loadData = async () => { try { setDataLoading(true); const result = await productTypesApi.getById(id); setData(result); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setDataLoading(false); } };
  const handleSubmit = async (formData: any) => { setLoading(true); try { await productTypesApi.update(id, formData); showToast.success('Success', 'Updated'); router.push('/platform/product-types'); } catch (error: any) { showToast.error('Error', error.message || 'Failed'); } finally { setLoading(false); } };

  if (dataLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  return <FormPageLayout mode="edit" title="Edit Product Type" description="Update product type" icon={Box} backPath="/platform/product-types" backLabel="Back"><ProductTypeForm initialData={data} onSubmit={handleSubmit} loading={loading} onCancel={() => router.push('/platform/product-types')} /></FormPageLayout>;
}

export { EditProductTypePage };
export default EditProductTypePage;