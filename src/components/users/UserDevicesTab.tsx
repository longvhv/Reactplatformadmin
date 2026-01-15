/**
 * UserDevicesTab Component
 * Manage user's registered devices
 * 
 * ✅ FIXED 2026-01-14:
 * - Use userDevicesApi instead of non-existent /api/v1/users/${userId}/devices
 * - Use correct UserDevice interface with all 27 fields
 * - Fix device_type enum (lowercase)
 * - Fix field name: last_seen_at → last_used_at
 * - Display additional device info (model, manufacturer, versions, status)
 */

import { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Tv,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  Shield,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { userDevicesApi, type UserDevice, type DeviceType } from '@/api/userDevicesApi';
import { toast } from 'sonner';

interface UserDevicesTabProps {
  userId: string;
}

export function UserDevicesTab({ userId }: UserDevicesTabProps) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, [userId]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      console.log('🔍 [UserDevicesTab] Fetching devices for user:', userId);
      
      // ✅ Use correct API
      const data = await userDevicesApi.getByUserId(userId);
      console.log('✅ [UserDevicesTab] Devices loaded:', data);
      setDevices(data);
    } catch (error) {
      console.error('❌ [UserDevicesTab] Error fetching devices:', error);
      toast.error('Không thể tải devices');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thiết bị này?')) return;

    try {
      console.log('🔍 [UserDevicesTab] Removing device:', deviceId);
      
      // ✅ Use API method
      await userDevicesApi.delete(deviceId);
      console.log('✅ [UserDevicesTab] Device removed');
      
      toast.success('Đã xóa thiết bị');
      await fetchDevices();
    } catch (error) {
      console.error('❌ [UserDevicesTab] Error removing device:', error);
      toast.error('Không thể xóa thiết bị. Vui lòng thử lại.');
    }
  };

  const handleToggleTrust = async (deviceId: string, currentTrust: boolean) => {
    try {
      console.log('🔍 [UserDevicesTab] Toggling trust for device:', deviceId);
      
      if (currentTrust) {
        await userDevicesApi.untrustDevice(deviceId);
        toast.success('Đã bỏ tin cậy thiết bị');
      } else {
        await userDevicesApi.trustDevice(deviceId);
        toast.success('Đã đánh dấu thiết bị là tin cậy');
      }
      
      console.log('✅ [UserDevicesTab] Device trust updated');
      await fetchDevices();
    } catch (error) {
      console.error('❌ [UserDevicesTab] Error toggling trust:', error);
      toast.error('Không thể cập nhật trạng thái tin cậy');
    }
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'watch':
        return Watch;
      case 'tv':
        return Tv;
      case 'desktop':
      default:
        return Monitor;
    }
  };

  const getDeviceColor = (type: DeviceType) => {
    switch (type) {
      case 'mobile':
        return 'bg-blue-100 text-blue-800';
      case 'tablet':
        return 'bg-purple-100 text-purple-800';
      case 'watch':
        return 'bg-pink-100 text-pink-800';
      case 'tv':
        return 'bg-indigo-100 text-indigo-800';
      case 'desktop':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date?: string | null) => {
    if (!date) return '-';
    
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thiết bị</h2>
          <p className="text-sm text-gray-600">
            Quản lý các thiết bị đã đăng ký
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <Monitor className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Desktop</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter((d) => d.device_type === 'desktop').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mobile</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter((d) => d.device_type === 'mobile').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Tablet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tablet</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter((d) => d.device_type === 'tablet').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Trusted</p>
              <p className="text-2xl font-bold text-gray-900">
                {devices.filter((d) => d.is_trusted).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Devices List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thiết bị</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Hệ điều hành</TableHead>
              <TableHead>Trình duyệt</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Trusted</TableHead>
              <TableHead>Hoạt động gần nhất</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                  Chưa có thiết bị nào
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.device_type);
                const isRecent = device.last_used_at 
                  ? (Date.now() - new Date(device.last_used_at).getTime()) / (1000 * 60 * 60) < 24
                  : false;

                return (
                  <TableRow key={device._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getDeviceColor(device.device_type).split(' ')[0]}`}>
                          <DeviceIcon className={`w-5 h-5 ${getDeviceColor(device.device_type).split(' ')[1]}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {device.device_name || device.device_model || 'Unknown Device'}
                          </p>
                          {device.manufacturer && (
                            <p className="text-xs text-gray-500">{device.manufacturer}</p>
                          )}
                          {isRecent && (
                            <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                              Active now
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={getDeviceColor(device.device_type)}>
                        {device.device_type}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="text-sm text-gray-900">
                          {device.os ? device.os.charAt(0).toUpperCase() + device.os.slice(1) : '-'}
                        </span>
                        {device.os_version && (
                          <p className="text-xs text-gray-500">{device.os_version}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <span className="text-sm text-gray-900">
                          {device.browser ? device.browser.charAt(0).toUpperCase() + device.browser.slice(1) : '-'}
                        </span>
                        {device.browser_version && (
                          <p className="text-xs text-gray-500">{device.browser_version}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status || 'active'}
                      </Badge>
                      {device.status === 'revoked' && device.revoked_reason && (
                        <p className="text-xs text-gray-500 mt-1">{device.revoked_reason}</p>
                      )}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleTrust(device._id, device.is_trusted || false)}
                        className="p-1"
                      >
                        {device.is_trusted ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 cursor-pointer">
                            <CheckCircle className="w-3 h-3" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1 cursor-pointer">
                            <XCircle className="w-3 h-3" />
                            No
                          </Badge>
                        )}
                      </Button>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(device.last_used_at)}
                        </div>
                        {device.login_count && device.login_count > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {device.login_count} logins
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDevice(device._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Thiết bị tin cậy</h4>
            <p className="text-sm text-blue-800">
              Thiết bị tin cậy sẽ không yêu cầu xác thực hai yếu tố (MFA) khi đăng nhập.
              Chỉ đánh dấu tin cậy các thiết bị cá nhân và an toàn.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}