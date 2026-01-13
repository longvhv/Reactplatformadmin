/**
 * Add Subscription Order Page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionOrderApi } from '../api/subscriptionOrderApi';
import { OrderForm } from '../components/orders/OrderForm';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export function AddOrderPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<SubscriptionOrder>) => {
    try {
      setLoading(true);
      await subscriptionOrderApi.create(data as Omit<SubscriptionOrder, '_id' | 'created_at' | 'updated_at' | 'version'>);
      toast.success(t('subscriptionOrders.orderCreated'));
      navigate('/core/subscription-orders');
    } catch (error: any) {
      toast.error(t('subscriptionOrders.createError', { error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/core/subscription-orders')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('subscriptionOrders.addOrder')}
          </h1>
        </div>

        <OrderForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/core/subscription-orders')}
          loading={loading}
        />
      </div>
    </div>
  );
}