/**
 * SubscriptionEntitlementsTab - Display subscription entitlements
 */

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, X, Zap } from 'lucide-react';

interface SubscriptionEntitlementsTabProps {
  subscriptionId: string;
  subscription: {
    granted_entitlements: Record<string, any>;
    granted_app_codes: string[];
  };
}

export function SubscriptionEntitlementsTab({ 
  subscriptionId, 
  subscription 
}: SubscriptionEntitlementsTabProps) {
  const renderEntitlementValue = (value: any): JSX.Element => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <X className="w-5 h-5 text-red-600" />
      );
    }

    if (typeof value === 'number') {
      return <span className="text-lg font-bold text-indigo-600">{value.toLocaleString()}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-gray-900">{value}</span>;
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div className="bg-gray-50 rounded p-2">
          <pre className="text-xs text-gray-700">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      );
    }

    return <span className="text-gray-500">-</span>;
  };

  const renderEntitlementSection = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <Card key={key} className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            {key.replace(/_/g, ' ')}
          </h3>
          <div className="space-y-3">
            {Object.entries(value).map(([subKey, subValue]) => (
              <div key={subKey} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {subKey.replace(/_/g, ' ')}
                </span>
                <div>{renderEntitlementValue(subValue)}</div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    return (
      <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {key.replace(/_/g, ' ')}
        </span>
        <div>{renderEntitlementValue(value)}</div>
      </div>
    );
  };

  const hasEntitlements = subscription.granted_entitlements && 
    Object.keys(subscription.granted_entitlements).length > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-white">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Quyền lợi được cấp
            </h2>
            <p className="text-sm text-gray-600">
              {subscription.granted_app_codes.length} ứng dụng • {
                hasEntitlements 
                  ? `${Object.keys(subscription.granted_entitlements).length} nhóm quyền lợi`
                  : 'Không có quyền lợi'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Granted Apps */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ứng dụng có quyền truy cập
        </h3>
        {subscription.granted_app_codes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subscription.granted_app_codes.map((appCode) => (
              <div 
                key={appCode}
                className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200"
              >
                <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="font-mono text-sm text-gray-900">{appCode}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Không có ứng dụng nào được cấp quyền
          </p>
        )}
      </Card>

      {/* Entitlements Details */}
      {hasEntitlements ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết quyền lợi
          </h3>
          {Object.entries(subscription.granted_entitlements).map(([key, value]) =>
            renderEntitlementSection(key, value)
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chưa có quyền lợi
          </h3>
          <p className="text-gray-600">
            Gói đăng ký này chưa được cấu hình quyền lợi cụ thể.
          </p>
        </Card>
      )}

      {/* Raw JSON View */}
      {hasEntitlements && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            JSON Raw Data
          </h3>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
              {JSON.stringify(subscription.granted_entitlements, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
