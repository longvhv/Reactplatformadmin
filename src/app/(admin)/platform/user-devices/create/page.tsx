'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Laptop, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { UserDeviceForm } from '../../../../components/user-devices/UserDeviceForm';
import { userDevicesApi, CreateDeviceRequest } from '../../../../api/userDevicesApi';
import { showToast } from '../../../../lib/toast';

export default function CreateUserDevicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userDevicesApi.create(data as CreateDeviceRequest);
      showToast.success('Success', 'Device registered successfully');
      router.push('/platform/user-devices');
    } catch (error: any) {
      console.error('Failed to register device:', error);
      showToast.error('Error', error.message || 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Laptop}
      title="Register Device"
      description="Manually register a user device"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-devices')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserDeviceForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-devices')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}