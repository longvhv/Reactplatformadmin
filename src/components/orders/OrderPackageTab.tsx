/**
 * Order Package Tab - Package snapshot information
 */

import React from 'react';
import { Package, Code } from 'lucide-react';
import { OrderWithDetails, formatCurrency } from '@/api/ordersApi';

interface OrderPackageTabProps {
  order: OrderWithDetails;
}

export function OrderPackageTab({ order }: OrderPackageTabProps) {
  const snapshot = order.package_snapshot;

  // Handle missing snapshot
  if (!snapshot) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex">
          <Package className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900">
              Package snapshot không khả dụng
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Thông tin gói dịch vụ không có sẵn cho đơn hàng này.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Package Info Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{snapshot.name}</h3>
              <p className="text-indigo-100">{snapshot.code}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{formatCurrency(snapshot.price, snapshot.currency)}</p>
            <p className="text-indigo-100 text-sm mt-1">{snapshot.billing_cycle}</p>
          </div>
        </div>
      </div>

      {/* Snapshot Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Code className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              Package Snapshot - Immutable Record
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Đây là bản chụp (snapshot) của gói dịch vụ tại thời điểm tạo đơn hàng. 
              Thông tin này không thay đổi kể cả khi gói dịch vụ gốc được cập nhật.
            </p>
          </div>
        </div>
      </div>

      {/* Package Details */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Thông tin gói dịch vụ</h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Mã gói</dt>
              <dd className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                {snapshot.code}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Tên gói</dt>
              <dd className="text-sm text-gray-900">{snapshot.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Giá</dt>
              <dd className="text-sm text-gray-900 font-semibold">
                {formatCurrency(snapshot.price, snapshot.currency)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Đơn vị tiền tệ</dt>
              <dd className="text-sm text-gray-900">{snapshot.currency}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-2">Chu kỳ thanh toán</dt>
              <dd className="text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {snapshot.billing_cycle}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Entitlements */}
      {snapshot.entitlements_config && Object.keys(snapshot.entitlements_config).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quyền lợi (Entitlements)</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(snapshot.entitlements_config).map(([appCode, config]: [string, any]) => (
                <div key={appCode} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">{appCode}</h4>
                  <dl className="grid grid-cols-2 gap-4">
                    {Object.entries(config).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <dt className="text-xs text-gray-500 mb-1">{key}</dt>
                        <dd className="text-sm text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* JSON Viewer */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Package Snapshot (JSON)</h3>
        </div>
        <div className="p-6">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}