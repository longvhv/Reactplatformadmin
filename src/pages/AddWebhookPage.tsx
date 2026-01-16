/**
 * Add Webhook Page
 * Page for creating a new webhook
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Webhook } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { WebhookForm } from '../components/webhooks/WebhookForm';
import { webhooksApi, CreateWebhookRequest } from '../api/webhooksApi';
import { toast } from 'sonner@2.0.3';

export default function AddWebhookPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateWebhookRequest) => {
    try {
      setIsLoading(true);
      const webhook = await webhooksApi.create(data);
      toast.success('Tạo webhook thành công!');
      navigate(`/core/webhooks/${webhook._id}`, { replace: true });
    } catch (error: any) {
      toast.error('Không thể tạo webhook: ' + error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/webhooks');
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo Webhook Mới"
      description="Tạo webhook để nhận event notifications từ hệ thống"
      icon={Webhook}
      backPath="/core/webhooks"
      backLabel="Quay lại danh sách"
    >
      <WebhookForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </FormPageLayout>
  );
}