/**
 * Create Notification Template Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { NotificationTemplateForm } from '../../../../../components/notification-templates/NotificationTemplateForm';
import { useNotificationTemplates } from '../../../../../hooks/useNotificationTemplates';
import { CreateTemplateRequest } from '../../../../../api/notificationTemplateApi';
import { showToast } from '../../../../../lib/toast';

function CreateNotificationTemplatePage() {
  const router = useRouter();
  const { createTemplate } = useNotificationTemplates(); // Don't need auto-load here really, but hook loads by default. Could optimize.
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CreateTemplateRequest | any) => {
    setSubmitting(true);
    try {
      await createTemplate(data);
      showToast.success('Thành công', 'Đã tạo template mới');
      router.push('/platform/notification-templates');
    } catch (error: any) {
      console.error('Failed to create template:', error);
      showToast.error('Lỗi', error.message || 'Không thể tạo template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      icon={Mail}
      title="Tạo Template Thông báo"
      description="Thiết lập mẫu thông báo mới cho hệ thống"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/notification-templates')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <NotificationTemplateForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/notification-templates')}
          loading={submitting}
        />
      </div>
    </PageLayout>
  );
}

export default CreateNotificationTemplatePage;