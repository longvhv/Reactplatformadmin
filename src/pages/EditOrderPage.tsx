/**
 * Edit Subscription Order Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscriptionOrderApi, SubscriptionOrder } from '../api/subscriptionOrderApi';
import { OrderForm } from '../components/orders/OrderForm';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [order, setOrder] = useState<SubscriptionOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      const data = await subscriptionOrderApi.getById(orderId);
      if (data) {
        setOrder(data);
      } else {
        toast.error(t('subscriptionOrders.loadError', { error: 'Not found' }));
        navigate('/core/subscription-orders');
      }
    } catch (error: any) {
      toast.error(t('subscriptionOrders.loadError', { error: error.message }));
      navigate('/core/subscription-orders');
    }
  };

  const handleSubmit = async (data: Partial<SubscriptionOrder>) => {
    if (!order?._id) return;

    try {
      setLoading(true);
      await subscriptionOrderApi.update(order._id, data, order.version || 1);
      toast.success(t('subscriptionOrders.orderUpdated'));
      navigate('/core/subscription-orders');
    } catch (error: any) {
      toast.error(t('subscriptionOrders.updateError', { error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
            {t('subscriptionOrders.edit')}
          </h1>
        </div>

        <OrderForm
          order={order}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/core/subscription-orders')}
          loading={loading}
        />
      </div>
    </div>
  );
}