/**
 * Order History Tab - Activity timeline and audit log
 */

import React from 'react';
import { Clock, ShoppingCart, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { OrderWithDetails, formatDate } from '../../api/ordersApi';

interface OrderHistoryTabProps {
  order: OrderWithDetails;
}

export function OrderHistoryTab({ order }: OrderHistoryTabProps) {
  // Build timeline events
  const events = [
    {
      id: 1,
      type: 'created',
      title: 'Đơn hàng được tạo',
      description: `Mã đơn: ${order.order_number}`,
      timestamp: order.created_at,
      icon: ShoppingCart,
      iconBg: 'bg-blue-500',
    },
  ];

  if (order.status === 'PAID') {
    events.push({
      id: 2,
      type: 'paid',
      title: 'Thanh toán thành công',
      description: order.payment_method 
        ? `Phương thức: ${order.payment_method}`
        : 'Đơn hàng đã được thanh toán',
      timestamp: order.updated_at,
      icon: CreditCard,
      iconBg: 'bg-green-500',
    });

    if (order.subscription_created) {
      events.push({
        id: 3,
        type: 'subscription_created',
        title: 'Subscription đã tạo',
        description: `Subscription ID: ${order.subscription_id}`,
        timestamp: order.updated_at,
        icon: CheckCircle,
        iconBg: 'bg-indigo-500',
      });
    }
  }

  if (order.status === 'CANCELLED') {
    events.push({
      id: 4,
      type: 'cancelled',
      title: 'Đơn hàng bị hủy',
      description: 'Đơn hàng đã được hủy bởi người dùng',
      timestamp: order.updated_at,
      icon: XCircle,
      iconBg: 'bg-red-500',
    });
  }

  if (order.status === 'FAILED') {
    events.push({
      id: 5,
      type: 'failed',
      title: 'Thanh toán thất bại',
      description: 'Quá trình thanh toán không thành công',
      timestamp: order.updated_at,
      icon: XCircle,
      iconBg: 'bg-red-500',
    });
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Timeline hoạt động</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {events.map((event, eventIdx) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {eventIdx !== events.length - 1 ? (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full ${event.iconBg} flex items-center justify-center ring-8 ring-white`}
                        >
                          <event.icon className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">{event.description}</p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={event.timestamp}>{formatDate(event.timestamp)}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Audit Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thuộc tính
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá trị
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Created At
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Updated At
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.updated_at)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Version
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  v{order.version}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Status
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.status}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Deleted At
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.deleted_at ? formatDate(order.deleted_at) : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Information</h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">Order ID</dt>
              <dd className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">{order._id}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Order Number</dt>
              <dd className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">{order.order_number}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Tenant ID</dt>
              <dd className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">{order.tenant_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Package ID</dt>
              <dd className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">{order.package_id}</dd>
            </div>
            {order.subscription_id && (
              <div>
                <dt className="text-gray-500 mb-1">Subscription ID</dt>
                <dd className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">{order.subscription_id}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}