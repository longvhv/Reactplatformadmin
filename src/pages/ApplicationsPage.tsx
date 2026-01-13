/**
 * Applications Page
 * Quản lý các ứng dụng hệ thống
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {  
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { ApplicationsDebug } from '@/components/debug/ApplicationsDebug';

interface Application {
  _id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

export function ApplicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/applications`);
      
      // Add filters
      if (statusFilter !== 'all') {
        url.searchParams.append('is_active', statusFilter);
      }
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      console.log('Fetching applications from:', url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch applications: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Applications result:', result);
      setApplications(result.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error(`Không thể tải danh sách ứng dụng: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchApplications();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Toggle application status
  const handleToggleStatus = async (app: Application) => {
    try {
      setActionLoading(app._id);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/applications/${app._id}/toggle-active`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle status');
      }

      toast.success(t('applications.statusUpdated'));
      fetchApplications();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete application
  const handleDelete = async () => {
    if (!selectedApp) return;

    try {
      setActionLoading(selectedApp._id);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/applications/${selectedApp._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      toast.success(t('applications.deleted'));
      setDeleteDialogOpen(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Không thể xóa ứng dụng');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate statistics
  const totalApps = applications.length;
  const activeApps = applications.filter(app => app.is_active).length;
  const inactiveApps = totalApps - activeApps;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('applications.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('applications.description')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/core/applications/add')}
          className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('applications.add')}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('applications.totalApplications')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('applications.activeApplications')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeApps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('applications.inactive')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{inactiveApps}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder={t('applications.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('applications.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('applications.allStatuses')}</SelectItem>
                <SelectItem value="true">{t('applications.active')}</SelectItem>
                <SelectItem value="false">{t('applications.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('applications.title')}</CardTitle>
          <CardDescription>
            {t('common.showing')} {applications.length} {t('applications.title').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t('applications.noApplications')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('applications.code')}</TableHead>
                    <TableHead>{t('applications.name')}</TableHead>
                    <TableHead>{t('applications.appDescription')}</TableHead>
                    <TableHead>{t('applications.isActive')}</TableHead>
                    <TableHead>{t('applications.createdAt')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app._id}>
                      <TableCell className="font-mono text-sm">{app.code}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => navigate(`/core/applications/${app._id}/overview`)}
                          className="font-medium text-[#6366f1] hover:text-[#4f46e5] hover:underline text-left"
                        >
                          {app.name}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                        {app.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={app.is_active ? 'default' : 'secondary'}>
                          {app.is_active ? t('applications.active') : t('applications.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(app.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/core/applications/${app._id}/overview`)}
                            title="Xem chi tiết"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(app)}
                            disabled={actionLoading === app._id}
                            title={t('applications.toggleStatus')}
                          >
                            {actionLoading === app._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : app.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/core/applications/edit/${app._id}`)}
                            title={t('common.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setDeleteDialogOpen(true);
                            }}
                            title={t('common.delete')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('applications.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('applications.confirmDeleteMessage')}
              {selectedApp && (
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="font-medium">{selectedApp.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{selectedApp.code}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Debug Component */}
      <ApplicationsDebug />
    </div>
  );
}

export default ApplicationsPage;