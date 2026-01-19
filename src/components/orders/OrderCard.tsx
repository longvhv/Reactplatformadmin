/**
 * Order Card Component
 * Display subscription order in card format
 * ✅ Updated for new subscription_orders schema (2026-01-15)
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { Order, getStatusColor, getStatusLabel, getTypeColor, getTypeLabel } from '../../api/ordersApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { User, Calendar, CreditCard, DollarSign, Eye, Edit, Trash2, FileText, Package, Tag } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
}

export function OrderCard({ order, onEdit, onDelete }: OrderCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {order.order_number}
              </h3>
            </div>
            {order.po_number && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                PO: {order.po_number}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
            <Badge className={getTypeColor(order.type)}>
              {getTypeLabel(order.type)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Customer Info */}
        {order.billing_info?.customer_name ? (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {order.billing_info.customer_name}
              </p>
              {order.billing_info?.customer_email && (
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  {order.billing_info.customer_email}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400 italic text-xs">
              Chưa có thông tin khách hàng
            </p>
          </div>
        )}

        {/* Order Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {formatDate(order.created_at)}
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
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tạm tính:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(order.subtotal_amount, order.currency_code)}
              </span>
            </div>
            
            {/* Discount */}
            {order.discount_amount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Giảm giá:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{formatCurrency(order.discount_amount, order.currency_code)}
                </span>
              </div>
            )}
            
            {/* Tax */}
            {order.tax_amount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Thuế:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(order.tax_amount, order.currency_code)}
                </span>
              </div>
            )}
            
            {/* Credit Applied */}
            {order.credit_applied > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Credit:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  -{formatCurrency(order.credit_applied, order.currency_code)}
                </span>
              </div>
            )}
            
            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="font-bold text-gray-900 dark:text-white">Tổng:</span>
              </div>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(order.total_amount, order.currency_code)}
              </span>
            </div>
          </div>
        </div>

        {/* Items Count */}
        {order.items_snapshot && order.items_snapshot.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Package className="h-3 w-3" />
            <span>{order.items_snapshot.length} sản phẩm/dịch vụ</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/commerce/subscription-orders/${order._id}`)}
          className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400"
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
              className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <Edit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(order)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default OrderCard;