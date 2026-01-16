/**
 * Product Types List Component (Reusable)
 * Display product types in table format with CRUD actions
 * ✅ CREATED 2026-01-15: Theo chuẩn design system Indigo
 */

import React, { useState } from 'react';
import { ProductType } from '../../api/productTypesApi';
import { Button } from '../ui/button';
import { Package, Edit, Trash2, Eye, Search, RefreshCw, Plus, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '../ui/input';

interface ProductTypeListProps {
  productTypes: ProductType[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (productType: ProductType) => void;
  onDelete?: (productTypeId: string) => void;
  onView?: (productType: ProductType) => void;
  onToggleActive?: (productTypeId: string) => void;
  onRefresh?: () => void;
}

export function ProductTypeList({
  productTypes,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onToggleActive,
  onRefresh,
}: ProductTypeListProps) {
  const [search, setSearch] = useState('');

  const filteredProductTypes = productTypes.filter(type => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      type.code.toLowerCase().includes(s) ||
      type.name.toLowerCase().includes(s) ||
      type.description?.toLowerCase().includes(s)
    );
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
        <XCircle className="w-3 h-3" />
        Không hoạt động
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo mã, tên, mô tả..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm loại sản phẩm
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mã
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tên loại sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProductTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {search ? 'Không tìm thấy loại sản phẩm nào' : 'Chưa có loại sản phẩm nào'}
                  </td>
                </tr>
              ) : (
                filteredProductTypes.map(type => (
                  <tr key={type._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-indigo-600 dark:text-indigo-400">
                        {type.code}
                      </code>
                    </td>

                    {/* Name & Description */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {type.name}
                          </div>
                          {type.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {type.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStatusBadge(type.is_active)}
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(type.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(type.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <Button
                            onClick={() => onView(type)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onToggleActive && (
                          <Button
                            onClick={() => onToggleActive(type._id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={type.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {type.is_active ? (
                              <XCircle className="h-4 w-4 text-orange-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            onClick={() => onEdit(type)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            onClick={() => onDelete(type._id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị <span className="font-medium text-gray-900 dark:text-white">{filteredProductTypes.length}</span>{' '}
            / <span className="font-medium">{productTypes.length}</span> loại sản phẩm
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              {productTypes.filter(t => t.is_active).length} hoạt động
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-gray-600" />
              {productTypes.filter(t => !t.is_active).length} không hoạt động
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
