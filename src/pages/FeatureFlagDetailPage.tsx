/**
 * Feature Flag Detail Page
 * Display detailed information about a feature flag
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
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { featureFlagsApi, FeatureFlag, FlagType, Environment } from '@/api/featureFlagsApi';
import { toast } from 'sonner@2.0.3';

export default function FeatureFlagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const errorMessage = err?.message || t('featureFlags.loadError');
      console.error('❌ Error loading feature flag:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!id || !flag) return;
    
    try {
      const response = await featureFlagsApi.toggle(id);
      toast.success(response.message);
      setFlag(response.data);
    } catch (err: any) {
      toast.error(t('featureFlags.toggleError'), { description: err.message });
    }
  };

  const handleDelete = async () => {
    if (!id || !flag) return;
    
    const confirmMessage = t('featureFlags.deleteConfirm', { name: flag.flag_name });
    if (!confirm(confirmMessage)) return;
    
    try {
      await featureFlagsApi.delete(id);
      toast.success(t('featureFlags.deleteSuccess'));
      navigate('/core/feature-flags');
    } catch (err: any) {
      toast.error(t('featureFlags.deleteError'), { description: err.message });
    }
  };

  const getEnvironmentColor = (environment: Environment) => {
    switch (environment) {
      case 'production': return 'bg-green-100 text-green-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'development': return 'bg-blue-100 text-blue-800';
      case 'beta': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlagTypeColor = (type: FlagType) => {
    switch (type) {
      case 'boolean': return 'bg-indigo-100 text-indigo-800';
      case 'feature': return 'bg-blue-100 text-blue-800';
      case 'release': return 'bg-green-100 text-green-800';
      case 'experiment': return 'bg-purple-100 text-purple-800';
      case 'operational': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !flag) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">{error || t('featureFlags.notFound')}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => loadFlag()}>{t('common.retry')}</Button>
            <Button variant="outline" onClick={() => navigate('/core/feature-flags')}>
              {t('featureFlags.backToList')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/core/feature-flags')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('featureFlags.backToList')}
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{flag.flag_name}</h1>
              <Badge className={flag.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {flag.is_enabled ? t('featureFlags.enabled') : t('featureFlags.disabled')}
              </Badge>
            </div>
            <p className="text-sm font-mono text-gray-500 mb-2">{flag.flag_key}</p>
            {flag.description && (
              <p className="text-gray-600">{flag.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleToggle}
              className={flag.is_enabled ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}
            >
              {flag.is_enabled ? (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  {t('featureFlags.disable')}
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  {t('featureFlags.enable')}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/core/feature-flags/edit/${flag.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('featureFlags.configuration')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{t('featureFlags.type')}</p>
                <Badge className={getFlagTypeColor(flag.flag_type)}>
                  {flag.flag_type}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{t('featureFlags.environment')}</p>
                <Badge className={getEnvironmentColor(flag.environment)}>
                  {flag.environment}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{t('featureFlags.targetAudience')}</p>
                <p className="text-gray-900">{flag.target_audience || 'all'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{t('featureFlags.percentageRollout')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${flag.percentage_rollout}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{flag.percentage_rollout}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('featureFlags.timeline')}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">{t('featureFlags.createdAt')}</p>
                  <p className="text-gray-900">{formatDate(flag.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">{t('featureFlags.updatedAt')}</p>
                  <p className="text-gray-900">{formatDate(flag.updated_at)}</p>
                </div>
              </div>

              {flag.enabled_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{t('featureFlags.enabledAt')}</p>
                    <p className="text-gray-900">{formatDate(flag.enabled_at)}</p>
                  </div>
                </div>
              )}

              {flag.disabled_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{t('featureFlags.disabledAt')}</p>
                    <p className="text-gray-900">{formatDate(flag.disabled_at)}</p>
                  </div>
                </div>
              )}

              {flag.created_by && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{t('featureFlags.createdBy')}</p>
                    <p className="text-gray-900">{flag.created_by}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('featureFlags.currentStatus')}</h3>
            <div className={`p-4 rounded-lg ${flag.is_enabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                {flag.is_enabled ? (
                  <Power className="w-6 h-6 text-green-600" />
                ) : (
                  <PowerOff className="w-6 h-6 text-gray-600" />
                )}
                <div>
                  <p className={`font-semibold ${flag.is_enabled ? 'text-green-900' : 'text-gray-900'}`}>
                    {flag.is_enabled ? t('featureFlags.active') : t('featureFlags.inactive')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {flag.is_enabled ? t('featureFlags.activeDesc') : t('featureFlags.inactiveDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('common.actions')}</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/core/feature-flags/edit/${flag.id}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('featureFlags.editFlag')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleToggle}
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
        </div>
      </div>
    </div>
  );
}
