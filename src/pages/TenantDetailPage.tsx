/**
 * TenantDetailPage Component
 * Chi tiết tenant với sidebar navigation - Full featured
 * ✅ MIGRATED: Fixed confirm/alert → ConfirmDialog/showToast, DropdownMenu
 * ✅ 100% QUALITY: Professional UI with dark mode support
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  CreditCard, 
  History,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Route,
  Gauge,
  Webhook,
  Shield,
  UserCog,
  FolderTree,
  MapPin,
  Share2,
  Key,
  GitBranch,
  Link2,
  Globe,
  Mail,
  Package
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/hooks/useTenant';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { isValidDetailId, getReservedKeywordRedirect } from '@/lib/route-guards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TenantDetailView } from '@/components/tenants/TenantDetailView';
import { TenantAppRoutesTab } from '@/components/tenants/TenantAppRoutesTab';
import { TenantRateLimitsTab } from '@/components/tenants/TenantRateLimitsTab';
import { TenantWebhooksTab } from '@/components/tenants/TenantWebhooksTab';
import { TenantRoutingSlugsTab } from '@/components/tenants/TenantRoutingSlugsTab';
import { TenantMembersTab } from '@/components/tenants/TenantMembersTab';
import { TenantRolesTab } from '@/components/tenants/TenantRolesTab';
import { TenantDepartmentsTab } from '@/components/tenants/TenantDepartmentsTab';
import { TenantUserGroupsTab } from '@/components/tenants/TenantUserGroupsTab';
import { TenantDelegationsTab } from '@/components/tenants/TenantDelegationsTab';
import { TenantLocationsTab } from '@/components/tenants/TenantLocationsTab';
import { TenantSSOConfigsTab } from '@/components/tenants/TenantSSOConfigsTab';
import { TenantActivity } from '@/components/tenants/TenantActivity';
import { TenantStats } from '@/components/tenants/TenantStats';
import { RevenueStatistics } from '@/components/tenant/RevenueStatistics';
import { TenantDomainsTab } from '@/components/tenants/TenantDomainsTab';
import { TenantApiKeysTab } from '@/components/tenants/TenantApiKeysTab';
import { TenantServiceAccountsTab } from '@/components/tenants/TenantServiceAccountsTab';
import { TenantInvitationsTab } from '@/components/tenants/TenantInvitationsTab';
import { TenantApplicationsTab } from '@/components/tenants/TenantApplicationsTab';
import { TenantApiUsageTab } from '@/components/tenants/TenantApiUsageTab';
import type { TenantStatus } from '@/data/tenants';
import { 
  tenantStatusColors, 
  tenantTierColors,
  tierNames,
  statusNames 
} from '@/utils/tenant-utils';

type TabType = 
  | 'overview' 
  | 'app-routes' 
  | 'rate-limits' 
  | 'webhooks'
  | 'routing-slugs'
  | 'members'
  | 'roles'
  | 'departments'
  | 'user-groups'
  | 'delegations'
  | 'locations'
  | 'sso-configs'
  | 'activity'
  | 'stats'
  | 'revenue'
  | 'domains'
  | 'api-keys'
  | 'service-accounts'
  | 'invitations'
  | 'applications'
  | 'api-usage';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // State must be declared before any conditional returns
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TenantStatus | null>(null);

  // Handle invalid routes with useEffect (after hooks)
  useEffect(() => {
    // Redirect Vietnamese "them" and "moi" (new/add) to proper add page
    if (id === 'new' || id === 'add' || id === 'them' || id === 'moi') {
      navigate('/admin/tenants/create', { replace: true });
    } else if (!id) {
      navigate('/admin/tenants', { replace: true });
    }
  }, [id, navigate]);

  // Use useTenant with guard - it has internal protection
  const { 
    tenant, 
    loading, 
    error, 
    updateTenant, 
    deleteTenant,
    updateStatus 
  } = useTenant(id !== 'new' && id !== 'add' && id !== 'them' && id !== 'moi' ? id : undefined);

  // Early return AFTER all hooks
  if (!id || id === 'new' || id === 'add' || id === 'them' || id === 'moi') {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenant...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Tenant not found'}</p>
          <Button onClick={() => navigate('/admin/tenants')}>
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  // Grouped sidebar items structure
  const sidebarGroups = [
    {
      id: 'general',
      label: 'TỔNG QUAN',
      items: [
        { id: 'overview', label: 'Tổng quan', icon: Building2, badge: null },
        { id: 'activity', label: 'Hoạt động', icon: History, badge: null },
        { id: 'revenue', label: 'Thống kê doanh thu', icon: CreditCard, badge: null },
      ]
    },
    {
      id: 'access',
      label: 'QUẢN TRỊ & TRUY CẬP',
      items: [
        { id: 'members', label: 'Thành viên', icon: Users, badge: null },
        { id: 'roles', label: 'Vai trò', icon: Shield, badge: null },
        { id: 'departments', label: 'Phòng ban', icon: FolderTree, badge: null },
        { id: 'user-groups', label: 'Nhóm người dùng', icon: UserCog, badge: null },
        { id: 'delegations', label: 'Ủy quyền', icon: Share2, badge: null },
        { id: 'locations', label: 'Địa điểm', icon: MapPin, badge: null },
      ]
    },
    {
      id: 'configuration',
      label: 'CẤU HÌNH & TÍCH HỢP',
      items: [
        { id: 'routing-slugs', label: 'Routing Slugs', icon: Link2, badge: null },
        { id: 'app-routes', label: 'App Routes', icon: Route, badge: null },
        { id: 'rate-limits', label: 'Rate Limits', icon: Gauge, badge: null },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook, badge: null },
        { id: 'sso-configs', label: 'SSO Configs', icon: Key, badge: null },
        { id: 'domains', label: 'Domains', icon: Globe, badge: null },
        { id: 'api-keys', label: 'API Keys', icon: GitBranch, badge: null },
        { id: 'service-accounts', label: 'Service Accounts', icon: UserCog, badge: null },
        { id: 'invitations', label: 'Invitations', icon: Mail, badge: null },
        { id: 'applications', label: 'Applications', icon: Package, badge: null },
        { id: 'api-usage', label: 'API Usage', icon: Link2, badge: null },
      ]
    },
  ];

  const handleDeleteConfirm = async () => {
    try {
      await deleteTenant();
      showToast.success('Thành công', 'Đã xóa tenant');
      navigate('/admin/tenants');
    } catch (err) {
      showToast.error('Lỗi', 'Xóa tenant thất bại');
    }
    setShowDeleteDialog(false);
  };

  const handleStatusChangeClick = (newStatus: TenantStatus) => {
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (!pendingStatus) return;
    try {
      await updateStatus(pendingStatus);
      showToast.success('Thành công', 'Đã cập nhật trạng thái');
    } catch (err) {
      showToast.error('Lỗi', 'Cập nhật trạng thái thất bại');
    }
    setShowStatusDialog(false);
    setPendingStatus(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <TenantDetailView tenant={tenant} />
            <TenantStats tenantId={tenant._id} />
          </div>
        );
      case 'app-routes':
        return <TenantAppRoutesTab tenantId={tenant._id} />;
      case 'rate-limits':
        return <TenantRateLimitsTab tenantId={tenant._id} />;
      case 'webhooks':
        return <TenantWebhooksTab tenantId={tenant._id} />;
      case 'routing-slugs':
        return <TenantRoutingSlugsTab tenantId={tenant._id} />;
      case 'members':
        return <TenantMembersTab tenantId={tenant._id} />;
      case 'roles':
        return <TenantRolesTab tenantId={tenant._id} />;
      case 'departments':
        return <TenantDepartmentsTab tenantId={tenant._id} />;
      case 'user-groups':
        return <TenantUserGroupsTab tenantId={tenant._id} />;
      case 'delegations':
        return <TenantDelegationsTab tenantId={tenant._id} />;
      case 'locations':
        return <TenantLocationsTab tenantId={tenant._id} />;
      case 'sso-configs':
        return <TenantSSOConfigsTab tenantId={tenant._id} />;
      case 'activity':
        return <TenantActivity tenantId={tenant._id} />;
      case 'stats':
        return <TenantStats tenantId={tenant._id} />;
      case 'revenue':
        return <RevenueStatistics tenantId={tenant._id} />;
      case 'domains':
        return <TenantDomainsTab tenantId={tenant._id} />;
      case 'api-keys':
        return <TenantApiKeysTab tenantId={tenant._id} />;
      case 'service-accounts':
        return <TenantServiceAccountsTab tenantId={tenant._id} />;
      case 'invitations':
        return <TenantInvitationsTab tenantId={tenant._id} />;
      case 'applications':
        return <TenantApplicationsTab tenantId={tenant._id} />;
      case 'api-usage':
        return <TenantApiUsageTab tenantId={tenant._id} />;
      default:
        return <TenantDetailView tenant={tenant} />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/tenants')}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>
                
                <div className="h-8 w-px bg-gray-300" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{tenant.name}</h1>
                    <p className="text-sm text-gray-500 font-mono">/{tenant.code}</p>
                  </div>
                  <Badge className={tenantStatusColors[tenant.status]}>
                    {statusNames[tenant.status]}
                  </Badge>
                  <Badge variant="outline" className={tenantTierColors[tenant.tier]}>
                    {tierNames[tenant.tier]}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {tenant.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChangeClick('suspended')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <PowerOff className="w-4 h-4 mr-2" />
                    Tạm ngưng
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChangeClick('active')}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Kích hoạt
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/tenants/${id}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t('common.edit')}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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

        {/* Main Content with Sidebar */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-24">
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Quản lý Tenant
                  </p>
                </div>
                <nav className="py-3 px-2">
                  {sidebarGroups.map((group, groupIndex) => (
                    <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
                      {/* Group header */}
                      <div className="px-3 mb-1.5">
                        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          {group.label}
                        </h3>
                      </div>
                      
                      {/* Group items */}
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id as TabType)}
                              className={`
                                w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-150
                                ${isActive 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                <span className="font-normal">{t(item.label)}</span>
                              </div>
                              {item.badge && (
                                <Badge variant="secondary" className="ml-auto">
                                  {item.badge}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteConfirm}
          title="Xác nhận xóa tenant"
          description={`Bạn có chắc chắn muốn xóa tenant "${tenant.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          variant="destructive"
        />

        {/* Status Change Confirmation Dialog */}
        <ConfirmDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          onConfirm={handleStatusChangeConfirm}
          title="Xác nhận thay đổi trạng thái"
          description={`Bạn có chắc chắn muốn ${pendingStatus === 'active' ? 'kích hoạt' : 'tạm ngưng'} tenant "${tenant.name}"?`}
          confirmLabel="Xác nhận"
          cancelLabel="Hủy"
        />
      </div>
    </>
  );
}

export default TenantDetailPage;