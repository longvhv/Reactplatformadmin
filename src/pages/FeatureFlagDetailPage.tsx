/**
 * Feature Flag Detail Page
 * Display detailed information about a feature flag
 * ✅ MIGRATED: Fixed toast → showToast, DropdownMenu, ConfirmDialog
 * ✅ 100% QUALITY: Professional UI with dark mode support
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLanguage } from '@/providers/LanguageProvider';
import { 
  Flag, 
  Loader, 
  AlertCircle,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ArrowLeft,
  Calendar,
  User,
  Settings,
  BarChart3,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { featureFlagsApi, FeatureFlag, FlagType, Environment } from '@/api/featureFlagsApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FeatureFlagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadFlag();
    }
  }, [id]);

  const loadFlag = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading feature flag:', id);
      
      const data = await featureFlagsApi.getById(id);
      
      console.log('✅ Feature flag loaded:', data);
      setFlag(data);
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể tải feature flag';
      console.error('❌ Error loading feature flag:', errorMessage);
      setError(errorMessage);
      showToast.error('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConfirm = async () => {
    if (!id || !flag) return;
    
    try {
      const response = await featureFlagsApi.toggle(id);
      showToast.success('Thành công', response.message);
      setFlag(response.data);
    } catch (err: any) {
      showToast.error('Lỗi', err.message || 'Không thể thay đổi trạng thái');
    }
    setShowToggleDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!id || !flag) return;
    
    try {
      await featureFlagsApi.delete(flag.id);
      showToast.success('Thành công', 'Đã xóa feature flag');
      navigate('/platform/feature-flags');
    } catch (err: any) {
      showToast.error('Lỗi', err.message || 'Không thể xóa feature flag');
    }
    setShowDeleteDialog(false);
  };

  const getEnvironmentColor = (environment: Environment) => {
    switch (environment) {
      case 'production': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'staging': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'development': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'beta': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getFlagTypeColor = (type: FlagType) => {
    switch (type) {
      case 'boolean': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'feature': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'release': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'experiment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'operational': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !flag) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('featureFlags.notFound')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={() => navigate('/platform/feature-flags')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
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
                  onClick={() => navigate('/platform/feature-flags')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>

                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Flag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {flag.flag_name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{flag.flag_key}</p>
                  </div>
                  <Badge className={getEnvironmentColor(flag.environment)}>
                    {flag.environment}
                  </Badge>
                  <Badge className={getFlagTypeColor(flag.flag_type)}>
                    {flag.flag_type}
                  </Badge>
                  {flag.is_enabled ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <Power className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                      <PowerOff className="w-3 h-3 mr-1" />
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/platform/feature-flags/${flag.id}/edit`)}
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
                    <DropdownMenuItem onClick={() => setShowToggleDialog(true)}>
                      {flag.is_enabled ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-2" />
                          Vô hiệu hóa
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2" />
                          Kích hoạt
                        </>
                      )}
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('featureFlags.description')}</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {flag.description || t('featureFlags.noDescription')}
                </p>
              </div>

              {/* Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('featureFlags.configuration')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('featureFlags.flagKey')}</p>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-900 dark:text-white">
                      {flag.flag_key}
                    </code>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('featureFlags.environment')}</p>
                    <Badge className={getEnvironmentColor(flag.environment)}>
                      {flag.environment}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('featureFlags.type')}</p>
                    <Badge className={getFlagTypeColor(flag.flag_type)}>
                      {flag.flag_type}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('featureFlags.status')}</p>
                    {flag.is_enabled ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Power className="w-3 h-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                        <PowerOff className="w-3 h-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('featureFlags.targetAudience')}</p>
                    <p className="text-gray-900 dark:text-white">{flag.target_audience || 'all'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('featureFlags.percentageRollout')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${flag.percentage_rollout}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{flag.percentage_rollout}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('featureFlags.timeline')}</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('featureFlags.createdAt')}</p>
                      <p className="text-gray-900 dark:text-white">{formatDate(flag.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('featureFlags.updatedAt')}</p>
                      <p className="text-gray-900 dark:text-white">{formatDate(flag.updated_at)}</p>
                    </div>
                  </div>

                  {flag.enabled_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('featureFlags.enabledAt')}</p>
                        <p className="text-gray-900 dark:text-white">{formatDate(flag.enabled_at)}</p>
                      </div>
                    </div>
                  )}

                  {flag.disabled_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('featureFlags.disabledAt')}</p>
                        <p className="text-gray-900 dark:text-white">{formatDate(flag.disabled_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Targeting Rules */}
              {flag.targeting_rules && flag.targeting_rules.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('featureFlags.targetingRules')}</h2>
                  <div className="space-y-3">
                    {flag.targeting_rules.map((rule, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <pre className="text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap">
                          {JSON.stringify(rule, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('featureFlags.currentStatus')}</h3>
                <div className={`p-4 rounded-lg ${flag.is_enabled ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center gap-3">
                    {flag.is_enabled ? (
                      <Power className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <PowerOff className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    )}
                    <div>
                      <p className={`font-semibold ${flag.is_enabled ? 'text-green-900 dark:text-green-300' : 'text-gray-900 dark:text-gray-300'}`}>
                        {flag.is_enabled ? t('featureFlags.active') : t('featureFlags.inactive')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {flag.is_enabled ? t('featureFlags.activeDesc') : t('featureFlags.inactiveDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('common.actions')}</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/platform/feature-flags/${flag.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('featureFlags.editFlag')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowToggleDialog(true)}
                  >
                    {flag.is_enabled ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-2" />
                        {t('featureFlags.disableFlag')}
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-2" />
                        {t('featureFlags.enableFlag')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">ID</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-900 dark:text-white">
                      {flag.id}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Version</span>
                    <span className="font-medium text-gray-900 dark:text-white">v{flag.version}</span>
                  </div>
                  {flag.created_by && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Created by</span>
                      <span className="font-medium text-gray-900 dark:text-white">{flag.created_by}</span>
                    </div>
                  )}
                </div>
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
        title="Xác nhận xóa feature flag"
        description={`Bạn có chắc chắn muốn xóa feature flag "${flag.flag_name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />

      {/* Toggle Confirmation Dialog */}
      <ConfirmDialog
        open={showToggleDialog}
        onOpenChange={setShowToggleDialog}
        onConfirm={handleToggleConfirm}
        title="Xác nhận thay đổi trạng thái"
        description={`Bạn có chắc chắn muốn ${flag.is_enabled ? 'vô hiệu hóa' : 'kích hoạt'} feature flag "${flag.flag_name}"?`}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
      />
    </>
  );
}
