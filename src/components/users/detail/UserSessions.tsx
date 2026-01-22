/**
 * UserSessions Component
 * Quản lý phiên đăng nhập của user
 */

import { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  MapPin,
  Calendar,
  LogOut,
  Trash2
} from 'lucide-react';
import { Button } from '../../ui/button';
import { useUserSessions } from '../../../hooks/useUserSessions';

interface UserSessionsProps {
  userId: string;
}

export function UserSessions({ userId }: UserSessionsProps) {
  const { sessions, loading, error, revokeSession, revokeAllSessions } = useUserSessions(userId);

  const getDeviceIcon = (deviceType?: string) => {
    if (!deviceType) return Monitor;
    if (deviceType.toLowerCase().includes('mobile')) return Smartphone;
    if (deviceType.toLowerCase().includes('tablet')) return Tablet;
    return Monitor;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRevoke = async (sessionId: string) => {
    if (!confirm('Bạn có chắc muốn thu hồi phiên này?')) return;
    try {
      await revokeSession(sessionId);
    } catch (err) {
      alert('Thu hồi phiên thất bại');
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('Bạn có chắc muốn thu hồi TẤT CẢ phiên đăng nhập?')) return;
    try {
      await revokeAllSessions();
    } catch (err) {
      alert('Thu hồi thất bại');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Phiên đăng nhập</h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý các thiết bị đã đăng nhập
            </p>
          </div>
          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAll}
              className="gap-2 text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Thu hồi tất cả
            </Button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Không có phiên đăng nhập nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.device_type);
            const isExpired = new Date(session.expires_at) < new Date();
            
            return (
              <div key={session._id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <DeviceIcon className="w-6 h-6 text-gray-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {session.device_name || 'Unknown Device'}
                        </h3>
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        {session.ip_address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            IP: {session.ip_address}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Tạo: {formatDate(session.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Hết hạn: {formatDate(session.expires_at)}
                        </div>
                        {session.last_used_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Dùng lần cuối: {formatDate(session.last_used_at)}
                          </div>
                        )}
                      </div>

                      {session.user_agent && (
                        <p className="mt-2 text-xs text-gray-400 font-mono">
                          {session.user_agent.length > 100 
                            ? session.user_agent.substring(0, 100) + '...'
                            : session.user_agent
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(session._id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Tổng phiên</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {sessions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {sessions.filter(s => new Date(s.expires_at) > new Date()).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Đã hết hạn</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {sessions.filter(s => new Date(s.expires_at) <= new Date()).length}
          </p>
        </div>
      </div>
    </div>
  );
}