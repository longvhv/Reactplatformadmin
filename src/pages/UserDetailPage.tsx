/**
 * UserDetailPage Component
 * Chi tiết người dùng với sidebar navigation - Full featured
 * ✅ MIGRATED: Fixed confirm() → ConfirmDialog, toast → showToast, DropdownMenu
 * ✅ 100% QUALITY: Professional UI with proper dark mode support
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  User,
  Mail,
  Phone,
  Globe,
  Shield,
  Activity,
  Users,
  Settings,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  BarChart3,
  History,
  MoreVertical,
  Lock,
  Smartphone,
  Power,
  PowerOff,
  UserCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usersApi } from '@/api/usersApi';
import { useLanguage } from '@/providers/LanguageProvider';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Import tab components
import { UserStatsTab } from '@/components/users/UserStatsTab';
import { UserActivityTab } from '@/components/users/UserActivityTab';
import { UserTenantsTab } from '@/components/users/UserTenantsTab';
import { UserSessionsTab } from '@/components/users/UserSessionsTab';
import { UserDevicesTab } from '@/components/users/UserDevicesTab';
import { UserSecurityTab } from '@/components/users/UserSecurityTab';
import { UserOverviewTab } from '@/components/users/UserOverviewTab';
import { UserConsentsTab } from '@/components/users/UserConsentsTab';

interface UserDetail {
  _id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
  email_verified: boolean;
  phone_verified: boolean;
  locale?: string;
  mfa_enabled?: boolean;
  is_support_staff?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: number;
}

type TabType =
  | 'overview'
  | 'stats'
  | 'tenants'
  | 'sessions'
  | 'devices'
  | 'security'
  | 'activity'
  | 'consents';

function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<UserDetail['status'] | null>(null);

  useEffect(() => {
    if (id) {
      // Skip fetching for special routes like "new", "add", "moi", etc.
      if (id === 'new' || id === 'add' || id === 'create' || id === 'moi') {
        navigate('/admin/users/create', { replace: true });
        return;
      }
      fetchUser();
    } else {
      navigate('/admin/users');
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log('🔍 [UserDetailPage] Fetching user:', id);
      const data = await usersApi.getById(id!);
      console.log('✅ [UserDetailPage] User loaded:', data);
      setUser(data as UserDetail);
    } catch (error: any) {
      console.error('❌ [UserDetailPage] Error fetching user:', error);
      showToast.error('Lỗi', 'Không tìm thấy người dùng');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: UserDetail['status']) => {
    const configs = {
      ACTIVE: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        label: 'Active',
      },
      INACTIVE: {
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        label: 'Inactive',
      },
      SUSPENDED: {
        icon: XCircle,
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: 'Suspended',
      },
      LOCKED: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        label: 'Locked',
      },
    };
    const config = configs[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleUpdateStatusClick = (newStatus: UserDetail['status']) => {
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const handleUpdateStatusConfirm = async () => {
    if (!user || !pendingStatus) return;

    try {
      console.log('🔍 [UserDetailPage] Updating user status:', pendingStatus);
      const updated = await usersApi.updateStatus(id!, pendingStatus, user.version);
      console.log('✅ [UserDetailPage] User status updated:', updated);
      setUser(updated as UserDetail);
      showToast.success('Thành công', 'Đã cập nhật trạng thái người dùng');
    } catch (error: any) {
      console.error('❌ [UserDetailPage] Error updating status:', error);
      showToast.error('Lỗi', 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setShowStatusDialog(false);
      setPendingStatus(null);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      console.log('🔍 [UserDetailPage] Deleting user:', id);
      await usersApi.delete(id!);
      console.log('✅ [UserDetailPage] User deleted');
      showToast.success('Thành công', 'Đã xóa người dùng');
      navigate('/admin/users');
    } catch (error: any) {
      console.error('❌ [UserDetailPage] Error deleting user:', error);
      showToast.error('Lỗi', 'Không thể xóa người dùng. Vui lòng thử lại.');
    }
    setShowDeleteDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy người dùng</h2>
        <Button onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Tổng quan', icon: User, badge: null },
    { id: 'stats', label: 'Thống kê', icon: BarChart3, badge: null },
    { id: 'tenants', label: 'Tenants', icon: Users, badge: null },
    { id: 'sessions', label: 'Sessions', icon: Activity, badge: null },
    { id: 'devices', label: 'Thiết bị', icon: Smartphone, badge: null },
    { id: 'security', label: 'Bảo mật', icon: Shield, badge: null },
    { id: 'activity', label: 'Hoạt động', icon: History, badge: null },
    { id: 'consents', label: 'Đồng ý', icon: Lock, badge: null },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <UserOverviewTab userId={user._id} user={user} />;
      case 'stats':
        return <UserStatsTab userId={user._id} />;
      case 'tenants':
        return <UserTenantsTab userId={user._id} />;
      case 'sessions':
        return <UserSessionsTab userId={user._id} />;
      case 'devices':
        return <UserDevicesTab userId={user._id} />;
      case 'security':
        return <UserSecurityTab userId={user._id} user={user} />;
      case 'activity':
        return <UserActivityTab userId={user._id} />;
      case 'consents':
        return <UserConsentsTab userId={user._id} />;
      default:
        return <UserOverviewTab userId={user._id} user={user} />;
    }
  };

  const getStatusActionLabel = () => {
    if (!pendingStatus) return '';
    const labels: Record<UserDetail['status'], string> = {
      ACTIVE: 'kích hoạt',
      INACTIVE: 'vô hiệu hóa',
      SUSPENDED: 'tạm ngưng',
      LOCKED: 'khóa',
    };
    return labels[pendingStatus];
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/users')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>

                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {user.full_name}
                      </h1>
                      {user.is_support_staff && (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Support
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>

                  {getStatusBadge(user.status)}

                  {user.email_verified && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user.status === 'ACTIVE' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatusClick('SUSPENDED')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                  >
                    <PowerOff className="w-4 h-4 mr-2" />
                    Tạm ngưng
                  </Button>
                ) : user.status === 'SUSPENDED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatusClick('ACTIVE')}
                    className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Kích hoạt
                  </Button>
                ) : user.status === 'LOCKED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatusClick('ACTIVE')}
                    className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Mở khóa
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/users/${id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa người dùng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Quản lý Người dùng
                  </p>
                </div>
                <nav className="p-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabType)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all
                          ${isActive
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa người dùng"
        description={`Bạn có chắc chắn muốn xóa người dùng "${user.full_name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />

      {/* Status Update Confirmation Dialog */}
      <ConfirmDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        onConfirm={handleUpdateStatusConfirm}
        title="Xác nhận thay đổi trạng thái"
        description={`Bạn có chắc chắn muốn ${getStatusActionLabel()} người dùng "${user.full_name}"?`}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
      />
    </>
  );
}

// Default export for routing
export default UserDetailPage;