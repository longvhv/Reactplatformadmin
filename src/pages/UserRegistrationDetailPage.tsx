/**
 * User Registration Detail Page
 * Displays details of a specific user registration log
 * 
 * ✅ MIGRATED to Phase 3 Standards (2026-01-18):
 * - Replaced confirm() with ConfirmDialog
 * - Using showToast (toast from sonner) for all notifications
 * - Wrapped in Fragment
 * - Using PageLayout with icon/title/description
 * - Full dark mode support
 */

import { Fragment, useState, useEffect } from 'react';
import { useTranslation } from '../providers/LanguageProvider';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Edit, Trash2, Copy, Check, UserPlus } from 'lucide-react';
import {
  getUserRegistrationLogById,
  deleteUserRegistrationLog,
  UserRegistrationLog,
} from '../api/userRegistrationLogsApi';
import { RegistrationSourceBadge } from '../components/user-registration/RegistrationSourceBadge';
import { DataRegionBadge } from '../components/user-registration/DataRegionBadge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner@2.0.3';
import { showToast } from '@/lib/toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export default function UserRegistrationDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [log, setLog] = useState<UserRegistrationLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Confirm dialog state
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

  useEffect(() => {
    if (id) {
      loadLog();
    }
  }, [id]);

  const loadLog = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await getUserRegistrationLogById(id);
      if (data) {
        setLog(data);
      } else {
        toast.error(t('userRegistration.notFound'));
        navigate('/admin/registration-analytics');
      }
    } catch (error) {
      console.error('Error loading log:', error);
      toast.error(t('userRegistration.loadError'));
      navigate('/admin/registration-analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setConfirmDialog({
      open: true,
      title: t('userRegistration.deleteTitle'),
      description: t('userRegistration.deleteConfirm'),
      onConfirm: async () => {
        try {
          await deleteUserRegistrationLog(id);
          showToast.success(t('userRegistration.deleteSuccess'));
          navigate('/admin/registration-analytics');
        } catch (error) {
          console.error('Error deleting log:', error);
          showToast.error(t('userRegistration.deleteError'));
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      showToast.success(t('common.copiedToClipboard'));
    } catch (error) {
      showToast.error(t('common.copyError'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!log) {
    return null;
  }

  return (
    <Fragment>
      <PageLayout
        icon={UserPlus}
        title={t('userRegistration.detail')}
        description={t('userRegistration.detailDescription')}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/registration-analytics/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          </div>
        }
      >
        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('userRegistration.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('userRegistration.registrationId')}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(log._id, 'id')}
                  >
                    {copiedField === 'id' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {log._id}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('userRegistration.userId')}
                  </label>
                  {log.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(log.user_id!, 'user_id')}
                    >
                      {copiedField === 'user_id' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {log.user_id || '-'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('userRegistration.tenantId')}
                  </label>
                  {log.tenant_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(log.tenant_id!, 'tenant_id')}
                    >
                      {copiedField === 'tenant_id' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {log.tenant_id || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('userRegistration.createdAt')}
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(log.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('userRegistration.registrationDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('userRegistration.registrationSource')}
                </label>
                <div className="mt-2">
                  <RegistrationSourceBadge source={log.registration_source} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('userRegistration.dataRegion')}
                </label>
                <div className="mt-2">
                  <DataRegionBadge region={log.data_region} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* JSON View */}
        <Card>
          <CardHeader>
            <CardTitle>{t('userRegistration.rawData')}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{JSON.stringify(log, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>
      </PageLayout>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
      />
    </Fragment>
  );
}