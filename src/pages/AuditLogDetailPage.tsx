/**
 * Audit Log Detail Page
 * 
 * Hiển thị chi tiết đầy đủ của một audit log
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AuditLog, 
  getAuditLogById, 
  parseAuditLogDetails,
  AuditLogDetails 
} from '../api/auditLogApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  Shield,
  User,
  Calendar,
  MapPin,
  Monitor,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [log, setLog] = useState<AuditLog | null>(null);
  const [details, setDetails] = useState<AuditLogDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchLog = async () => {
      try {
        setLoading(true);
        const data = await getAuditLogById(id);
        setLog(data);
        
        if (data.details) {
          const parsedDetails = parseAuditLogDetails(data.details);
          setDetails(parsedDetails);
        }
      } catch (error) {
        console.error('Error fetching audit log:', error);
        toast.error('Không thể tải thông tin audit log');
        navigate('/core/audit-logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!log) {
    return null;
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('vi-VN'),
    };
  };

  const datetime = formatDateTime(log.event_time);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/core/audit-logs')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Shield className="w-6 h-6 text-indigo-600" />
                  Chi tiết Audit Log
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ID: {log._id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {log.status === 'SUCCESS' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Trạng thái sự kiện
              </h2>
              
              <div className="flex items-center gap-4">
                <Badge 
                  className={
                    log.status === 'SUCCESS'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }
                >
                  {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {log.action}
                </Badge>
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  {log.resource}
                </Badge>
              </div>

              {log.resource_id && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resource ID:</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white mt-1">
                    {log.resource_id}
                  </p>
                </div>
              )}
            </div>

            {/* Details Card */}
            {details && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Chi tiết thay đổi
                </h2>

                {/* Changes */}
                {details.changes && (
                  <div className="space-y-4">
                    {Object.entries(details.changes).map(([field, change]) => (
                      <div 
                        key={field}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                          {field}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Giá trị cũ
                            </p>
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                              <code className="text-sm text-red-800 dark:text-red-200">
                                {JSON.stringify(change.old, null, 2)}
                              </code>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Giá trị mới
                            </p>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                              <code className="text-sm text-green-800 dark:text-green-200">
                                {JSON.stringify(change.new, null, 2)}
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Before/After */}
                {(details.before || details.after) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {details.before && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Trước khi thay đổi
                        </p>
                        <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs overflow-x-auto">
                          {JSON.stringify(details.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {details.after && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sau khi thay đổi
                        </p>
                        <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs overflow-x-auto">
                          {JSON.stringify(details.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {details.error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Lỗi
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {details.error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {details.metadata && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Metadata
                    </p>
                    <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs overflow-x-auto">
                      {JSON.stringify(details.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Raw JSON */}
                {!details.changes && !details.before && !details.after && (
                  <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs overflow-x-auto">
                    {JSON.stringify(details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Time Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Thời gian
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ngày</p>
                  <p className="text-sm text-gray-900 dark:text-white">{datetime.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Giờ</p>
                  <p className="text-sm text-gray-900 dark:text-white">{datetime.time}</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Người thực hiện
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {log.user_id}
                  </p>
                </div>
                {log.user_name && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tên</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {log.user_name}
                    </p>
                  </div>
                )}
                {log.user_email && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {log.user_email}
                    </p>
                  </div>
                )}
              </div>

              {log.impersonator_id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-600" />
                    <p className="text-xs font-semibold text-orange-600">
                      Impersonation
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Impersonator ID
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">
                        {log.impersonator_id}
                      </p>
                    </div>
                    {log.impersonator_name && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tên</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {log.impersonator_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Network Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Thông tin mạng
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {log.ip_address}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    User Agent
                  </p>
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-700 dark:text-gray-300 break-all">
                      {log.user_agent}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Tenant
              </h3>
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {log.tenant_id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
