/**
 * Capability Table Component
 * Display capabilities in table format
 * < 500 lines
 */

import React from 'react';
import { AppCapability } from '../../api/appCapabilityApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

interface CapabilityTableProps {
  capabilities: AppCapability[];
  onEdit?: (capability: AppCapability) => void;
  onDelete?: (capability: AppCapability) => void;
  loading?: boolean;
}

export function CapabilityTable({
  capabilities,
  onEdit,
  onDelete,
  loading,
}: CapabilityTableProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FEATURE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'LIMIT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'archived':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const renderDefaultValue = (capability: AppCapability) => {
    if (capability.type === 'FEATURE') {
      const enabled = capability.default_value?.enabled;
      return (
        <div className="flex items-center gap-2">
          {enabled ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">Bật</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Tắt</span>
            </>
          )}
        </div>
      );
    } else if (capability.type === 'LIMIT') {
      const value = capability.default_value?.value ?? 0;
      const unit = capability.default_value?.unit ?? '';
      return (
        <div className="text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
          {unit && <span className="text-gray-500 dark:text-gray-400 ml-1">{unit}</span>}
        </div>
      );
    }
    return '-';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (capabilities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Chưa có capability nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Capability
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Loại
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Giá trị mặc định
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {capabilities.map((capability) => (
            <tr key={capability._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="px-4 py-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {capability.name}
                  </div>
                  <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
                    {capability.code}
                  </div>
                  {capability.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {capability.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <Badge className={getTypeColor(capability.type)}>
                  {capability.type === 'FEATURE' ? 'Tính năng' : 'Giới hạn'}
                </Badge>
                {capability.is_required && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Bắt buộc
                  </Badge>
                )}
              </td>
              <td className="px-4 py-4">
                {renderDefaultValue(capability)}
              </td>
              <td className="px-4 py-4">
                <Badge className={getStatusColor(capability.status)}>
                  {capability.status}
                </Badge>
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(capability)}
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(capability)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
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