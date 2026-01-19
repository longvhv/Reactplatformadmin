/**
 * Audit Log Detail Page
 * 
 * Hiển thị chi tiết đầy đủ của một audit log
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  AuditLog, 
  getAuditLogById, 
  parseAuditLogDetails
} from '../api/auditLogApi';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
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
import { PageLayout } from '../components/layout/PageLayout';

export default function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [log, setLog] = useState<AuditLog | null>(null);
  const [details, setDetails] = useState<ReturnType<typeof parseAuditLogDetails> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchLog = async () => {
      try {
        setLoading(true);
        const data = await getAuditLogById(id);
        setLog(data);
        
        const parsedDetails = parseAuditLogDetails(data);
        setDetails(parsedDetails);
      } catch (error) {
        console.error('Error fetching audit log:', error);
        toast.error('Không thể tải thông tin audit log');
        navigate('/admin/audit-logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  const datetime = formatDateTime(log.created_at);

  return (
    <PageLayout
      icon={Shield}
      title="Chi tiết Audit Log"
      description={`ID: ${log._id}`}
      actions={
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/audit-logs')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Card */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thông tin sự kiện
            </h2>
            
            <div className="flex items-center gap-4 mb-4">
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
          </Card>

          {/* Changes Card */}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Chi tiết thay đổi
              </h2>
              <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs overflow-x-auto">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </Card>
          )}

          {/* Metadata Card */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Metadata
              </h2>
              <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 text-xs overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Time Info */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
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
          </Card>

          {/* User Info */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Người thực hiện
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {log.user_id}
                </p>
              </div>
            </div>
          </Card>

          {/* Network Info */}
          {(log.ip_address || log.user_agent) && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Thông tin mạng
              </h3>
              <div className="space-y-3">
                {log.ip_address && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {log.ip_address}
                    </p>
                  </div>
                )}
                {log.user_agent && (
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
                )}
              </div>
            </Card>
          )}

          {/* Tenant Info */}
          {log.tenant_id && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Tenant
              </h3>
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {log.tenant_id}
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
