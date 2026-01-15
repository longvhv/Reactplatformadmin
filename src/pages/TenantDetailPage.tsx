/**
 * TenantDetailPage Component
 * Chi tiết tenant với sidebar navigation - Full featured
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
  Link2
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/hooks/useTenant';
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
  | 'stats';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // State must be declared before any conditional returns
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showActions, setShowActions] = useState(false);

  // Handle invalid routes with useEffect (after hooks)
  useEffect(() => {
    if (id === 'new' || id === 'add') {
      navigate('/core/tenants/add', { replace: true });
    } else if (!id) {
      navigate('/core/tenants', { replace: true });
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
  } = useTenant(id !== 'new' && id !== 'add' ? id : undefined);

  // Early return AFTER all hooks
  if (!id || id === 'new' || id === 'add') {
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
          <Button onClick={() => navigate('/core/tenants')}>
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
        { id: 'stats', label: 'Thống kê', icon: BarChart3, badge: null },
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
      ]
    },
  ];

  const handleDelete = async () => {
    if (!confirm(t('tenants.confirmDelete'))) return;
    try {
      await deleteTenant();
      navigate('/core/tenants');
    } catch (err) {
      alert(t('tenants.deleteFailed'));
    }
  };

  const handleStatusChange = async (newStatus: TenantStatus) => {
    if (!confirm('Bạn có chắc muốn thay đổi trạng thái?')) return;
    try {
      await updateStatus(newStatus);
    } catch (err) {
      alert('Cập nhật trạng thái thất bại');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TenantDetailView tenant={tenant} />;
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
      default:
        return <TenantDetailView tenant={tenant} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/core/tenants')}
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
                  onClick={() => handleStatusChange('suspended')}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <PowerOff className="w-4 h-4 mr-2" />
                  Tạm ngưng
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('active')}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Power className="w-4 h-4 mr-2" />
                  Kích hoạt
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/core/tenants/edit/${id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                
                {showActions && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('common.delete')}
                      </button>
                    </div>
                  </>
                )}
              </div>
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
                              <span className="font-normal">{item.label}</span>
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
    </div>
  );
}

export default TenantDetailPage;