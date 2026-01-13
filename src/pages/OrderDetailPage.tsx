/**
 * Order Detail Page
 * Display detailed information about a subscription order
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscriptionOrderApi, SubscriptionOrder } from '../api/subscriptionOrderApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Edit2, Trash2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../providers/LanguageProvider';

export function OrderDetailPage() {
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order || !confirm(t('subscriptionOrders.confirmDeleteMessage', { code: order.order_code }))) return;

    try {
      await subscriptionOrderApi.softDelete(order._id!);
      toast.success(t('subscriptionOrders.orderDeleted'));
      navigate('/core/subscription-orders');
    } catch (error: any) {
      toast.error(t('subscriptionOrders.deleteError', { error: error.message }));
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/core/subscription-orders')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {order.order_code}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{order.billing_cycle}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/core/subscription-orders/edit/${order._id}`)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('subscriptionOrders.customer')}
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscriptionOrders.customerName')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscriptionOrders.customerEmail')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{order.customer_email}</p>
                </div>
                {order.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscriptionOrders.customerPhone')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{order.customer_phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('subscriptionOrders.title')}
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('subscriptionOrders.basePrice')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.base_price, order.currency)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('subscriptionOrders.discountAmount')}</span>
                    <span className="font-medium text-red-600">-{formatCurrency(order.discount_amount, order.currency)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('subscriptionOrders.taxAmount')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.tax_amount, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('subscriptionOrders.totalAmount')}</span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('subscriptionOrders.notes')}
                </h2>
                <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('subscriptionOrders.status')}</h3>
              <Badge className="mb-2">{t(`subscriptionOrders.status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`)}</Badge>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {order.auto_renewal ? '✓ ' + t('subscriptionOrders.autoRenewal') : ''}
              </p>
            </div>

            {/* Payment Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('subscriptionOrders.paymentStatus')}</h3>
              </div>
              <Badge className="mb-2">{t(`subscriptionOrders.payment${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}`)}</Badge>
              {order.payment_method && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {t('subscriptionOrders.paymentMethod')}: {order.payment_method}
                </p>
              )}
              {order.payment_date && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(order.payment_date)}
                </p>
              )}
            </div>

            {/* Timeline Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Timeline</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('subscriptionOrders.orderDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.order_date)}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{t('subscriptionOrders.startDate')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.start_date)}</p>
                </div>
                {order.end_date && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">{t('subscriptionOrders.endDate')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.end_date)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}