/**
 * Edit Webhook Page
 * Page for editing an existing webhook
 * ✅ UPDATED 2026-01-15: Full implementation with WebhookForm
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Webhook } from 'lucide-react';
import { Button } from '../components/ui/button';
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
      navigate('/core/webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateWebhookRequest) => {
    try {
      setIsSubmitting(true);
      const updated = await webhooksApi.update(id!, data);
      toast.success('Cập nhật webhook thành công!');
      navigate(`/core/webhooks/${updated._id}`);
    } catch (error: any) {
      toast.error('Không thể cập nhật webhook: ' + error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/core/webhooks/${id}`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/core/webhooks/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại chi tiết
          </Button>
          
          <div className="flex items-center gap-3">
            <Webhook className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Chỉnh sửa Webhook
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {webhook.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <WebhookForm
          mode="edit"
          initialData={webhook}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}