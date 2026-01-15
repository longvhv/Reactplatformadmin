/**
 * Role Detail Tabs
 * View role details with tabs: Info, Permissions
 * 
 * ✅ UPDATED 2026-01-14: Uses new Role interface with 9 fields
 */

import React, { useState } from 'react';
import { Role } from '../../api/rolesApi';
import { Button } from '../ui/button';
import { X, Shield, Key, Edit, Crown, Users as UsersIcon } from 'lucide-react';

interface RoleDetailTabsProps {
  role: Role;
  onEdit?: () => void;
  onClose: () => void;
}

export function RoleDetailTabs({ role, onEdit, onClose }: RoleDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');

  const tabs = [
    { id: 'info' as const, label: 'Thông tin', icon: Shield },
    { id: 'permissions' as const, label: 'Quyền hạn', icon: Key },
  ];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const getTypeBadge = () => {
    if (role.type === 'SYSTEM') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-sm font-medium">
          <Crown className="w-3 h-3" />
          SYSTEM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-sm font-medium">
        <UsersIcon className="w-3 h-3" />
        CUSTOM
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {role.name}
                  </h2>
                  {getTypeBadge()}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {role.description || 'Không có mô tả'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && role.type === 'CUSTOM' && (
                <Button onClick={onEdit} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Tên vai trò</label>
                    <p className="text-sm text-gray-900 dark:text-white font-medium mt-1">
                      {role.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Loại</label>
                    <div className="mt-1">{getTypeBadge()}</div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 uppercase">Mô tả</label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {role.description || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Tổng quan quyền hạn
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase">
                      Tổng quyền
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {role.permission_codes.length}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-xs text-purple-600 dark:text-purple-400 uppercase">
                      Version
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      v{role.version}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Lịch sử
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500">Tạo lúc</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(role.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500">Cập nhật lúc</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(role.updated_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* IDs */}
              <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  System IDs
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Role ID</label>
                    <p className="text-xs font-mono text-gray-900 dark:text-white mt-1 break-all">
                      {role._id}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Tenant ID</label>
                    <p className="text-xs font-mono text-gray-900 dark:text-white mt-1 break-all">
                      {role.tenant_id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Danh sách quyền hạn ({role.permission_codes.length})
                </h3>
              </div>

              {role.permission_codes.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Chưa có quyền hạn nào</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {role.permission_codes.map((perm, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <Key className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-mono text-gray-900 dark:text-white">
                          {perm}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoleDetailTabs;
