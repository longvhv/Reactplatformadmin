/**
 * Order Table Component
 * Display subscription orders in table format
 * ✅ Updated for new subscription_orders schema (2026-01-15)
 */

import React from 'react';
import { useNavigate } from 'react-router';
import { Order, getStatusColor, getStatusLabel, getTypeColor, getTypeLabel } from '../../api/ordersApi';
import { useLanguage } from '../../providers/LanguageProvider';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, FileText } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  loading?: boolean;
}

export function OrderTable({ orders, onEdit, onDelete, loading }: OrderTableProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('subscriptionOrders.noOrders')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Mã đơn hàng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Loại
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Khách hàng
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ngày tạo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tổng tiền
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map((order) => (
            <tr 
              key={order._id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => navigate(`/core/subscription-orders/${order._id}`)}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {order.order_number}
                </button>
                {order.po_number && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PO: {order.po_number}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={getTypeColor(order.type)}>
                  {getTypeLabel(order.type)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {order.billing_info?.customer_name ? (
                  <>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {order.billing_info.customer_name}
                    </div>
                    {order.billing_info?.customer_email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.billing_info.customer_email}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Chưa có thông tin
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(order.created_at)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(order.total_amount, order.currency_code)}
                </div>
                {order.credit_applied > 0 && (
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    Credit: -{formatCurrency(order.credit_applied, order.currency_code)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(order);
                      }}
                      className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      <Edit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(order);
                      }}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderTable;