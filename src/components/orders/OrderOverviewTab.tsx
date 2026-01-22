/**
 * Order Overview Tab
 * Displays order summary, tenant info, and key metrics
 */

import React from 'react';
import { Link } from '../shim/next-navigation';
import { Building2, Package, CreditCard, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { OrderWithDetails, formatCurrency, formatDate } from '../../api/ordersApi';

interface OrderOverviewTabProps {
  order: OrderWithDetails;
  onRefresh: () => void;
}

export function OrderOverviewTab({ order }: OrderOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng tiền</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(order.total_amount, order.currency_code)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(order.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gói dịch vụ</p>
              <p className="text-lg font-semibold text-gray-900">
                {order.package_code}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Thanh toán</p>
              <p className="text-lg font-semibold text-gray-900">
                {order.payment_method || 'Chưa có'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Information */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Thông tin đơn hàng</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Mã đơn hàng</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{order.order_number}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Order ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{order._id}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Tenant</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link 
                  to={`/admin/tenants/${order.tenant_id}`}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                >
                  <Building2 className="w-4 h-4 mr-1" />
                  {order.tenant_name}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Gói dịch vụ</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link 
                  to={`/commerce/service-packages/${order.package_id}`}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                >
                  <Package className="w-4 h-4 mr-1" />
                  {order.package_name}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Sản phẩm</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.product_name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Chu kỳ thanh toán</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.package_snapshot?.billing_cycle || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(order.created_at)}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Cập nhật</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(order.updated_at)}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Version</dt>
              <dd className="mt-1 text-sm text-gray-900">v{order.version}</dd>
            </div>

            {order.subscription_created && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link 
                    to={`/commerce/tenant-subscriptions/${order.subscription_id}`}
                    className="inline-flex items-center text-green-600 hover:text-green-700"
                  >
                    Đã tạo - Xem chi tiết
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chi tiết giá</h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Giá gói ({order.package_code})</span>
              <span className="text-gray-900 font-medium">
                {order.package_snapshot?.price 
                  ? formatCurrency(order.package_snapshot.price, order.currency_code)
                  : 'N/A'
                }
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-base font-medium text-gray-900">Tổng cộng</span>
              <span className="text-base font-semibold text-gray-900">
                {formatCurrency(order.total_amount, order.currency_code)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}