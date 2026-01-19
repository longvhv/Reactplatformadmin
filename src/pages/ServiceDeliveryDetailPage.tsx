/**
 * Service Delivery Detail Page
 * Hiển thị chi tiết dịch vụ với delivery notes và progress tracking
 * ✅ MIGRATED: Fixed confirm → ConfirmDialog, toast → showToast
 * ✅ 100% QUALITY: Professional UI with DetailPageLayout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  serviceDeliveriesApi, 
  ServiceDeliveryWithDetails,
} from '../api/serviceDeliveriesApi';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Briefcase, Edit, Trash2, Calendar, TrendingUp, Clock, Package } from 'lucide-react';
import { showToast } from '../lib/toast';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

// Helper functions
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Chờ bắt đầu',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
};

const getUnitTypeLabel = (unitType: string) => {
  const labels: Record<string, string> = {
    HOUR: 'Giờ',
    SESSION: 'Buổi',
    DAY: 'Ngày',
    PROJECT: 'Dự án',
  };
  return labels[unitType] || unitType;
};

export default function ServiceDeliveryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [delivery, setDelivery] = useState<ServiceDeliveryWithDetails | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id) {
      showToast.error('Lỗi', 'ID không hợp lệ');
      navigate('/commerce/service-deliveries');
      return;
    }

    loadDelivery();
  }, [id]);

  const loadDelivery = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await serviceDeliveriesApi.getById(id);
      setDelivery(data);
    } catch (error: any) {
      console.error('Error loading service delivery:', error);
      showToast.error('Lỗi', 'Không thể tải thông tin dịch vụ: ' + error.message);
      navigate('/commerce/service-deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/commerce/service-deliveries/edit/${id}`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id || !delivery) return;

    try {
      setDeleting(true);
      await serviceDeliveriesApi.delete(id);
      showToast.success('Thành công', 'Đã xóa dịch vụ thành công');
      navigate('/commerce/service-deliveries');
    } catch (error: any) {
      console.error('Error deleting service delivery:', error);
      showToast.error('Lỗi', 'Lỗi khi xóa: ' + error.message);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <DetailPageLayout
        title="Đang tải..."
        subtitle="Vui lòng đợi"
        icon={Briefcase}
        backLink="/commerce/service-deliveries"
        actions={[]}
      >
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      </DetailPageLayout>
    );
  }

  if (!delivery) {
    return null;
  }

  const actions = [
    {
      label: 'Chỉnh sửa',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
      variant: 'default' as const,
    },
    {
      label: 'Xóa',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'destructive' as const,
      disabled: deleting,
    },
  ];

  const completionPercentage = delivery.total_units 
    ? Math.round((delivery.delivered_units / delivery.total_units) * 100)
    : 0;

  return (
    <>
      <DetailPageLayout
        title={delivery.service_name}
        subtitle={`Giao dịch vụ: ${delivery.service_type || 'N/A'}`}
        icon={Briefcase}
        backLink="/commerce/service-deliveries"
        actions={actions}
      >
        <div className="space-y-6">
          {/* Progress Bar */}
          {delivery.status === 'IN_PROGRESS' && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 dark:text-blue-200">
                      Tiến độ thực hiện: {completionPercentage}%
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {delivery.delivered_units} / {delivery.total_units} {getUnitTypeLabel(delivery.unit_type)}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono text-sm mt-1">{delivery._id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge 
                    className={`mt-1 ${getStatusColor(delivery.status)}`}
                  >
                    {getStatusLabel(delivery.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tên dịch vụ</p>
                  <p className="font-semibold mt-1">{delivery.service_name}</p>
                </div>
                {delivery.service_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Loại dịch vụ</p>
                    <p className="mt-1">{delivery.service_type}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Liên kết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                  <p className="mt-1">{delivery.tenant_name || delivery.tenant_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đơn hàng</p>
                  <p className="mt-1">{delivery.order_number || delivery.order_id}</p>
                </div>
                {delivery.subscription_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription ID</p>
                    <p className="font-mono text-xs mt-1">{delivery.subscription_id}</p>
                  </div>
                )}
                {delivery.service_package_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Service Package</p>
                    <p className="font-mono text-xs mt-1">{delivery.service_package_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Chi tiết dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng số đơn vị</p>
                  <p className="text-2xl font-bold mt-1">
                    {delivery.total_units} {getUnitTypeLabel(delivery.unit_type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đã giao</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {delivery.delivered_units}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Còn lại</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {delivery.total_units - delivery.delivered_units}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch trình
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {delivery.scheduled_start && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày bắt đầu dự kiến</p>
                    <p className="mt-1">{new Date(delivery.scheduled_start).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                {delivery.scheduled_end && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày kết thúc dự kiến</p>
                    <p className="mt-1">{new Date(delivery.scheduled_end).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                {delivery.actual_start && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày bắt đầu thực tế</p>
                    <p className="mt-1 text-green-600 dark:text-green-400 font-semibold">
                      {new Date(delivery.actual_start).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
                {delivery.actual_end && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày kết thúc thực tế</p>
                    <p className="mt-1 text-green-600 dark:text-green-400 font-semibold">
                      {new Date(delivery.actual_end).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Notes */}
          {delivery.delivery_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú giao dịch vụ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{delivery.delivery_notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Personnel */}
          {delivery.assigned_to && delivery.assigned_to.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Người thực hiện</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {delivery.assigned_to.map((person, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                        {person.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm">{person}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {delivery.metadata && Object.keys(delivery.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto">
                  {JSON.stringify(delivery.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Audit Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Ngày tạo</p>
                  <p className="mt-1">{new Date(delivery.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày cập nhật</p>
                  <p className="mt-1">{new Date(delivery.updated_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="mt-1">v{delivery.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DetailPageLayout>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa dịch vụ"
        description={`Bạn có chắc chắn muốn xóa dịch vụ "${delivery.service_name}"? Hành động này không thể hoàn tác!`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </>
  );
}
