/**
 * ProductFeaturesTab - Manage product features
 * ✅ Professional UI with dark mode support
 */

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ListChecks, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface ProductFeaturesTabProps {
  productId: string;
}

interface Feature {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  value: string | number | boolean;
  type: 'boolean' | 'number' | 'string';
}

export function ProductFeaturesTab({ productId }: ProductFeaturesTabProps) {
  const [features, setFeatures] = useState<Feature[]>([
    {
      id: '1',
      name: 'API Access',
      key: 'api_access',
      enabled: true,
      value: true,
      type: 'boolean',
    },
    {
      id: '2',
      name: 'Custom Branding',
      key: 'custom_branding',
      enabled: true,
      value: true,
      type: 'boolean',
    },
    {
      id: '3',
      name: 'Max Projects',
      key: 'max_projects',
      enabled: true,
      value: 100,
      type: 'number',
    },
    {
      id: '4',
      name: 'Storage Quota (GB)',
      key: 'storage_quota',
      enabled: true,
      value: 50,
      type: 'number',
    },
    {
      id: '5',
      name: 'Priority Support',
      key: 'priority_support',
      enabled: false,
      value: false,
      type: 'boolean',
    },
  ]);

  const toggleFeature = (id: string) => {
    setFeatures(prev =>
      prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f)
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Product Features
            </h3>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
          </Button>
        </div>

        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleFeature(feature.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {feature.enabled ? (
                    <ToggleRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {feature.name}
                    </p>
                    {!feature.enabled && (
                      <Badge className="bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <code className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {feature.key}
                  </code>
                </div>

                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {feature.type}
                  </Badge>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {String(feature.value)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature Groups */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Feature Groups
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">
              Core Features
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-400">
              3 features enabled
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
              Advanced Features
            </h4>
            <p className="text-xs text-green-700 dark:text-green-400">
              2 features enabled
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
              Enterprise Features
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              0 features enabled
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
