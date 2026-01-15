/**
 * Add Service Delivery Page
 * Form để tạo dịch vụ mới (Consulting, Training, etc.)
 * ✅ Full validation & error handling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  serviceDeliveriesApi, 
  CreateServiceDeliveryRequest, 
  ServiceUnitType, 
  ServiceStatus 
} from '../api/serviceDeliveriesApi';
import { tenantsApi, Tenant } from '../api/tenantsApi';
import { ordersApi, SubscriptionOrder } from '../api/ordersApi';
import { FormPageLayout } from '../components/layout/FormPageLayout';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Save, X, Briefcase } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function AddServiceDeliveryPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form state
  const [tenantId, setTenantId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [unitType, setUnitType] = useState<ServiceUnitType>('HOUR');
  const [status, setStatus] = useState<ServiceStatus>('PENDING');
  const [startedAt, setStartedAt] = useState('');

  // Dropdown data
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load tenants
  useEffect(() => {
    tenantsApi.getAll()
      .then(setTenants)
      .catch(error => {
        console.error('Error loading tenants:', error);
        toast.error('Không thể tải danh sách tenant');
      })
      .finally(() => setLoadingTenants(false));
  }, []);

  // Load orders when tenant changes
  useEffect(() => {
    if (!tenantId) {
      setOrders([]);
      return;
    }

    setLoadingOrders(true);
    ordersApi.getAll({ tenant_id: tenantId })
      .then(setOrders)
      .catch(error => {
        console.error('Error loading orders:', error);
        toast.error('Không thể tải danh sách đơn hàng');
      })
      .finally(() => setLoadingOrders(false));
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!tenantId || !orderId || !serviceName.trim() || !totalUnits) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const units = Number(totalUnits);
    if (isNaN(units) || units <= 0) {
      toast.error('Tổng đơn vị phải là số dương');
      return;
    }

    try {
      setSaving(true);

      const request: CreateServiceDeliveryRequest = {
        tenant_id: tenantId,
        order_id: orderId,
        service_name: serviceName.trim(),
        total_units: units,
        used_units: 0,
        unit_type: unitType,
        status,
        delivery_notes: [],
        started_at: startedAt || undefined,
      };

      const created = await serviceDeliveriesApi.create(request);
      toast.success('Tạo dịch vụ thành công!');
      navigate(`/core/service-deliveries/${created._id}`);
    } catch (error: any) {
      console.error('Error creating service delivery:', error);
      toast.error('Lỗi khi tạo dịch vụ: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/service-deliveries');
  };

  return (
    <FormPageLayout
      title="Thêm Dịch Vụ"
      description="Tạo mới dịch vụ (Consulting, Training, Support)"
      icon={<Briefcase className="h-6 w-6" />}
      backLink="/core/service-deliveries"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tenant & Order */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Thông tin liên kết</h3>

            {/* Tenant */}
            <div>
              <Label htmlFor="tenant_id">Tenant *</Label>
              <Select value={tenantId} onValueChange={setTenantId} disabled={loadingTenants}>
                <SelectTrigger id="tenant_id" className="mt-2">
                  <SelectValue placeholder="-- Chọn Tenant --" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant._id} value={tenant._id}>
                      {tenant.display_name} ({tenant.tenant_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div>
              <Label htmlFor="order_id">Đơn hàng *</Label>
              <Select value={orderId} onValueChange={setOrderId} disabled={!tenantId || loadingOrders}>
                <SelectTrigger id="order_id" className="mt-2">
                  <SelectValue placeholder="-- Chọn đơn hàng --" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map(order => (
                    <SelectItem key={order._id} value={order._id}>
                      {order.order_number} - {order.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!tenantId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Vui lòng chọn Tenant trước
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Info */}
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
                  placeholder="10"
                  min="0"
                  step="0.5"
                  required
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  VD: 10 giờ, 5 buổi, 2 ngày
                </p>
              </div>

              {/* Unit Type */}
              <div>
                <Label htmlFor="unit_type">Loại đơn vị *</Label>
                <Select value={unitType} onValueChange={(v) => setUnitType(v as ServiceUnitType)}>
                  <SelectTrigger id="unit_type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOUR">Giờ</SelectItem>
                    <SelectItem value="SESSION">Buổi</SelectItem>
                    <SelectItem value="DAY">Ngày</SelectItem>
                    <SelectItem value="PROJECT">Dự án</SelectItem>
                  </SelectContent>
                </Select>
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
            {saving ? 'Đang lưu...' : 'Lưu dịch vụ'}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
}