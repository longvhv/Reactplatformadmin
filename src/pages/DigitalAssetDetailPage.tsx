/**
 * Digital Asset Detail Page
 * Hiển thị chi tiết tài sản số với các actions
 * ✅ View mode with edit/delete actions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  digitalAssetsApi, 
  DigitalAssetWithDetails,
  getAssetTypeLabel,
  getAssetTypeColor,
  getAssetStatusLabel,
  getAssetStatusColor,
  isAssetExpiringSoon,
  getDaysUntilExpiry,
} from '../api/digitalAssetsApi';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Shield, Edit, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function DigitalAssetDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [asset, setAsset] = useState<DigitalAssetWithDetails | null>(null);

  useEffect(() => {
    if (!id) {
      toast.error('ID không hợp lệ');
      navigate('/core/digital-assets');
      return;
    }

    loadAsset();
  }, [id]);

  const loadAsset = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await digitalAssetsApi.getById(id);
      setAsset(data);
    } catch (error: any) {
      console.error('Error loading asset:', error);
      toast.error('Không thể tải thông tin tài sản: ' + error.message);
      navigate('/core/digital-assets');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/core/digital-assets/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!id || !asset) return;

    const confirmed = window.confirm(
      `Xác nhận xóa tài sản số "${asset.name}"?\nHành động này không thể hoàn tác!`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await digitalAssetsApi.delete(id);
      toast.success('Đã xóa tài sản số thành công');
      navigate('/core/digital-assets');
    } catch (error: any) {
      console.error('Error deleting asset:', error);
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
        icon={<Shield className="h-6 w-6" />}
        backLink="/core/digital-assets"
        actions={[]}
      >
        <div className="text-center py-8">Đang tải dữ liệu...</div>
      </DetailPageLayout>
    );
  }

  if (!asset) {
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

  const expiringSoon = isAssetExpiringSoon(asset);
  const daysUntilExpiry = getDaysUntilExpiry(asset);

  return (
    <DetailPageLayout
      title={asset.name}
      subtitle={`Tài sản số: ${getAssetTypeLabel(asset.asset_type)}`}
      icon={<Shield className="h-6 w-6" />}
      backLink="/core/digital-assets"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Warning for expiring assets */}
        {expiringSoon && asset.status === 'ACTIVE' && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">
                    Tài sản sắp hết hạn!
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Còn {daysUntilExpiry} ngày cho đến khi tài sản này hết hạn. 
                    Vui lòng gia hạn trước khi quá muộn.
                  </p>
                </div>
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
                <p className="font-mono text-sm mt-1">{asset._id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loại tài sản</p>
                <Badge 
                  className={`mt-1 ${getAssetTypeColor(asset.asset_type)}`}
                >
                  {getAssetTypeLabel(asset.asset_type)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <Badge 
                  className={`mt-1 ${getAssetStatusColor(asset.status)}`}
                >
                  {getAssetStatusLabel(asset.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tên tài sản</p>
                <p className="font-semibold mt-1">{asset.name}</p>
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
                <p className="mt-1">{asset.tenant_name || asset.tenant_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
                <p className="mt-1">{asset.order_number || asset.order_id}</p>
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
                <p className="text-sm text-muted-foreground">Ngày kích hoạt</p>
                <p className="mt-1">
                  {asset.activated_at 
                    ? new Date(asset.activated_at).toLocaleString('vi-VN')
                    : 'Chưa kích hoạt'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày hết hạn</p>
                <p className="mt-1">
                  {asset.expires_at 
                    ? new Date(asset.expires_at).toLocaleString('vi-VN')
                    : 'Không có'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="mt-1">
                  {new Date(asset.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                <p className="mt-1">
                  {asset.updated_at 
                    ? new Date(asset.updated_at).toLocaleString('vi-VN')
                    : 'Chưa có'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Metadata */}
        {asset.provider_metadata && Object.keys(asset.provider_metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Provider Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {JSON.stringify(asset.provider_metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DetailPageLayout>
  );
}
