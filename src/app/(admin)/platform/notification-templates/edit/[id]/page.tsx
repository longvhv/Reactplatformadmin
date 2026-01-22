/**
 * Edit Notification Template Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { NotificationTemplateForm } from '../../../../../../components/notification-templates/NotificationTemplateForm';
import { useNotificationTemplate, useNotificationTemplates } from '../../../../../../hooks/useNotificationTemplates';
import { UpdateTemplateRequest } from '../../../../../../api/notificationTemplateApi';
import { showToast } from '../../../../../../lib/toast';

function EditNotificationTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { template, loading: fetching } = useNotificationTemplate(id);
  const { updateTemplate } = useNotificationTemplates(); // Use main hook for update action
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: UpdateTemplateRequest | any) => {
    setSubmitting(true);
    try {
      await updateTemplate(id, data);
      showToast.success('Thành công', 'Đã cập nhật template');
      router.push('/platform/notification-templates');
    } catch (error: any) {
      console.error('Failed to update template:', error);
      showToast.error('Lỗi', error.message || 'Không thể cập nhật template');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">Không tìm thấy template</p>
        <Button variant="link" onClick={() => router.push('/platform/notification-templates')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <PageLayout
      icon={Mail}
      title="Chỉnh sửa Template"
      description={`Cập nhật thông tin cho template: ${template.template_name}`}
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/notification-templates')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <NotificationTemplateForm
          template={template}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/notification-templates')}
          loading={submitting}
        />
      </div>
    </PageLayout>
  );
}

export default EditNotificationTemplatePage;