'use client';

import { useRouter, useParams } from '@/components/shim/next-navigation';
import { Laptop, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { UserDeviceForm } from '@/components/user-devices/UserDeviceForm';
import { userDevicesApi, UserDevice, UpdateDeviceRequest } from '@/api/userDevicesApi';
import { showToast } from '@/lib/toast';

export default function EditUserDevicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [device, setDevice] = useState<UserDevice | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const data = await userDevicesApi.getById(id);
        setDevice(data);
      } catch (error: any) {
        console.error('Failed to fetch device:', error);
        showToast.error('Error', 'Failed to load device record');
        router.push('/platform/user-devices');
      } finally {
        setFetching(false);
      }
    };

    if (id) {
      fetchDevice();
    }
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await userDevicesApi.update(id, data as UpdateDeviceRequest);
      showToast.success('Success', 'Device information updated');
      router.push('/platform/user-devices');
    } catch (error: any) {
      console.error('Failed to update device:', error);
      showToast.error('Error', error.message || 'Failed to update device');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!device) return null;

  return (
    <PageLayout
      icon={Laptop}
      title="Edit Device"
      description="Update registered device information and settings"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/user-devices')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <UserDeviceForm
          initialData={device}
          isEdit={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/user-devices')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}