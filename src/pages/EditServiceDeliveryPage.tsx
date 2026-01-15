/**
 * Edit Service Delivery Page
 * Form để chỉnh sửa thông tin dịch vụ
 * ✅ Load existing data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  serviceDeliveriesApi, 
  UpdateServiceDeliveryRequest,
  ServiceDeliveryWithDetails,
  ServiceUnitType, 
  ServiceStatus 
} from '../api/serviceDeliveriesApi';
import { FormPageLayout } from '../components/layout/FormPageLayout';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Save, X, Briefcase } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function EditServiceDeliveryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [delivery, setDelivery] = useState<ServiceDeliveryWithDetails | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [usedUnits, setUsedUnits] = useState('');
  const [status, setStatus] = useState<ServiceStatus>('PENDING');
  const [startedAt, setStartedAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');

  // Load delivery
  useEffect(() => {
    if (!id) {
      toast.error('ID không hợp lệ');
      navigate('/core/service-deliveries');
      return;
    }

    serviceDeliveriesApi.getById(id)
      .then((data) => {
        setDelivery(data);
        setServiceName(data.service_name);
        setTotalUnits(String(data.total_units));
        setUsedUnits(String(data.used_units));
        setStatus(data.status);
        setStartedAt(data.started_at ? data.started_at.slice(0, 16) : '');
        setCompletedAt(data.completed_at ? data.completed_at.slice(0, 16) : '');
      })
      .catch(error => {
        console.error('Error loading delivery:', error);
        toast.error('Không thể tải thông tin dịch vụ: ' + error.message);
        navigate('/core/service-deliveries');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !delivery) return;

    // Validation
    if (!serviceName.trim()) {
      toast.error('Tên dịch vụ không được để trống');
      return;
    }

    const total = Number(totalUnits);
    const used = Number(usedUnits);

    if (isNaN(total) || total <= 0) {
      toast.error('Tổng đơn vị phải là số dương');
      return;
    }

    if (isNaN(used) || used < 0) {
      toast.error('Đơn vị đã sử dụng phải >= 0');
      return;
    }

    if (used > total) {
      toast.error('Đơn vị đã sử dụng không được lớn hơn tổng đơn vị');
      return;
    }

    try {
      setSaving(true);

      const request: UpdateServiceDeliveryRequest = {
        service_name: serviceName.trim(),
        total_units: total,
        used_units: used,
        status,
        started_at: startedAt || undefined,
        completed_at: completedAt || undefined,
      };

      await serviceDeliveriesApi.update(id, request);
      toast.success('Cập nhật dịch vụ thành công!');
      navigate(`/core/service-deliveries/${id}`);
    } catch (error: any) {
      console.error('Error updating service delivery:', error);
      toast.error('Lỗi khi cập nhật: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/core/service-deliveries/${id}`);
  };

  if (loading) {
    return (
      <FormPageLayout
        title="Đang tải..."
        description="Vui lòng đợi"
        icon={<Briefcase className="h-6 w-6" />}
        backLink="/core/service-deliveries"
      >
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      </FormPageLayout>
    );
  }

  if (!delivery) {
    return null;
  }

  const remainingUnits = delivery.total_units - delivery.used_units;
  const progressPct = (delivery.used_units / delivery.total_units) * 100;

  return (
    <FormPageLayout
      title="Chỉnh Sửa Dịch Vụ"
      description={`Cập nhật thông tin: ${delivery.service_name}`}
      icon={<Briefcase className="h-6 w-6" />}
      backLink={`/core/service-deliveries/${id}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Readonly Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{delivery._id}</p>
              </div>
              <Badge variant="outline">{delivery.unit_type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tenant</p>
                <p className="text-sm">{delivery.tenant_name || delivery.tenant_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
                <p className="text-sm">{delivery.order_number || delivery.order_id}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tiến độ</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">
                  {progressPct.toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable Fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Thông tin dịch vụ</h3>

            {/* Service Name */}
            <div>
              <Label htmlFor="service_name">Tên dịch vụ *</Label>
              <Input
                id="service_name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Tư vấn triển khai hệ thống"
                required
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Units */}
              <div>
                <Label htmlFor="total_units">Tổng đơn vị *</Label>
                <Input
                  id="total_units"
                  type="number"
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  min="0"
                  step="0.5"
                  required
                  className="mt-2"
                />
              </div>

              {/* Used Units */}
              <div>
                <Label htmlFor="used_units">Đã sử dụng</Label>
                <Input
                  id="used_units"
                  type="number"
                  value={usedUnits}
                  onChange={(e) => setUsedUnits(e.target.value)}
                  min="0"
                  step="0.5"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Còn lại: {remainingUnits} {delivery.unit_type.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ServiceStatus)}>
                <SelectTrigger id="status" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Chờ bắt đầu</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Thời gian</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Started At */}
              <div>
                <Label htmlFor="started_at">Ngày bắt đầu</Label>
                <Input
                  id="started_at"
                  type="datetime-local"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Completed At */}
              <div>
                <Label htmlFor="completed_at">Ngày hoàn thành</Label>
                <Input
                  id="completed_at"
                  type="datetime-local"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
}
