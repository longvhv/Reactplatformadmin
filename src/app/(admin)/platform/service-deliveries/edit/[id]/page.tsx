/**
 * Edit Service Delivery Page
 * ✅ Consolidated from /platform/service-delivery/edit
 * ✅ Uses ServiceDeliveryForm
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Truck } from 'lucide-react';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { tenantServiceDeliveriesApi, TenantServiceDelivery } from '../../../../../../api/tenantServiceDeliveriesApi';
import { ServiceDeliveryForm } from '../../../../../../components/service-deliveries/ServiceDeliveryForm';
import { showToast } from '../../../../../../lib/toast';

export default function ServiceDeliveryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [data, setData] = useState<TenantServiceDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await tenantServiceDeliveriesApi.getById(id);
      setData(result);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load service delivery');
      router.push('/platform/service-deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (updateData: any) => {
    setSaving(true);
    try {
      await tenantServiceDeliveriesApi.update(id, updateData);
      showToast.success('Success', 'Service delivery updated successfully');
      router.push('/platform/service-deliveries');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update service delivery');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PageLayout 
      icon={Truck} 
      title="Edit Service Delivery" 
      description="Update service delivery details"
      backButton={{ label: 'Back', onClick: () => router.push('/platform/service-deliveries') }}
    >
      <div className="max-w-3xl mx-auto">
        <ServiceDeliveryForm 
          tenantId={data.tenant_id}
          initialData={data}
          onSubmit={handleSubmit}
          loading={saving}
          onCancel={() => router.push('/platform/service-deliveries')} 
        />
      </div>
    </PageLayout>
  );
}
