/**
 * Create Service Delivery Page
 * ✅ Consolidated from /platform/service-delivery/create
 * ✅ Uses ServiceDeliveryForm and TenantSelect
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Truck } from 'lucide-react';
import { Card, CardContent } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { tenantServiceDeliveriesApi } from '../../../../../api/tenantServiceDeliveriesApi';
import { ServiceDeliveryForm } from '../../../../../components/service-deliveries/ServiceDeliveryForm';
import { TenantSelect } from '../../../../../components/common/TenantSelect';
import { showToast } from '../../../../../lib/toast';

export default function ServiceDeliveryCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string>('');

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await tenantServiceDeliveriesApi.create(data);
      showToast.success('Success', 'Service delivery created successfully');
      router.push('/platform/service-deliveries');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create service delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout 
      icon={Truck} 
      title="Create Service Delivery" 
      description="Create a new service delivery for a tenant"
      backButton={{ label: 'Back', onClick: () => router.push('/platform/service-deliveries') }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Step 1: Select Tenant */}
        <Card className={tenantId ? "border-l-4 border-l-green-500" : "border-l-4 border-l-blue-500"}>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">1. Select Tenant</h3>
            <div className="max-w-md">
              <TenantSelect 
                value={tenantId}
                onChange={setTenantId}
                disabled={loading}
              />
            </div>
            {tenantId && <p className="text-sm text-green-600 mt-2">Tenant selected. Proceed to details.</p>}
          </CardContent>
        </Card>

        {/* Step 2: Form */}
        {tenantId && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ServiceDeliveryForm 
              tenantId={tenantId}
              onSubmit={handleSubmit}
              loading={loading}
              onCancel={() => router.push('/platform/service-deliveries')} 
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
