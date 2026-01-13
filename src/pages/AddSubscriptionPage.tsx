/**
 * Add Subscription Page
 * Form for creating new tenant subscription
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createTenantSubscription, TenantSubscription } from '../api/tenantSubscriptionApi';
import { SubscriptionForm } from '../components/subscriptions/SubscriptionForm';
import { Button } from '../components/ui/button';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export const AddSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: Partial<TenantSubscription>) => {
    setLoading(true);
    try {
      const { data, error } = await createTenantSubscription(formData as Omit<TenantSubscription, '_id' | 'created_at' | 'updated_at' | 'version'>);
      
      if (error) {
        console.error('Error creating subscription:', error);
        toast.error(t('subscriptions.createError'));
        return;
      }

      toast.success(t('subscriptions.createSuccess'));
      navigate('/core/subscriptions');
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('subscriptions.createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/subscriptions');
  };

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
          
          <h1 className="text-3xl font-bold text-gray-900">{t('subscriptions.addSubscription')}</h1>
          <p className="text-gray-600 mt-1">{t('subscriptions.addSubscriptionDescription')}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <SubscriptionForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
