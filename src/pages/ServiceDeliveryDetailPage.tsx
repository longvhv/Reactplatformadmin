/**
 * Service Delivery Detail Page
 * Hiển thị chi tiết dịch vụ với delivery notes và progress tracking
 * ✅ View mode with edit/delete actions
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
import { Briefcase, Edit, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

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
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
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

  useEffect(() => {
    if (!id) {
      toast.error('ID không hợp lệ');
      navigate('/core/service-deliveries');
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
      console.error('Error loading delivery:', error);
      toast.error('Không thể tải thông tin dịch vụ: ' + error.message);
      navigate('/core/service-deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/core/service-deliveries/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id || !delivery) return;

    const confirmed = window.confirm(
      `Xác nhận xóa dịch vụ "${delivery.service_name}"?\nHành động này không thể hoàn tác!`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await serviceDeliveriesApi.delete(id);
      toast.success('Đã xóa dịch vụ thành công');
      navigate('/core/service-deliveries');
    } catch (error: any) {
      console.error('Error deleting delivery:', error);
      toast.error('Lỗi khi xóa: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DetailPageLayout
        title="Đang tải..."
        subtitle="Vui lòng đợi"
        icon={<Briefcase className="h-6 w-6" />}
        backLink="/core/service-deliveries"
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

  const remainingUnits = delivery.total_units - delivery.used_units;
  const progressPct = (delivery.used_units / delivery.total_units) * 100;

  return (
    <DetailPageLayout
      title={delivery.service_name}
      subtitle={`Dịch vụ: ${getUnitTypeLabel(delivery.unit_type)}`}
      icon={<Briefcase className="h-6 w-6" />}
      backLink="/core/service-deliveries"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Progress Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Tiến độ thực hiện</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Đã sử dụng</span>
                <span className="font-semibold">
                  {delivery.used_units} / {delivery.total_units} {getUnitTypeLabel(delivery.unit_type).toLowerCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-primary">
                  {progressPct.toFixed(0)}%
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Còn lại</span>
                <span className="font-semibold text-primary">
                  {remainingUnits} {getUnitTypeLabel(delivery.unit_type).toLowerCase()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <p className="text-sm text-muted-foreground">Loại đơn vị</p>
                <p className="font-semibold mt-1">{getUnitTypeLabel(delivery.unit_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tên dịch vụ</p>
                <p className="font-semibold mt-1">{delivery.service_name}</p>
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thời gian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                <p className="mt-1">
                  {delivery.started_at 
                    ? new Date(delivery.started_at).toLocaleString('vi-VN')
                    : 'Chưa bắt đầu'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày hoàn thành</p>
                <p className="mt-1">
                  {delivery.completed_at 
                    ? new Date(delivery.completed_at).toLocaleString('vi-VN')
                    : 'Chưa hoàn thành'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="mt-1">
                  {new Date(delivery.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                <p className="mt-1">
                  {delivery.updated_at 
                    ? new Date(delivery.updated_at).toLocaleString('vi-VN')
                    : 'Chưa có'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Notes */}
        {delivery.delivery_notes && delivery.delivery_notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Nhật ký thực hiện</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {delivery.delivery_notes.map((note, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold">{note.description}</p>
                      <Badge variant="outline">
                        {note.units_used} {getUnitTypeLabel(delivery.unit_type).toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.date).toLocaleDateString('vi-VN')}
                      {note.performed_by && ` • ${note.performed_by}`}
                    </p>
                    {note.notes && (
                      <p className="text-sm mt-2 text-muted-foreground">{note.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DetailPageLayout>
  );
}
