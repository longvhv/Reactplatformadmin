'use client';

/**
 * Create Notification Page
 * ✅ MIGRATED from /pages/platform/notifications/create.tsx
 */

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Bell } from 'lucide-react';
import { FormPageLayout } from '../../../../../components/layouts/FormPageLayout';
import { notificationsApi } from '../../../../../api/notificationsApi';
import { NotificationForm } from '../../../../../components/notifications/NotificationForm';
import { showToast } from '../../../../../lib/toast';

function CreateNotificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await notificationsApi.create(data);
      showToast.success('Success', 'Notification created');
      router.push('/platform/notifications');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Add Notification"
      description="Create a new system notification"
      icon={Bell}
      backPath="/platform/notifications"
      backLabel="Back to Notifications"
    >
      <NotificationForm
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => router.push('/platform/notifications')}
      />
    </FormPageLayout>
  );
}

export { CreateNotificationPage };
export default CreateNotificationPage;