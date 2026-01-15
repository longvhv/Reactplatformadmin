/**
 * SubscriptionOverviewTab - Subscription overview information
 */

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Package, Building2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionOverviewTabProps {
  subscriptionId: string;
  subscription: {
    _id: string;
    tenant_id: string;
    package_id: string;
    price_amount: number;
    currency_code: string;
    granted_app_codes: string[];
    start_at: string;
    end_at?: string;
    status: string;
    version: number;
    created_at: string;
    updated_at: string;
    tenant_name: string;
    package_code: string;
    package_name: string;
    package_billing_cycle: string;
    product_name: string;
    days_remaining?: number;
    is_expired: boolean;
  };
}

export function SubscriptionOverviewTab({ subscriptionId, subscription: sub }: SubscriptionOverviewTabProps) {
  const calculateDaysActive = () => {
    const start = new Date(sub.start_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-50">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Giá trị</p>
              <p className="text-xl font-bold text-gray-900">
                {sub.price_amount.toLocaleString('vi-VN')}
              </p>
              <p className="text-xs text-gray-500">{sub.currency_code}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày bắt đầu</p>
              <p className="text-xl font-bold text-gray-900">
                {new Date(sub.start_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-50">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Đã hoạt động</p>
              <p className="text-xl font-bold text-gray-900">
                {calculateDaysActive()}
              </p>
              <p className="text-xs text-gray-500">ngày</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Apps</p>
              <p className="text-xl font-bold text-gray-900">
                {sub.granted_app_codes.length}
              </p>
              <p className="text-xs text-gray-500">ứng dụng</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin đăng ký
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Khách hàng
            </label>
            <Link
              to={`/core/tenants/${sub.tenant_id}`}
              className="flex items-center gap-2 text-indigo-600 hover:underline"
            >
              <Building2 className="w-4 h-4" />
              <span className="font-semibold">{sub.tenant_name}</span>
            </Link>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Gói dịch vụ
            </label>
            <Link
              to={`/core/packages/${sub.package_id}`}
              className="flex items-center gap-2 text-indigo-600 hover:underline"
            >
              <Package className="w-4 h-4" />
              <span className="font-semibold">{sub.package_name}</span>
            </Link>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Mã gói
            </label>
            <p className="text-base font-mono text-gray-900">{sub.package_code}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Chu kỳ thanh toán
            </label>
            <Badge>{sub.package_billing_cycle}</Badge>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Sản phẩm
            </label>
            <p className="text-base text-gray-900">{sub.product_name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              Trạng thái
            </label>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  sub.status === 'ACTIVE' && !sub.is_expired
                    ? 'bg-green-100 text-green-800'
                    : sub.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {sub.status}
              </Badge>
              {sub.is_expired && (
                <Badge className="bg-red-100 text-red-800">Expired</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Duration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thời hạn đăng ký
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Ngày bắt đầu</p>
              <p className="text-sm text-gray-600">
                {new Date(sub.start_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Ngày kết thúc</p>
              <p className="text-sm text-gray-600">
                {sub.end_at 
                  ? new Date(sub.end_at).toLocaleString('vi-VN')
                  : 'Không giới hạn'}
              </p>
            </div>
          </div>

          {sub.days_remaining !== undefined && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Còn lại</p>
                <p className={`text-sm font-semibold ${
                  sub.days_remaining < 30 ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {sub.days_remaining} ngày
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Granted Apps */}
      {sub.granted_app_codes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ứng dụng được cấp quyền
          </h3>
          <div className="flex flex-wrap gap-2">
            {sub.granted_app_codes.map((appCode) => (
              <Badge key={appCode} className="bg-indigo-100 text-indigo-800 px-3 py-1">
                {appCode}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* System Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Thông tin hệ thống
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Subscription ID</p>
            <p className="text-sm font-mono text-gray-900">{sub._id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Version</p>
            <p className="text-sm text-gray-900">v{sub.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ngày tạo</p>
            <p className="text-sm text-gray-900">
              {new Date(sub.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
