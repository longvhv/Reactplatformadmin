/**
 * Order Payment Tab - Payment information and processing
 */

import React from 'react';
import { CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import { OrderWithDetails, formatCurrency, formatDate } from '@/api/ordersApi';

interface OrderPaymentTabProps {
  order: OrderWithDetails;
  onRefresh: () => void;
}

export function OrderPaymentTab({ order }: OrderPaymentTabProps) {
  const paymentMethods: Record<string, string> = {
    CREDIT_CARD: 'Thẻ tín dụng',
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
    E_WALLET: 'Ví điện tử',
    CASH: 'Tiền mặt',
  };

  return (
    <div className="space-y-6">
      {/* Payment Status Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Trạng thái thanh toán</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {order.status === 'PAID' && (
                <>
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Đã thanh toán</p>
                    <p className="text-sm text-gray-500">Đơn hàng đã được thanh toán thành công</p>
                  </div>
                </>
              )}
              {order.status === 'PENDING' && (
                <>
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Chờ thanh toán</p>
                    <p className="text-sm text-gray-500">Đơn hàng đang chờ xử lý thanh toán</p>
                  </div>
                </>
              )}
              {(order.status === 'CANCELLED' || order.status === 'FAILED') && (
                <>
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {order.status === 'CANCELLED' ? 'Đã hủy' : 'Thanh toán thất bại'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.status === 'CANCELLED' 
                        ? 'Đơn hàng đã bị hủy' 
                        : 'Quá trình thanh toán không thành công'}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(order.total_amount, order.currency_code)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{order.currency_code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chi tiết thanh toán</h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Phương thức thanh toán</dt>
              <dd className="flex items-center text-sm text-gray-900">
                <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                {order.payment_method 
                  ? paymentMethods[order.payment_method] || order.payment_method
                  : 'Chưa xác định'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Số tiền</dt>
              <dd className="text-sm text-gray-900 font-semibold">
                {formatCurrency(order.total_amount, order.currency_code)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Đơn vị tiền tệ</dt>
              <dd className="text-sm text-gray-900">{order.currency_code}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Trạng thái</dt>
              <dd className="text-sm text-gray-900 font-medium">
                {order.status === 'PAID' && <span className="text-green-600">Đã thanh toán</span>}
                {order.status === 'PENDING' && <span className="text-yellow-600">Chờ thanh toán</span>}
                {order.status === 'CANCELLED' && <span className="text-gray-600">Đã hủy</span>}
                {order.status === 'FAILED' && <span className="text-red-600">Thất bại</span>}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Payment Timeline */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lịch sử thanh toán</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-900 font-medium">Đơn hàng đã tạo</p>
                      <p className="text-sm text-gray-500">Mã đơn: {order.order_number}</p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                </div>
              </li>

              {order.status === 'PAID' && (
                <li className="relative">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                        <CreditCard className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900 font-medium">Thanh toán thành công</p>
                        <p className="text-sm text-gray-500">
                          Phương thức: {order.payment_method 
                            ? paymentMethods[order.payment_method] || order.payment_method
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        {formatDate(order.updated_at)}
                      </div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Subscription Created Info */}
      {order.subscription_created && order.subscription_id && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Subscription đã được tạo thành công
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Subscription ID: <span className="font-mono">{order.subscription_id}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
