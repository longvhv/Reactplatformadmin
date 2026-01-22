/**
 * AppRouteModal Component
 * Modal for creating/editing tenant app routes
 * Wraps EnhancedTenantAppRouteForm for consistency
 */

import React from 'react';
import { X } from 'lucide-react';
import { TenantAppRoute, CreateRouteRequest, UpdateRouteRequest } from '../../api/tenantAppRoutesApi';
import { EnhancedTenantAppRouteForm } from '../tenant-app-routes/EnhancedTenantAppRouteForm';

interface AppRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateRouteRequest | UpdateRouteRequest) => Promise<void>;
  route?: TenantAppRoute | null;
  tenantId?: string;
}

export function AppRouteModal({ isOpen, onClose, onSave, route, tenantId }: AppRouteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {route ? 'Chỉnh sửa Route' : 'Thêm Route mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <EnhancedTenantAppRouteForm
            tenantId={tenantId || ''}
            initialData={route || undefined}
            isEdit={!!route}
            onSubmit={async (data) => {
              await onSave(data);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

export default AppRouteModal;
