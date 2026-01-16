/**
 * Edit Webhook Page
 * Page for editing an existing webhook
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Webhook } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { WebhookForm } from '../components/webhooks/WebhookForm';
import { webhooksApi, UpdateWebhookRequest, Webhook as WebhookType } from '../api/webhooksApi';
import { toast } from 'sonner@2.0.3';

export default function EditWebhookPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadWebhook();
    }
  }, [id]);

  const loadWebhook = async () => {
    try {
      setLoading(true);
      const data = await webhooksApi.getById(id!);
      setWebhook(data);
    } catch (error: any) {
      toast.error('Không thể tải webhook: ' + error.message);
      navigate('/core/webhooks', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateWebhookRequest) => {
    try {
      setIsSubmitting(true);
      const updated = await webhooksApi.update(id!, data);
      toast.success('Cập nhật webhook thành công!');
      navigate(`/core/webhooks/${updated._id}`, { replace: true });
    } catch (error: any) {
      toast.error('Không thể cập nhật webhook: ' + error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('🔙 handleCancel called, navigating to:', `/core/webhooks/${id}`);
    if (!id) {
      console.error('❌ Error: id is undefined!');
      toast.error('Lỗi: Không tìm thấy ID webhook');
      navigate('/core/webhooks');
      return;
    }
    try {
      navigate(`/core/webhooks/${id}`);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      toast.error('Lỗi khi quay lại trang chi tiết');
      navigate('/core/webhooks');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải webhook...</p>
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Không tìm thấy webhook</p>
          <Button onClick={() => navigate('/core/webhooks')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Webhook"
      description={webhook.name}
      icon={Webhook}
      backPath={`/core/webhooks/${id}`}
      backLabel="Quay lại chi tiết"
    >
      <WebhookForm
        mode="edit"
        initialData={webhook}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
      />
    </FormPageLayout>
  );
}