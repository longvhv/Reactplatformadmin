/**
 * Edit Digital Asset Page
 * Form để chỉnh sửa thông tin tài sản số
 * ✅ Load existing data
 * ✅ Optimistic locking ready
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  digitalAssetsApi, 
  UpdateDigitalAssetRequest,
  DigitalAssetWithDetails,
  AssetType, 
  AssetStatus 
} from '../api/digitalAssetsApi';
import { FormPageLayout } from '../components/layout/FormPageLayout';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Save, X, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function EditDigitalAssetPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asset, setAsset] = useState<DigitalAssetWithDetails | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [status, setStatus] = useState<AssetStatus>('PENDING');
  const [providerMetadata, setProviderMetadata] = useState('{}');
  const [activatedAt, setActivatedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Load asset
  useEffect(() => {
    if (!id) {
      toast.error('ID không hợp lệ');
      navigate('/core/digital-assets');
      return;
    }

    digitalAssetsApi.getById(id)
      .then((data) => {
        setAsset(data);
        setName(data.name);
        setStatus(data.status);
        setProviderMetadata(JSON.stringify(data.provider_metadata || {}, null, 2));
        setActivatedAt(data.activated_at ? data.activated_at.slice(0, 16) : '');
        setExpiresAt(data.expires_at ? data.expires_at.slice(0, 16) : '');
      })
      .catch(error => {
        console.error('Error loading asset:', error);
        toast.error('Không thể tải thông tin tài sản: ' + error.message);
        navigate('/core/digital-assets');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !asset) return;

    // Validation
    if (!name.trim()) {
      toast.error('Tên tài sản không được để trống');
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

      const request: UpdateDigitalAssetRequest = {
        name: name.trim(),
        status,
        provider_metadata: parsedMetadata,
        activated_at: activatedAt || undefined,
        expires_at: expiresAt || undefined,
      };

      await digitalAssetsApi.update(id, request);
      toast.success('Cập nhật tài sản số thành công!');
      navigate(`/core/digital-assets/${id}`);
    } catch (error: any) {
      console.error('Error updating digital asset:', error);
      toast.error('Lỗi khi cập nhật: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/core/digital-assets/${id}`);
  };

  if (loading) {
    return (
      <FormPageLayout
        title="Đang tải..."
        description="Vui lòng đợi"
        icon={<Shield className="h-6 w-6" />}
        backLink="/core/digital-assets"
      >
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      </FormPageLayout>
    );
  }

  if (!asset) {
    return null;
  }

  return (
    <FormPageLayout
      title="Chỉnh Sửa Tài Sản Số"
      description={`Cập nhật thông tin: ${asset.name}`}
      icon={<Shield className="h-6 w-6" />}
      backLink={`/core/digital-assets/${id}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Readonly Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{asset._id}</p>
              </div>
              <Badge variant="outline">{asset.asset_type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tenant</p>
                <p className="text-sm">{asset.tenant_name || asset.tenant_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
                <p className="text-sm">{asset.order_number || asset.order_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable Fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Thông tin tài sản</h3>

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
                rows={6}
                className="mt-2 font-mono text-sm"
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
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
}
