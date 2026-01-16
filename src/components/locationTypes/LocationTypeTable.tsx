/**
 * Location Types Table Component
 * Displays location types in a data table with CRUD actions
 */

import React from 'react';
import { LocationType, formatCode, getFieldTypeColor } from '../../api/locationTypesApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit2, Trash2, Power, PowerOff, Copy, Settings } from 'lucide-react';
import { useLanguage } from '../../providers/LanguageProvider';

interface LocationTypeTableProps {
  locationTypes: LocationType[];
  onEdit: (locationType: LocationType) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (locationType: LocationType) => void;
  onClone?: (locationType: LocationType) => void;
  onManageFields?: (locationType: LocationType) => void;
  loading?: boolean;
}

export function LocationTypeTable({
  locationTypes,
  onEdit,
  onDelete,
  onToggleStatus,
  onClone,
  onManageFields,
  loading = false,
}: LocationTypeTableProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (locationTypes.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Settings className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('locationTypes.noData') || 'Chưa có loại địa điểm'}
        </h3>
        <p className="text-sm text-gray-500">
          {t('locationTypes.noDataDescription') || 'Nhấn nút "Thêm loại địa điểm" để bắt đầu'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('locationTypes.code') || 'Mã'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('locationTypes.name') || 'Tên'}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('locationTypes.description') || 'Mô tả'}
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('locationTypes.extraFields') || 'Trường động'}
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('locationTypes.type') || 'Loại'}
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.status') || 'Trạng thái'}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.actions') || 'Thao tác'}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {locationTypes.map((locationType) => (
            <tr 
              key={locationType._id}
              className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              {/* Code */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded text-xs font-mono">
                    {locationType.code}
                  </code>
                </div>
              </td>

              {/* Name */}
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {locationType.name}
                </div>
              </td>

              {/* Description */}
              <td className="px-4 py-3">
                <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {locationType.description || '-'}
                </div>
              </td>

              {/* Extra Fields Count */}
              <td className="px-4 py-3 text-center">
                {locationType.extra_fields && locationType.extra_fields.length > 0 ? (
                  <div className="flex items-center justify-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {locationType.extra_fields.length} {t('locationTypes.fields') || 'trường'}
                    </Badge>
                    {onManageFields && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageFields(locationType)}
                        className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>

              {/* System/Custom Badge */}
              <td className="px-4 py-3 text-center">
                {locationType.is_system ? (
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                    {t('locationTypes.system') || 'Hệ thống'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                    {t('locationTypes.custom') || 'Tùy chỉnh'}
                  </Badge>
                )}
              </td>

              {/* Status */}
              <td className="px-4 py-3 text-center">
                <Badge 
                  variant={locationType.is_active ? "default" : "secondary"}
                  className={locationType.is_active 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" 
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0"
                  }
                >
                  {locationType.is_active 
                    ? (t('common.active') || 'Hoạt động')
                    : (t('common.inactive') || 'Không hoạt động')
                  }
                </Badge>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  {/* Toggle Status */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleStatus(locationType)}
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    title={locationType.is_active 
                      ? (t('common.deactivate') || 'Vô hiệu hóa')
                      : (t('common.activate') || 'Kích hoạt')
                    }
                  >
                    {locationType.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Clone (if provided) */}
                  {onClone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onClone(locationType)}
                      className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title={t('common.clone') || 'Nhân bản'}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(locationType)}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300"
                    title={t('common.edit') || 'Sửa'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  {/* Delete (only for non-system types) */}
                  {!locationType.is_system && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(locationType._id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                      title={t('common.delete') || 'Xóa'}
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
