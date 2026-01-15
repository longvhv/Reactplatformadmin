/**
 * Add Digital Asset Page
 * Form để tạo tài sản số mới (Domain, SSL, License)
 * ✅ Full validation & error handling
 * ✅ FormPageLayout consistent design
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  digitalAssetsApi, 
  CreateDigitalAssetRequest, 
  AssetType, 
  AssetStatus 
} from '../api/digitalAssetsApi';
import { tenantsApi, Tenant } from '../api/tenantsApi';
import { ordersApi, SubscriptionOrder } from '../api/ordersApi';
import { FormPageLayout } from '../components/layout/FormPageLayout';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Save, X, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function AddDigitalAssetPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form state
  const [tenantId, setTenantId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('DOMAIN');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<AssetStatus>('PENDING');
  const [providerMetadata, setProviderMetadata] = useState('{}');
  const [activatedAt, setActivatedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

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
    if (!tenantId || !orderId || !name.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Parse provider metadata
    let parsedMetadata: Record<string, any> = {};
    try {
      if (providerMetadata.trim()) {
        parsedMetadata = JSON.parse(providerMetadata);
      }
    } catch (error) {
      toast.error('Provider Metadata không hợp lệ (phải là JSON)');
      return;
    }

    try {
      setSaving(true);

      const request: CreateDigitalAssetRequest = {
        tenant_id: tenantId,
        order_id: orderId,
        asset_type: assetType,
        name: name.trim(),
        status,
        provider_metadata: parsedMetadata,
        activated_at: activatedAt || undefined,
        expires_at: expiresAt || undefined,
      };

      const created = await digitalAssetsApi.create(request);
      toast.success('Tạo tài sản số thành công!');
      navigate(`/core/digital-assets/${created._id}`);
    } catch (error: any) {
      console.error('Error creating digital asset:', error);
      toast.error('Lỗi khi tạo tài sản số: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/digital-assets');
  };

  return (
    <FormPageLayout
      title="Thêm Tài Sản Số"
      description="Tạo mới tài sản số (Domain, SSL, License Key)"
      icon={<Shield className="h-6 w-6" />}
      backLink="/core/digital-assets"
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

        {/* Asset Info */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Thông tin tài sản</h3>

            {/* Asset Type */}
            <div>
              <Label htmlFor="asset_type">Loại tài sản *</Label>
              <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                <SelectTrigger id="asset_type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOMAIN">Tên miền</SelectItem>
                  <SelectItem value="SSL">Chứng chỉ SSL</SelectItem>
                  <SelectItem value="LICENSE_KEY">Giấy phép / License Key</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Tên tài sản *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="example.com hoặc SSL-2024-001"
                required
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                VD: example.com, *.example.com, LICENSE-ABC-123
              </p>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AssetStatus)}>
                <SelectTrigger id="status" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Chờ kích hoạt</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="EXPIRED">Hết hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Metadata */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Thời gian & Metadata</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Activated At */}
              <div>
                <Label htmlFor="activated_at">Ngày kích hoạt</Label>
                <Input
                  id="activated_at"
                  type="datetime-local"
                  value={activatedAt}
                  onChange={(e) => setActivatedAt(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Expires At */}
              <div>
                <Label htmlFor="expires_at">Ngày hết hạn</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Provider Metadata */}
            <div>
              <Label htmlFor="provider_metadata">Provider Metadata (JSON)</Label>
              <Textarea
                id="provider_metadata"
                value={providerMetadata}
                onChange={(e) => setProviderMetadata(e.target.value)}
                placeholder='{"provider": "GoDaddy", "account_id": "123"}'
                rows={4}
                className="mt-2 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Thông tin nhà cung cấp (JSON format)
              </p>
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
            {saving ? 'Đang lưu...' : 'Lưu tài sản'}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
}