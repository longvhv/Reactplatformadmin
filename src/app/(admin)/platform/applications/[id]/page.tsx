/**
 * Application Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../../components/shim/next-navigation';
import { ArrowLeft, Settings, Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { Card } from '../../../../../../components/ui/card';
import { applicationsApi, Application } from '../../../../../../api/applicationsApi';
import { appCapabilitiesApi, AppCapability } from '../../../../../../api/appCapabilitiesApi';
import { AppCapabilityForm } from '../../../../../../components/applications/AppCapabilityForm';
import { showToast } from '../../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../../components/common/ConfirmDialog';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../../components/ui/dialog';

function ApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [app, setApp] = useState<Application | null>(null);
  const [capabilities, setCapabilities] = useState<AppCapability[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCapabilityModal, setShowCapabilityModal] = useState(false);
  const [editingCapability, setEditingCapability] = useState<AppCapability | undefined>(undefined);

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
      loadData(); // Reload all
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

  const handleDeleteCapability = async (cap: AppCapability) => {
    if (!confirm(`Are you sure you want to delete capability ${cap.code}?`)) return;
    try {
      await appCapabilitiesApi.delete(cap._id, cap.version);
      showToast.success('Success', 'Capability deleted');
      refreshCapabilities();
    } catch (error: any) {
      showToast.error('Error', error.message);
      refreshCapabilities();
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
          <Button onClick={() => router.push('/platform/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Settings}
        title={app.name}
        description={app.description || 'Application details'}
        backButton={{
          label: 'Back to Applications',
          onClick: () => router.push('/platform/applications'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/platform/applications/${id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
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
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Application Info</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">App Code:</dt>
                <dd className="font-mono text-sm">{app.code}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Status:</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-xs ${
                    app.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {app.is_active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Created At:</dt>
                <dd className="text-sm">
                  {new Date(app.created_at).toLocaleDateString('vi-VN')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Capabilities Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Capabilities ({capabilities.length})</h3>
              <Button size="sm" onClick={handleAddCapability}>Add Capability</Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 font-medium">
                  <tr>
                    <th className="px-4 py-2">Name / Code</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Default Value</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {capabilities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No capabilities defined.
                      </td>
                    </tr>
                  ) : (
                    capabilities.map((cap) => (
                      <tr key={cap._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 dark:text-white">{cap.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{cap.code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            cap.type === 'FEATURE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {cap.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {cap.type === 'FEATURE' ? (
                            cap.default_value?.enabled ? 'Enabled' : 'Disabled'
                          ) : (
                            `${cap.default_value?.value || 0} ${cap.default_value?.unit || ''}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            cap.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {cap.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditCapability(cap)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleCapability(cap)}>
                              {cap.status === 'active' ? <PowerOff className="w-4 h-4 text-orange-500" /> : <Power className="w-4 h-4 text-green-500" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCapability(cap)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageLayout>

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

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Application"
        description={`Delete "${app.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { ApplicationDetailPage };
export default ApplicationDetailPage;