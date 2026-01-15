/**
 * UserSessionsTab Component
 * Manage user's active sessions
 * 
 * ✅ FIXED 2026-01-14: 
 * - Use userSessionsApi instead of non-existent /api/v1/users/${userId}/sessions
 * - Use correct UserSession interface with all 14 fields
 * - Parse device info from dedicated fields instead of user_agent
 */

import { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Trash2,
  CheckCircle,
  AlertCircle,
  MapPin,
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
import { userSessionsApi, type UserSession } from '@/api/userSessionsApi';
import { toast } from 'sonner';

interface UserSessionsTabProps {
  userId: string;
}

export function UserSessionsTab({ userId }: UserSessionsTabProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      console.log('🔍 [UserSessionsTab] Fetching sessions for user:', userId);
      
      // ✅ Use correct API
      const data = await userSessionsApi.getByUserId(userId);
      console.log('✅ [UserSessionsTab] Sessions loaded:', data);
      setSessions(data);
    } catch (error) {
      console.error('❌ [UserSessionsTab] Error fetching sessions:', error);
      toast.error('Không thể tải sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc muốn thu hồi session này?')) return;

    try {
      console.log('🔍 [UserSessionsTab] Revoking session:', sessionId);
      
      // ✅ Use API method
      await userSessionsApi.revokeSession(sessionId);
      console.log('✅ [UserSessionsTab] Session revoked');
      
      toast.success('Đã thu hồi session');
      await fetchSessions();
    } catch (error) {
      console.error('❌ [UserSessionsTab] Error revoking session:', error);
      toast.error('Không thể thu hồi session. Vui lòng thử lại.');
    }
  };

  const getDeviceIcon = (deviceType?: string | null) => {
    if (!deviceType) return Monitor;
    
    const type = deviceType.toLowerCase();
    if (type.includes('mobile') || type.includes('phone')) return Smartphone;
    if (type.includes('tablet') || type.includes('ipad')) return Tablet;
    return Monitor;
  };

  const formatTimeAgo = (date: string) => {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sessions</h2>
          <p className="text-sm text-gray-600">
            Quản lý các phiên đăng nhập đang hoạt động
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter((s) => s.is_active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Monitor className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.filter((s) => {
                  const hoursLeft = (new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
                  return hoursLeft < 24;
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thiết bị</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hoạt động gần nhất</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  Không có session nào
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device_type);
                const isExpiringSoon = session.expires_at 
                  ? (new Date(session.expires_at).getTime() - Date.now()) / (1000 * 60 * 60) < 24
                  : false;

                return (
                  <TableRow key={session._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-50">
                          <DeviceIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {session.device_name || session.browser || 'Unknown Device'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.os || 'Unknown OS'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-mono text-gray-900">
                            {session.ip_address || '-'}
                          </p>
                          {session.location && (
                            <p className="text-xs text-gray-500">{session.location}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {session.is_active ? (
                        <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        {session.last_activity_at 
                          ? formatTimeAgo(session.last_activity_at)
                          : '-'
                        }
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">
                          {session.expires_at 
                            ? new Date(session.expires_at).toLocaleDateString('vi-VN')
                            : '-'
                          }
                        </p>
                        {isExpiringSoon && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs mt-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Sắp hết hạn
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Thu hồi
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
          <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Lưu ý bảo mật</h4>
            <p className="text-sm text-blue-800">
              Nếu bạn thấy session không quen thuộc, hãy thu hồi ngay lập tức và thay đổi mật khẩu.
              Các session sẽ tự động hết hạn sau 7 ngày không hoạt động.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}