/**
 * Category Table Component (Level 3)
 */

import React from 'react';
import { CategoryInstance, SystemCategoryType, CategoryStatusHelper } from '../../api/systemCategoriesApi';
import { Button } from '../ui/button';
import { Edit2, Trash2, Power, PowerOff } from 'lucide-react';

interface CategoryTableProps {
  categories: CategoryInstance[];
  categoryType: SystemCategoryType;
  onEdit: (category: CategoryInstance) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (category: CategoryInstance) => void;
  loading?: boolean;
}

export function CategoryTable({
  categories,
  categoryType,
  onEdit,
  onDelete,
  onToggleStatus,
  loading = false,
}: CategoryTableProps) {
  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Chưa có danh mục nào</p>
        <p className="text-sm text-gray-400 mt-1">Nhấn nút "Thêm" để tạo danh mục mới</p>
      </div>
    );
  }

  // Special handling for SystemCategoryType - show fixed columns instead of extraFields
  const isSystemCategoryType = categoryType.code === 'SYSTEM_CATEGORY_TYPE';
  
  // Get extra field codes for table columns
  const extraFieldCodes = !isSystemCategoryType 
    ? (categoryType.extra_fields?.map(f => f.code) || [])
    : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mã
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tên
            </th>
            {isSystemCategoryType ? (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã nhóm danh mục
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên bảng lưu dữ liệu
                </th>
              </>
            ) : (
              <>
                {extraFieldCodes.map((code) => {
                  const field = categoryType.extra_fields?.find(f => f.code === code);
                  return (
                    <th key={code} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {field?.name || code}
                    </th>
                  );
                })}
              </>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thứ tự
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {categories.map((category, index) => (
            <tr key={category.id || category.code || index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">
                {category.code}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                <div>
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                  )}
                </div>
              </td>
              {isSystemCategoryType ? (
                <>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono">{category.group_category_id || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-mono text-xs">{category.collection_name || 'system_categories'}</span>
                  </td>
                </>
              ) : (
                extraFieldCodes.map((code) => (
                  <td key={code} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {renderExtraFieldValue(category.metadata?.[code])}
                  </td>
                ))
              )}
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {category.order}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleStatus(category)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    CategoryStatusHelper.isActive(category.status)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}
                  disabled={!category.is_editable}
                >
                  {CategoryStatusHelper.isActive(category.status) ? (
                    <>
                      <Power className="h-3 w-3" />
                      Active
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-3 w-3" />
                      Inactive
                    </>
                  )}
                </button>
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                {category.is_editable && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(category)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(category.id || category._id!)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!category.id && !category._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {!category.is_editable && (
                  <span className="text-xs text-gray-400 italic">Hệ thống</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper function to render extra field values
function renderExtraFieldValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}