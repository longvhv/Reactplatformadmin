/**
 * Traffic Log Detail Page
 * Displays details of a specific traffic log
 * ✅ MIGRATED: Using PageLayout for consistent UI/UX
 * ✅ 100% QUALITY: DropdownMenu + ConfirmDialog + Toast
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../providers/LanguageProvider';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Globe,
  Activity,
  Database,
  MoreVertical,
} from 'lucide-react';
import { getTrafficLogById, deleteTrafficLog, TrafficLog } from '../api/trafficLogsApi';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { StatusCodeBadge } from '../components/traffic-logs/StatusCodeBadge';
import { HttpMethodBadge } from '../components/traffic-logs/HttpMethodBadge';
import { PageLayout } from '../components/layout/PageLayout';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { showToast } from '../lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export default function TrafficLogDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [log, setLog] = useState<TrafficLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadLog();
    }
  }, [id]);

  const loadLog = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getTrafficLogById(id);
      setLog(data);
    } catch (error) {
      console.error('Error loading traffic log:', error);
      showToast.error('Lỗi', 'Không thể tải nhật ký truy cập');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    try {
      await deleteTrafficLog(id);
      showToast.success('Thành công', 'Đã xóa nhật ký truy cập');
      navigate('/platform/traffic-logs');
    } catch (error) {
      console.error('Error deleting log:', error);
      showToast.error('Lỗi', 'Xóa nhật ký truy cập thất bại');
    }
    setShowDeleteDialog(false);
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Không tìm thấy nhật ký truy cập</p>
          <Button onClick={() => navigate('/platform/traffic-logs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Activity}
        title="Chi tiết nhật ký truy cập"
        description={
          <div className="flex items-center gap-3 mt-2">
            <HttpMethodBadge method={log.method} />
            <StatusCodeBadge statusCode={log.status_code} />
            <span className="text-sm text-gray-500 font-mono">
              {log.latency_ms !== null && log.latency_ms !== undefined
                ? `${log.latency_ms} ms`
                : '-'}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/platform/traffic-logs')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Request Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Thông tin yêu cầu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Phương thức
                  </label>
                  <div className="mt-1">
                    <HttpMethodBadge method={log.method} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Đường dẫn
                  </label>
                  <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white break-all">
                    {log.path || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tên miền
                  </label>
                  <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                    {log.domain || '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Trạng thái
                  </label>
                  <div className="mt-1">
                    <StatusCodeBadge statusCode={log.status_code} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Độ trễ
                  </label>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {log.latency_ms !== null && log.latency_ms !== undefined
                      ? `${log.latency_ms} ms`
                      : '-'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Kích thước request
                  </label>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {formatBytes(log.request_size)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Kích thước response
                  </label>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {formatBytes(log.response_size)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng kích thước
                  </label>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {formatBytes((log.request_size || 0) + (log.response_size || 0))}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Client Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Thông tin client
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Địa chỉ IP
                </label>
                <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                  {log.ip_address || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  User Agent
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white break-all">
                  {log.user_agent || '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Metadata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mã ứng dụng
                </label>
                <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                  {log.app_code || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Vùng dữ liệu
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {log.data_region || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tenant ID
                </label>
                <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                  {log.tenant_id || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  User ID
                </label>
                <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                  {log.user_id || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Thời gian
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(log.timestamp)}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Log ID
                </label>
                <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
                  {log._id}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PageLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa nhật ký"
        description="Bạn có chắc chắn muốn xóa nhật ký truy cập này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </>
  );
}