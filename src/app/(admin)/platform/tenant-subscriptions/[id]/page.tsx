/**
 * Tenant Subscription Detail Page with Sidebar
 * ✅ UPDATED: Sidebar layout matching Tenant Detail page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { 
  CreditCard, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Calendar, 
  Users, 
  HardDrive,
  FileText,
  History,
  Settings,
  Zap,
  Package,
  Building2,
  DollarSign
} from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { tenantSubscriptionsApi, SubscriptionWithDetails } from '../../../../../api/tenantSubscriptionsApi';
import { showToast } from '../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../components/common/ConfirmDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../../components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { SubscriptionEntitlementsTab } from '../../../../../components/tenant-subscriptions/SubscriptionEntitlementsTab';
import { SubscriptionHistoryTab } from '../../../../../components/tenant-subscriptions/SubscriptionHistoryTab';

type TabType = 
  | 'overview' 
  | 'entitlements' 
  | 'history'
  | 'billing'
  | 'usage';

export default function TenantSubscriptionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [data, setData] = useState<SubscriptionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await tenantSubscriptionsApi.getByIdWithDetails(id);
      setData(result);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    try {
      await tenantSubscriptionsApi.delete(id, data.version);
      showToast.success('Success', 'Subscription cancelled/deleted');
      router.push('/platform/tenant-subscriptions');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'trial': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'expired': return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Subscription not found</p>
          <Button onClick={() => router.push('/platform/tenant-subscriptions')}>
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  // Sidebar groups structure
  const sidebarGroups = [
    {
      id: 'general',
      label: 'TỔNG QUAN',
      items: [
        { id: 'overview', label: 'Chi tiết', icon: FileText, badge: null },
        { id: 'usage', label: 'Sử dụng', icon: HardDrive, badge: null },
        { id: 'billing', label: 'Thanh toán', icon: DollarSign, badge: null },
      ]
    },
    {
      id: 'features',
      label: 'TÍNH NĂNG & LỊCH SỬ',
      items: [
        { id: 'entitlements', label: 'Quyền lợi', icon: Zap, badge: null },
        { id: 'history', label: 'Lịch sử', icon: History, badge: null },
      ]
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(data.status)} variant="secondary">
                        {data.status.toUpperCase()}
                      </Badge>
                      {data.is_trial && <Badge className="ml-2 bg-blue-50 text-blue-700" variant="secondary">TRIAL</Badge>}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Auto Renew</label>
                    <div className="mt-1 font-medium">{data.auto_renew ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tenant</label>
                    <div className="mt-1 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {data.tenant_name || data.tenant_id}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Plan</label>
                    <div className="mt-1 font-medium flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      {data.plan_display_name || data.plan_name || 'Custom'}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Dates
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Start Date</label>
                      <div className="mt-1">{new Date(data.start_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">End Date</label>
                      <div className="mt-1">{new Date(data.end_date).toLocaleDateString()}</div>
                    </div>
                    {data.trial_end_date && (
                      <div>
                        <label className="text-sm text-gray-500">Trial Ends</label>
                        <div className="mt-1">{new Date(data.trial_end_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {data.renewal_date && (
                      <div>
                        <label className="text-sm text-gray-500">Renewal Date</label>
                        <div className="mt-1">{new Date(data.renewal_date).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>

                {data.notes && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="whitespace-pre-wrap text-sm text-gray-600">{data.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage & Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" /> Users
                      </span>
                      <span className="text-xs text-gray-500">
                        {data.current_users} / {data.max_users}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((data.current_users / data.max_users) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <HardDrive className="w-4 h-4" /> Storage
                      </span>
                      <span className="text-xs text-gray-500">
                        {data.current_storage_gb} / {data.max_storage_gb} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((data.current_storage_gb / data.max_storage_gb) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Billing Cycle</label>
                  <div className="mt-1 font-medium">{data.billing_cycle || 'Monthly'}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Billing Period Start</label>
                  <div className="mt-1">{data.billing_period_start ? new Date(data.billing_period_start).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Billing Period End</label>
                  <div className="mt-1">{data.billing_period_end ? new Date(data.billing_period_end).toLocaleDateString() : 'N/A'}</div>
                </div>
                {data.cancellation_date && (
                  <div className="border-t pt-4">
                    <label className="text-sm text-gray-500">Cancellation Date</label>
                    <div className="mt-1 text-red-600">{new Date(data.cancellation_date).toLocaleDateString()}</div>
                  </div>
                )}
                {data.cancellation_reason && (
                  <div>
                    <label className="text-sm text-gray-500">Cancellation Reason</label>
                    <div className="mt-1 text-sm text-gray-600">{data.cancellation_reason}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'entitlements':
        return <SubscriptionEntitlementsTab subscriptionId={id} />;

      case 'history':
        return <SubscriptionHistoryTab subscriptionId={id} />;

      default:
        return null;
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
                  onClick={() => router.push('/platform/tenant-subscriptions')}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="h-8 w-px bg-gray-300" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{data.subscription_name}</h1>
                    <p className="text-sm text-gray-500 font-mono">#{data.subscription_number}</p>
                  </div>
                  <Badge className={getStatusColor(data.status)} variant="secondary">
                    {data.status.toUpperCase()}
                  </Badge>
                  {data.is_trial && (
                    <Badge className="bg-blue-50 text-blue-700" variant="secondary">
                      TRIAL
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/platform/tenant-subscriptions/edit/${id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
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
                      Delete/Cancel
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
                    Quản lý Đăng ký
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          title="Confirm Cancellation/Deletion"
          description={`Are you sure you want to cancel/delete subscription "${data.subscription_name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
        />
      </div>
    </>
  );
}
