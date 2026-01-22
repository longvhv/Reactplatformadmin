/**
 * Applications Page
 * Manage third-party applications
 * ✅ MIGRATED: Using Next.js shim for navigation
 * ✅ UPDATED 2026-01-15: Unified statistics design
 * ✅ FIXED: Use is_active boolean instead of status string
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { useApplications } from '@/hooks/useApplications';
import { useLanguage } from '@/providers/LanguageProvider';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Server, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle,
  Activity,
  MoreVertical,
  Settings,
  PowerOff,
  Power,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatisticsCards } from '@/components/common/StatisticsCards';

function ApplicationsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { 
    applications, 
    loading, 
    deleteApplication, 
    toggleActive,
    loadApplications,
  } = useApplications({ autoLoad: true });

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Format date helper
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  // Handle delete
  const handleDelete = async (id: string, name: string, version: number) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa ứng dụng',
      description: `Bạn có chắc chắn muốn xóa ứng dụng "${name}"?`,
      onConfirm: async () => {
        try {
          await deleteApplication(id, undefined, version);
          showToast.success('Thành công', 'Đã xóa ứng dụng');
        } catch (err) {
          showToast.error('Lỗi', 'Không thể xóa ứng dụng');
        }
      },
    });
  };

  // Handle toggle active
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleActive(id);
      showToast.success('Thành công', `Đã ${currentStatus ? 'tắt' : 'bật'} ứng dụng`);
    } catch (err) {
      showToast.error('Lỗi', 'Không thể thay đổi trạng thái');
    }
  };

  // Filter applications
  const filteredApps = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.name.toLowerCase().includes(query) ||
      app.code.toLowerCase().includes(query) ||
      (app.description && app.description.toLowerCase().includes(query))
    );
  });

  // Stats
  const stats = [
    { label: 'Total Apps', value: applications.length, color: 'indigo' as const, icon: Server },
    { label: 'Active', value: applications.filter(a => a.is_active).length, color: 'green' as const, icon: CheckCircle },
    { label: 'Inactive', value: applications.filter(a => !a.is_active).length, color: 'gray' as const, icon: XCircle },
    // Removed "With API" stat as capabilities are not in the main table
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Server}
        title={t('navigation.applications')}
        description="Manage third-party applications and integrations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadApplications}
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/platform/applications/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Application
            </Button>
          </div>
        }
      >
        {/* Stats */}
        <StatisticsCards stats={stats} columns={3} />

        {/* Search */}
        <Card className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search applications by name, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredApps.length} of {applications.length} applications
          </p>
        </Card>

        {/* Applications Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr 
                    key={app._id} 
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/platform/applications/${app._id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-indigo-600" />
                        <span className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 transition-colors">
                          {app.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{app.code}</code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {app.is_active ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(app.created_at)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/platform/applications/${app._id}`);
                          }}
                        >
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/applications/${app._id}/edit`)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(app._id, app.is_active)}>
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
                            <DropdownMenuItem
                              onClick={() => handleDelete(app._id, app.name, app.version)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredApps.length === 0 && (
              <div className="text-center py-12">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No applications found</p>
              </div>
            )}
          </div>
        </Card>
      </PageLayout>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </>
  );
}

export { ApplicationsPage };
export default ApplicationsPage;