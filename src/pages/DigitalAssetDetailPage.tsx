/**
 * Digital Asset Detail Page
 * Hiển thị chi tiết tài sản số với các actions
 * ✅ MIGRATED: Fixed confirm → ConfirmDialog, toast → showToast
 * ✅ 100% QUALITY: Professional UI with DetailPageLayout
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
import { showToast } from '../lib/toast';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export default function DigitalAssetDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [asset, setAsset] = useState<DigitalAssetWithDetails | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id) {
      showToast.error('Lỗi', 'ID không hợp lệ');
      navigate('/commerce/digital-assets');
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
      showToast.error('Lỗi', 'Không thể tải thông tin tài sản: ' + error.message);
      navigate('/commerce/digital-assets');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/commerce/digital-assets/edit/${id}`);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id || !asset) return;

    try {
      setDeleting(true);
      await digitalAssetsApi.delete(id);
      showToast.success('Thành công', 'Đã xóa tài sản số thành công');
      navigate('/commerce/digital-assets');
    } catch (error: any) {
      console.error('Error deleting asset:', error);
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
        icon={Shield}
        backLink="/commerce/digital-assets"
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
    <>
      <DetailPageLayout
        title={asset.name}
        subtitle={`Tài sản số: ${getAssetTypeLabel(asset.asset_type)}`}
        icon={Shield}
        backLink="/commerce/digital-assets"
        actions={actions}
      >
        <div className="space-y-6">
          {/* Warning for expiring assets */}
          {expiringSoon && asset.status === 'ACTIVE' && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900 dark:text-orange-200">
                      Tài sản sắp hết hạn!
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
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
                {asset.subscription_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription ID</p>
                    <p className="font-mono text-xs mt-1">{asset.subscription_id}</p>
                  </div>
                )}
                {asset.service_package_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Service Package</p>
                    <p className="font-mono text-xs mt-1">{asset.service_package_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Asset Details */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết tài sản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {asset.license_key && (
                  <div>
                    <p className="text-sm text-muted-foreground">License Key</p>
                    <p className="font-mono text-sm mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {asset.license_key}
                    </p>
                  </div>
                )}
                {asset.activation_code && (
                  <div>
                    <p className="text-sm text-muted-foreground">Activation Code</p>
                    <p className="font-mono text-sm mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {asset.activation_code}
                    </p>
                  </div>
                )}
                {asset.download_url && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Download URL</p>
                    <a 
                      href={asset.download_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-1 block"
                    >
                      {asset.download_url}
                    </a>
                  </div>
                )}
                {asset.access_credentials && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Access Credentials</p>
                    <pre className="text-xs mt-1 bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                      {JSON.stringify(asset.access_credentials, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validity & Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thời hạn sử dụng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {asset.issued_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày cấp phát</p>
                    <p className="mt-1">{new Date(asset.issued_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                {asset.activated_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày kích hoạt</p>
                    <p className="mt-1">{new Date(asset.activated_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
                {asset.expires_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày hết hạn</p>
                    <p className={`mt-1 font-semibold ${expiringSoon ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                      {new Date(asset.expires_at).toLocaleDateString('vi-VN')}
                      {expiringSoon && ` (Còn ${daysUntilExpiry} ngày)`}
                    </p>
                  </div>
                )}
                {asset.last_used_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lần sử dụng cuối</p>
                    <p className="mt-1">{new Date(asset.last_used_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Limits */}
          {(asset.max_activations !== undefined || asset.activation_count !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle>Giới hạn sử dụng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {asset.max_activations !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Số lần kích hoạt tối đa</p>
                      <p className="mt-1 font-semibold">
                        {asset.max_activations === -1 ? 'Không giới hạn' : asset.max_activations}
                      </p>
                    </div>
                  )}
                  {asset.activation_count !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Đã kích hoạt</p>
                      <p className="mt-1 font-semibold">{asset.activation_count} lần</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {asset.metadata && Object.keys(asset.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto">
                  {JSON.stringify(asset.metadata, null, 2)}
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
                  <p className="mt-1">{new Date(asset.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày cập nhật</p>
                  <p className="mt-1">{new Date(asset.updated_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="mt-1">v{asset.version}</p>
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
        title="Xác nhận xóa tài sản số"
        description={`Bạn có chắc chắn muốn xóa tài sản số "${asset.name}"? Hành động này không thể hoàn tác!`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </>
  );
}
