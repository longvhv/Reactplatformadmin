/**
 * Application Detail Page with Sidebar
 * ✅ UPDATED: Sidebar layout using ApplicationDetail.tsx UI patterns
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../components/shim/next-navigation';
import { 
  ArrowLeft, 
  Settings, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Power, 
  PowerOff,
  FileText,
  Package,
  History as HistoryIcon,
  Calendar,
  Hash,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/card';
import { applicationsApi, Application } from '../../../../../api/applicationsApi';
import { appCapabilitiesApi, AppCapability } from '../../../../../api/appCapabilitiesApi';
import { AppCapabilityForm } from '../../../../../components/applications/AppCapabilityForm';
import { showToast } from '../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog';

const SYSTEM_TENANT_ID = '000000000000000000000001'; // System tenant ID

type TabType = 'overview' | 'capabilities' | 'history';

// Helper functions
const getCapabilityTypeIcon = (type: string) => type === 'FEATURE' ? '✨' : '🔢';

const formatDefaultValue = (val: any) => {
  if (typeof val?.enabled === 'boolean') return val.enabled ? 'Enabled' : 'Disabled';
  if (typeof val?.value !== 'undefined') {
    return `${val.value} ${val.unit || ''}`;
  }
  return JSON.stringify(val);
};

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function ApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [capabilities, setCapabilities] = useState<AppCapability[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteCapDialog, setShowDeleteCapDialog] = useState(false);
  const [showCapabilityModal, setShowCapabilityModal] = useState(false);
  const [editingCapability, setEditingCapability] = useState<AppCapability | undefined>(undefined);
  const [deletingCapability, setDeletingCapability] = useState<AppCapability | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appData, capsData] = await Promise.all([
        applicationsApi.getById(id),
        appCapabilitiesApi.getAll({ app_id: id })
      ]);
      setApp(appData);
      setCapabilities(capsData);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const refreshCapabilities = async () => {
    try {
      const capsData = await appCapabilitiesApi.getAll({ app_id: id });
      setCapabilities(capsData);
    } catch (error) {
      console.error('Failed to refresh capabilities');
    }
  };

  const handleDelete = async () => {
    if (!app) return;
    try {
      await applicationsApi.delete(id, undefined, app.version);
      showToast.success('Success', 'Application deleted');
      router.push('/platform/applications');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async () => {
    if (!app) return;
    try {
      await applicationsApi.update(id, { 
        is_active: !app.is_active,
        version: app.version 
      });
      showToast.success('Success', `Application ${app.is_active ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (error: any) {
      showToast.error('Error', error.message);
      loadData();
    }
  };

  // Capability Handlers
  const handleAddCapability = () => {
    setEditingCapability(undefined);
    setShowCapabilityModal(true);
  };

  const handleEditCapability = (cap: AppCapability) => {
    setEditingCapability(cap);
    setShowCapabilityModal(true);
  };

  const handleToggleCapability = async (cap: AppCapability) => {
    try {
      const newStatus = cap.status === 'active' ? 'inactive' : 'active';
      await appCapabilitiesApi.update(cap._id, {
        status: newStatus,
        version: cap.version
      });
      showToast.success('Success', 'Capability updated');
      refreshCapabilities();
    } catch (error: any) {
      showToast.error('Error', error.message);
      refreshCapabilities();
    }
  };

  const handleDeleteCapabilityClick = (cap: AppCapability) => {
    setDeletingCapability(cap);
    setShowDeleteCapDialog(true);
  };

  const handleDeleteCapabilityConfirm = async () => {
    if (!deletingCapability) return;
    try {
      await appCapabilitiesApi.delete(deletingCapability._id, deletingCapability.version);
      showToast.success('Success', 'Capability deleted');
      refreshCapabilities();
    } catch (error: any) {
      showToast.error('Error', error.message);
      refreshCapabilities();
    } finally {
      setShowDeleteCapDialog(false);
      setDeletingCapability(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Application not found</p>
          <Button onClick={() => router.push('/platform/applications')}>
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  // Sidebar groups
  const sidebarGroups = [
    {
      id: 'general',
      label: 'TỔNG QUAN',
      items: [
        { id: 'overview', label: 'Thông tin chung', icon: FileText },
        { id: 'capabilities', label: 'Capabilities', icon: Zap, badge: capabilities.length },
      ]
    },
    {
      id: 'audit',
      label: 'QUẢN TRỊ',
      items: [
        { id: 'history', label: 'Lịch sử', icon: HistoryIcon },
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
                <CardTitle className="text-lg">Thông tin ứng dụng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500">App Code</label>
                    <div className="mt-1 font-mono text-sm font-semibold text-gray-900">{app.code}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge className={app.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {app.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <div className="mt-1 font-semibold text-gray-900">{app.name}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Version</label>
                    <div className="mt-1 font-mono text-sm font-semibold text-gray-900">v{app.version}</div>
                  </div>
                  {app.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-500">Description</label>
                      <div className="mt-1 text-gray-700">{app.description}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Zap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Total Capabilities</div>
                        <div className="text-2xl font-bold text-gray-900">{capabilities.length}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Active Capabilities</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {capabilities.filter(c => c.status === 'active').length}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Features</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {capabilities.filter(c => c.type === 'FEATURE').length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'capabilities':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Capabilities ({capabilities.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Features and limits for this application
                </p>
              </div>
              <Button onClick={handleAddCapability}>
                + Add Capability
              </Button>
            </div>

            {capabilities.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Settings className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No capabilities yet</h3>
                  <p className="text-gray-600 mb-4">
                    Add capabilities to define features and limits for this application
                  </p>
                  <Button onClick={handleAddCapability}>
                    Add Capability
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {capabilities.map((capability) => (
                  <Card key={capability._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getCapabilityTypeIcon(capability.type)}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {capability.name}
                              </h3>
                              <p className="text-sm font-mono text-gray-600">{capability.code}</p>
                            </div>
                            <Badge className={
                              capability.type === 'FEATURE'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }>
                              {capability.type}
                            </Badge>
                            <Badge className={
                              capability.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }>
                              {capability.status}
                            </Badge>
                          </div>

                          {capability.description && (
                            <p className="text-sm text-gray-700 mb-3">{capability.description}</p>
                          )}

                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">Default:</span>{' '}
                              <span className="font-mono font-semibold text-gray-900">
                                {formatDefaultValue(capability.default_value)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Version:</span>{' '}
                              <span className="text-gray-900">v{capability.version}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="sm" onClick={() => handleEditCapability(capability)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleCapability(capability)}
                          >
                            {capability.status === 'active' ? (
                              <PowerOff className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Power className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteCapabilityClick(capability)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5 text-green-600" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Created</div>
                    <div className="font-semibold text-gray-900">{formatDate(app.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Last Updated</div>
                    <div className="font-semibold text-gray-900">{formatDate(app.updated_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Version</div>
                    <Badge variant="secondary">v{app.version}</Badge>
                  </div>
                  {app.deleted_at && (
                    <div>
                      <div className="text-xs text-gray-500">Deleted</div>
                      <div className="font-semibold text-red-600">{formatDate(app.deleted_at)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

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
                  onClick={() => router.push('/platform/applications')}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="h-8 w-px bg-gray-300" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{app.name}</h1>
                    <p className="text-sm text-gray-500 font-mono">{app.code}</p>
                  </div>
                  <Badge className={app.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {app.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleActive}
                  className={app.is_active ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
                >
                  {app.is_active ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/platform/applications/edit/${id}`)}
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
                      Delete
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
                    Quản lý Ứng dụng
                  </p>
                </div>
                <nav className="py-3 px-2">
                  {sidebarGroups.map((group, groupIndex) => (
                    <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
                      <div className="px-3 mb-1.5">
                        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                          {group.label}
                        </h3>
                      </div>
                      
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
                              {item.badge !== undefined && (
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

        {/* Capability Modal */}
        <Dialog open={showCapabilityModal} onOpenChange={setShowCapabilityModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCapability ? 'Edit Capability' : 'Add Capability'}
              </DialogTitle>
            </DialogHeader>
            {app && (
              <AppCapabilityForm
                initialData={editingCapability}
                tenantId={SYSTEM_TENANT_ID}
                appId={app._id}
                onSubmit={async (data) => {
                  try {
                    if (editingCapability) {
                      await appCapabilitiesApi.update(editingCapability._id, data as any);
                      showToast.success('Success', 'Capability updated');
                    } else {
                      await appCapabilitiesApi.create(data as any);
                      showToast.success('Success', 'Capability created');
                    }
                    setShowCapabilityModal(false);
                    refreshCapabilities();
                  } catch (error: any) {
                    // Error handled in form but also caught here
                  }
                }}
                onCancel={() => setShowCapabilityModal(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Application Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Xóa ứng dụng"
          description={`Bạn có chắc chắn muốn xóa ứng dụng "${app.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          variant="destructive"
        />

        {/* Delete Capability Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteCapDialog}
          onOpenChange={setShowDeleteCapDialog}
          title="Xóa Capability"
          description={`Bạn có chắc chắn muốn xóa capability "${deletingCapability?.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDeleteCapabilityConfirm}
          variant="destructive"
        />
      </div>
    </>
  );
}

export { ApplicationDetailPage };
export default ApplicationDetailPage;
