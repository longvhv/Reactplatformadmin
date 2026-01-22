/**
 * Roles List Component (Reusable)
 * Display roles in table format with CRUD actions
 * Theo chuẩn docs/Collections.md line 212-221
 */

import React, { useState } from 'react';
import { Role } from '../../api/rolesApi';
import { Button } from '../ui/button';
import { Shield, Edit, Trash2, Eye, Search, RefreshCw, Plus } from 'lucide-react';
import { Input } from '../ui/input';

interface RolesListProps {
  roles: Role[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (role: Role) => void;
  onDelete?: (roleId: string) => void;
  onView?: (role: Role) => void;
  onRefresh?: () => void;
  showTenantColumn?: boolean;
}

export function RolesList({
  roles,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  showTenantColumn = false,
}: RolesListProps) {
  const [search, setSearch] = useState('');

  const filteredRoles = roles.filter(role => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      role.name.toLowerCase().includes(s) ||
      role.description?.toLowerCase().includes(s) ||
      role.type.toLowerCase().includes(s)
    );
  });

  const getTypeColor = (type: string) => {
    return type === 'SYSTEM'
      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên, mô tả..."
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
              Thêm vai trò
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
                  Vai trò
                </th>
                {showTenantColumn && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quyền hạn
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={showTenantColumn ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy vai trò nào
                  </td>
                </tr>
              ) : (
                filteredRoles.map(role => (
                  <tr key={role._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {/* Role Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <button
                            onClick={() => onView && onView(role)}
                            className="font-medium text-gray-900 dark:text-white truncate hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer text-left"
                          >
                            {role.name}
                          </button>
                          {role.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tenant */}
                    {showTenantColumn && (
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {role.tenant_id || 'System'}
                        </span>
                      </td>
                    )}

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          role.type
                        )}`}
                      >
                        {role.type === 'SYSTEM' ? 'Hệ thống' : 'Tùy chỉnh'}
                      </span>
                    </td>

                    {/* Permissions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {role.permission_codes.length} quyền
                        </span>
                        {role.permission_codes.includes('*') && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            (Toàn quyền)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                        {role.permission_codes.slice(0, 3).join(', ')}
                        {role.permission_codes.length > 3 && '...'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <Button
                            onClick={() => onView(role)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            onClick={() => onEdit(role)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={role.type === 'SYSTEM'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && role.type !== 'SYSTEM' && (
                          <Button
                            onClick={() => onDelete(role._id!)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Hiển thị <span className="font-medium text-gray-900 dark:text-white">{filteredRoles.length}</span>{' '}
          / <span className="font-medium">{roles.length}</span> vai trò
        </div>
      </div>
    </div>
  );
}