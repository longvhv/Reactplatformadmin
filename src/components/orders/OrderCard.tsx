/**
 * Order Card Component
 * Display subscription order in card format
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionOrder } from '../../api/subscriptionOrderApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface OrderCardProps {
  order: SubscriptionOrder;
  onEdit?: (order: SubscriptionOrder) => void;
  onDelete?: (order: SubscriptionOrder) => void;
}

export function OrderCard({ order, onEdit, onDelete }: OrderCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'suspended': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'refunded': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {order.order_code}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {order.billing_cycle}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getStatusColor(order.status)}>
              {t(`subscriptionOrders.status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`)}
            </Badge>
            <Badge className={getPaymentStatusColor(order.payment_status)}>
              {t(`subscriptionOrders.payment${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{order.customer_name}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">{order.customer_email}</p>
          </div>
        </div>

        {/* Order Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {formatDate(order.order_date)}
          </span>
        </div>

        {/* Payment Method */}
        {order.payment_method && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 capitalize">
              {order.payment_method.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Total Amount */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(order.total_amount, order.currency)}
          </span>
        </div>

        {/* Duration */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t('subscriptionOrders.startDate')}: {formatDate(order.start_date)}</span>
            {order.end_date && (
              <span>{t('subscriptionOrders.endDate')}: {formatDate(order.end_date)}</span>
            )}
          </div>
        </div>

        {/* Auto Renewal */}
        {order.auto_renewal && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ {t('subscriptionOrders.autoRenewal')}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/core/subscription-orders/${order._id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          {t('common.viewDetails')}
        </Button>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(order)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(order)}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}