/**
 * ProductLimitsTab - Manage product usage limits and quotas
 * ✅ Professional UI with dark mode support
 */

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Gauge, Edit, AlertTriangle } from 'lucide-react';

interface ProductLimitsTabProps {
  productId: string;
}

interface UsageLimit {
  id: string;
  name: string;
  key: string;
  limit: number;
  unit: string;
  enforced: boolean;
  warning_threshold: number;
}

export function ProductLimitsTab({ productId }: ProductLimitsTabProps) {
  const limits: UsageLimit[] = [
    {
      id: '1',
      name: 'API Requests',
      key: 'api_requests_per_month',
      limit: 100000,
      unit: 'requests/month',
      enforced: true,
      warning_threshold: 80,
    },
    {
      id: '2',
      name: 'Storage',
      key: 'storage_quota',
      limit: 50,
      unit: 'GB',
      enforced: true,
      warning_threshold: 90,
    },
    {
      id: '3',
      name: 'Team Members',
      key: 'max_users',
      limit: 50,
      unit: 'users',
      enforced: true,
      warning_threshold: 85,
    },
    {
      id: '4',
      name: 'Projects',
      key: 'max_projects',
      limit: 100,
      unit: 'projects',
      enforced: true,
      warning_threshold: 80,
    },
    {
      id: '5',
      name: 'Custom Domains',
      key: 'max_custom_domains',
      limit: 5,
      unit: 'domains',
      enforced: false,
      warning_threshold: 100,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Usage Limits & Quotas
            </h3>
          </div>
          <Button size="sm" variant="outline">
            Configure
          </Button>
        </div>

        <div className="space-y-4">
          {limits.map((limit) => (
            <div
              key={limit.id}
              className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {limit.name}
                    </h4>
                    {limit.enforced ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Enforced
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Soft Limit
                      </Badge>
                    )}
                  </div>
                  <code className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {limit.key}
                  </code>
                </div>

                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Limit</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {limit.limit.toLocaleString()} {limit.unit}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Warning At</p>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    {limit.warning_threshold}%
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Usage</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    0 / {limit.limit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Overage Policy */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Overage Policy
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-1">
                Automatic Blocking
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                When a hard limit is reached, the service will be temporarily blocked until the next billing cycle or upgrade.
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Overage Charges
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Extra API Requests (per 1000)</span>
                <span className="font-medium text-gray-900 dark:text-white">$0.10</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Extra Storage (per GB)</span>
                <span className="font-medium text-gray-900 dark:text-white">$2.00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Extra Team Member</span>
                <span className="font-medium text-gray-900 dark:text-white">$15.00/month</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
