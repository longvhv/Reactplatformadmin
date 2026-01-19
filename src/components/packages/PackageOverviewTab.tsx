/**
 * PackageOverviewTab - Package overview information
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Tag, Package as PackageIcon } from 'lucide-react';
import { Link } from 'react-router';

interface PackageOverviewTabProps {
  packageId: string;
  package: {
    _id: string;
    product_id: string;
    code: string;
    name: string;
    description?: string;
    billing_cycle: string;
    price: number;
    currency: string;
    entitlements_config: Record<string, any>;
    is_active: boolean;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    version: number;
  };
}

export function PackageOverviewTab({ packageId, package: pkg }: PackageOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin cơ bản
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Tên gói
            </label>
            <p className="text-base text-gray-900">{pkg.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Mã gói
            </label>
            <p className="text-base font-mono text-gray-900">{pkg.code}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Chu kỳ thanh toán
            </label>
            <Badge>{pkg.billing_cycle}</Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Giá
            </label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <p className="text-lg font-bold text-indigo-600">
                {pkg.price.toLocaleString('vi-VN')} {pkg.currency}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Product ID
            </label>
            <Link
              to={`/commerce/products/${pkg.product_id}`}
              className="text-sm text-indigo-600 hover:underline font-mono"
            >
              {pkg.product_id}
            </Link>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Trạng thái
            </label>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  pkg.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {pkg.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {pkg.is_public && (
                <Badge className="bg-blue-100 text-blue-800">Public</Badge>
              )}
            </div>
          </div>
        </div>

        {pkg.description && (
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Mô tả
            </label>
            <p className="text-base text-gray-700">{pkg.description}</p>
          </div>
        )}
      </Card>

      {/* Entitlements */}
      {pkg.entitlements_config && Object.keys(pkg.entitlements_config).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quyền lợi & Tính năng
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-900 overflow-x-auto">
              {JSON.stringify(pkg.entitlements_config, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {/* Timestamps */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin hệ thống
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Ngày tạo</p>
              <p className="text-sm text-gray-600">
                {new Date(pkg.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Cập nhật lần cuối</p>
              <p className="text-sm text-gray-600">
                {new Date(pkg.updated_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Version</p>
              <p className="text-sm text-gray-600">v{pkg.version}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <PackageIcon className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Package ID</p>
              <p className="text-sm text-gray-600 font-mono">{pkg._id}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
