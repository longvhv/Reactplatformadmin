/**
 * UserDetailPage Component
 * Chi tiết người dùng với sidebar navigation - Full featured
 * ✅ MIGRATED: Using Next.js shim for navigation with params
 * ✅ Fixed confirm() → ConfirmDialog, toast → showToast, DropdownMenu
 * ✅ 100% QUALITY: Professional UI with proper dark mode support
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
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
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { t } = useLanguage();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<UserDetail['status'] | null>(null);

  useEffect(() => {
    if (id) {
      if (id === 'new' || id === 'add' || id === 'create') {
        router.replace('/admin/users/create');
        return;
      }
      fetchUser();
    } else {
      router.push('/admin/users');
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getById(id!);
      setUser(data);
    } catch (error: any) {
      showToast.error('Error', 'User not found');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await usersApi.delete(id!);
      showToast.success('Success', 'User deleted');
      router.push('/admin/users');
    } catch (err) {
      showToast.error('Error', 'Failed to delete user');
    }
    setShowDeleteDialog(false);
  };

  const handleStatusChangeClick = (newStatus: UserDetail['status']) => {
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const handleUpdateStatusConfirm = async () => {
    if (!pendingStatus) return;
    try {
      await usersApi.update(id!, { status: pendingStatus });
      setUser(prev => prev ? { ...prev, status: pendingStatus } : null);
      showToast.success('Success', 'Status updated');
    } catch (err) {
      showToast.error('Error', 'Failed to update status');
    }
    setShowStatusDialog(false);
    setPendingStatus(null);
  };

  const getStatusActionLabel = () => {
    if (pendingStatus === 'ACTIVE') return 'activate';
    if (pendingStatus === 'SUSPENDED') return 'suspend';
    if (pendingStatus === 'LOCKED') return 'lock';
    return 'update';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      LOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.INACTIVE;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">User not found</p>
          <Button onClick={() => router.push('/admin/users')}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>
                
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{user.full_name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                  {user.email_verified && (
                    <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {user.mfa_enabled && (
                    <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400">
                      <Shield className="w-3 h-3 mr-1" />
                      MFA
                    </Badge>
                  )}
                  {user.is_support_staff && (
                    <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                      <Crown className="w-3 h-3 mr-1" />
                      Staff
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Actions */}
                {user.status === 'ACTIVE' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChangeClick('SUSPENDED')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                  >
                    <PowerOff className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChangeClick('ACTIVE')}
                    className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/users/${id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStatusChangeClick('LOCKED')}
                      className="text-orange-600"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Lock Account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="tenants">
                <Users className="w-4 h-4 mr-2" />
                Tenants
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Activity className="w-4 h-4 mr-2" />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="devices">
                <Smartphone className="w-4 h-4 mr-2" />
                Devices
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="activity">
                <History className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="consents">
                <UserCheck className="w-4 h-4 mr-2" />
                Consents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <UserOverviewTab user={user} />
            </TabsContent>

            <TabsContent value="stats">
              <UserStatsTab userId={user._id} />
            </TabsContent>

            <TabsContent value="tenants">
              <UserTenantsTab userId={user._id} />
            </TabsContent>

            <TabsContent value="sessions">
              <UserSessionsTab userId={user._id} />
            </TabsContent>

            <TabsContent value="devices">
              <UserDevicesTab userId={user._id} />
            </TabsContent>

            <TabsContent value="security">
              <UserSecurityTab userId={user._id} />
            </TabsContent>

            <TabsContent value="activity">
              <UserActivityTab userId={user._id} />
            </TabsContent>

            <TabsContent value="consents">
              <UserConsentsTab userId={user._id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteConfirm}
          title="Confirm delete user"
          description={`Are you sure you want to delete user "${user.full_name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
        />

        {/* Status Update Confirmation Dialog */}
        <ConfirmDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          onConfirm={handleUpdateStatusConfirm}
          title="Confirm status change"
          description={`Are you sure you want to ${getStatusActionLabel()} user "${user.full_name}"?`}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
        />
      </div>
    </>
  );
}

// Named export for reuse
export { UserDetailPage };

// Default export for routing
export default UserDetailPage;
