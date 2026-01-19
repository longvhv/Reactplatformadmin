/**
 * Edit Subscription Page
 * Form for editing existing tenant subscription
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Calendar, RefreshCw } from 'lucide-react';
import { 
  getTenantSubscriptionById, 
  updateTenantSubscription, 
  TenantSubscription,
  UpdateSubscriptionRequest
} from '../api/tenantSubscriptionApi';
import { SubscriptionForm } from '../components/subscriptions/SubscriptionForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { Button } from '../components/ui/button';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export const EditSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubscription(id);
    }
  }, [id]);

  const fetchSubscription = async (subscriptionId: string) => {
    setLoading(true);
    try {
      const data = await getTenantSubscriptionById(subscriptionId);
      setSubscription(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      toast.error(t('subscriptions.fetchError'));
      navigate('/commerce/tenant-subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Partial<TenantSubscription>) => {
    if (!id) return;

    setSaving(true);
    try {
      await updateTenantSubscription(id, formData as UpdateSubscriptionRequest);
      toast.success(t('subscriptions.updateSuccess'));
      navigate('/commerce/tenant-subscriptions');
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error(t('subscriptions.updateError'));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/commerce/tenant-subscriptions');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('subscriptions.notFound')}</h2>
          <Button onClick={() => navigate('/commerce/tenant-subscriptions')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa Subscription"
      description={`Cập nhật thông tin subscription #${subscription.subscription_number}`}
      icon={Calendar}
      backPath="/commerce/tenant-subscriptions"
      backLabel="Quay lại danh sách"
    >
      <SubscriptionForm
        subscription={subscription}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
      />
    </FormPageLayout>
  );
};

export default EditSubscriptionPage;