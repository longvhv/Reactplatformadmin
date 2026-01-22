/**
 * Audit Log Table Component
 * 
 * Displays audit logs in table format with filtering and actions
 */

import React from 'react';
import { useRouter } from '../../shim/next-navigation';
import { AuditLog } from '../../api/auditLogApi';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  User, 
  Shield,
  Monitor,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../../providers/LanguageProvider';

interface AuditLogTableProps {
  logs: AuditLog[];
  loading?: boolean;
  onViewDetails?: (log: AuditLog) => void;
}

export function AuditLogTable({ logs, loading, onViewDetails }: AuditLogTableProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const getStatusBadge = (status: string) => {
    const config = {
      SUCCESS: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: CheckCircle,
        label: 'Thành công',
      },
      FAILED: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: XCircle,
        label: 'Thất bại',
      },
    };

    const statusConfig = config[status as keyof typeof config] || config.SUCCESS;
    const Icon = statusConfig.icon;

    return (
      <Badge className={statusConfig.color}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      UPDATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      VIEW: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      LOGIN: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      LOGOUT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      EXPORT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      IMPORT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    };

    return (
      <Badge className={colors[action] || 'bg-gray-100 text-gray-800'}>
        {action}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN'),
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Không có dữ liệu
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Chưa có lịch sử hoạt động nào được ghi nhận
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hành động
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tài nguyên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                IP / Thiết bị
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => {
              const datetime = formatDateTime(log.event_time);
              
              return (
                <tr 
                  key={log._id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onViewDetails) {
                      onViewDetails(log);
                    } else {
                      router.push(`/admin/audit-logs/${log._id}`);
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {datetime.date}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {datetime.time}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.user_name || log.user_id}
                        </div>
                        {log.user_email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.user_email}
                          </div>
                        )}
                        {log.impersonator_id && (
                          <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-1">
                            <Shield className="h-3 w-3 mr-1" />
                            Bởi: {log.impersonator_name || log.impersonator_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {log.resource}
                    </div>
                    {log.resource_id && (
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        ID: {log.resource_id.substring(0, 8)}...
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3 w-3 mr-1" />
                      {log.ip_address}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Monitor className="h-3 w-3 mr-1" />
                      {log.user_agent.substring(0, 30)}...
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewDetails) {
                          onViewDetails(log);
                        } else {
                          router.push(`/admin/audit-logs/${log._id}`);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
