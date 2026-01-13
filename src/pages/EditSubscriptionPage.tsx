/**
 * Edit Subscription Page
 * Form for editing existing tenant subscription
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { 
  getTenantSubscriptionById, 
  updateTenantSubscription, 
  TenantSubscription 
} from '../api/tenantSubscriptionApi';
import { SubscriptionForm } from '../components/subscriptions/SubscriptionForm';
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
      const { data, error } = await getTenantSubscriptionById(subscriptionId);
      
      if (error || !data) {
        console.error('Error fetching subscription:', error);
        toast.error(t('subscriptions.notFound'));
        navigate('/core/subscriptions');
        return;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('subscriptions.fetchError'));
      navigate('/core/subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Partial<TenantSubscription>) => {
    if (!id) return;

    setSaving(true);
    try {
      const { data, error } = await updateTenantSubscription(id, formData);
      
      if (error) {
        console.error('Error updating subscription:', error);
        toast.error(t('subscriptions.updateError'));
        return;
      }

      toast.success(t('subscriptions.updateSuccess'));
      navigate('/core/subscriptions');
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('subscriptions.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/subscriptions');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('subscriptions.notFound')}</h2>
          <Button onClick={() => navigate('/core/subscriptions')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/core/subscriptions')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">{t('subscriptions.editSubscription')}</h1>
          <p className="text-gray-600 mt-1">{t('subscriptions.editSubscriptionDescription')}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <SubscriptionForm
              subscription={subscription}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
