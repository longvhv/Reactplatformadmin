/**
 * Add Subscription Page
 * Form to create new tenant subscription
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 * ✅ UPDATED 2026-01-17: Vietnamese paths
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { SubscriptionForm } from '../components/subscriptions/SubscriptionForm';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';
import {
  tenantSubscriptionsApi,
  type TenantSubscription,
} from '../api/tenantSubscriptionsApi';

export default function AddSubscriptionPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<TenantSubscription>) => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!data.tenant_id) {
        toast.error('Vui lòng chọn tenant');
        throw new Error('Missing tenant_id');
      }

      // Create subscription
      await tenantSubscriptionsApi.create(data as any);
      
      toast.success('Tạo subscription thành công!');
      navigate('/commerce/tenant-subscriptions');
      
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast.error(error.message || 'Không thể tạo subscription');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/commerce/tenant-subscriptions');
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo Subscription Mới"
      description="Tạo subscription cho tenant"
      icon={Calendar}
      backPath="/commerce/tenant-subscriptions"
      backLabel="Quay lại danh sách"
    >
      <SubscriptionForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </FormPageLayout>
  );
}