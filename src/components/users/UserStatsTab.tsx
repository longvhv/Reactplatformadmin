/**
 * UserStatsTab Component
 * Display user statistics and activity metrics
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  FileText,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Monitor,
} from 'lucide-react';
import { Card } from '../ui/card';

interface UserStatsTabProps {
  userId: string;
}

interface UserStats {
  user_id: string;
  email: string;
  full_name: string;
  status: string;
  is_verified: boolean;
  mfa_enabled: boolean;
  created_at: string;
  
  tenants_count: number;
  active_memberships: number;
  primary_tenant_count: number;
  
  roles_count: number;
  groups_count: number;
  delegations_count: number;
  
  sessions_count: number;
  active_sessions: number;
  devices_count: number;
  last_login_at?: string;
  last_activity_at?: string;
  total_logins_count: number;
  
  failed_logins_count: number;
  last_failed_login_at?: string;
}

export function UserStatsTab({ userId }: UserStatsTabProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockStats: UserStats = {
        user_id: userId,
        email: 'user@example.com',
        full_name: 'Demo User',
        status: 'active',
        is_verified: true,
        mfa_enabled: Math.random() > 0.5,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        
        tenants_count: Math.floor(Math.random() * 5) + 1,
        active_memberships: Math.floor(Math.random() * 4) + 1,
        primary_tenant_count: 1,
        
        roles_count: Math.floor(Math.random() * 3) + 1,
        groups_count: Math.floor(Math.random() * 5) + 1,
        delegations_count: Math.floor(Math.random() * 3),
        
        sessions_count: Math.floor(Math.random() * 20) + 5,
        active_sessions: Math.floor(Math.random() * 3) + 1,
        devices_count: Math.floor(Math.random() * 4) + 1,
        last_login_at: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        total_logins_count: Math.floor(Math.random() * 500) + 100,
        
        failed_logins_count: Math.floor(Math.random() * 10),
        last_failed_login_at: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không thể tải thống kê
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organizations & Memberships */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tổ chức & Thành viên
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-50">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng tenants</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.tenants_count}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-50">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active memberships</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.active_memberships}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-50">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vai trò</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.roles_count}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Permissions & Groups */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quyền & Nhóm
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-indigo-50">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nhóm người dùng</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.groups_count}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-50">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ủy quyền</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.delegations_count}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-pink-50">
                <Shield className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">MFA Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.mfa_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sessions & Devices */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sessions & Thiết bị
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-teal-50">
                <Monitor className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active sessions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.active_sessions}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-cyan-50">
                <Monitor className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng sessions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.sessions_count}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-violet-50">
                <Monitor className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Thiết bị</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.devices_count}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Activity & Security */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hoạt động & Bảo mật
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Lần đăng nhập gần nhất</h4>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {stats.last_activity_at ? (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Date(stats.last_activity_at).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(stats.last_activity_at).toLocaleTimeString('vi-VN')}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">Chưa có dữ liệu</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Đăng nhập thất bại</h4>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {stats.failed_logins_count}
              </p>
              {stats.last_failed_login_at && (
                <p className="text-sm text-gray-600">
                  Lần cuối: {new Date(stats.last_failed_login_at).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Tổng lượt đăng nhập</h4>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total_logins_count}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Tài khoản tạo</h4>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                {new Date(stats.created_at).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-sm text-gray-600">
                {Math.floor((Date.now() - new Date(stats.created_at).getTime()) / (1000 * 60 * 60 * 24))} ngày trước
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}