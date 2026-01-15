/**
 * Add Webhook Page
 * Page for creating a new webhook
 * ✅ UPDATED 2026-01-15: Full implementation with WebhookForm
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Webhook } from 'lucide-react';
import { Button } from '../components/ui/button';
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
      navigate(`/core/webhooks/${webhook._id}`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/core/webhooks')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center gap-3">
            <Webhook className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Tạo Webhook Mới
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tạo webhook để nhận event notifications từ hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <WebhookForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}