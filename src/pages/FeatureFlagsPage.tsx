/**
 * Feature Flags Page
 * List and manage feature flags - Under 500 lines
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '@/providers/LanguageProvider';
import { 
  Plus, 
  Search, 
  Filter,
  Flag,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Loader,
  AlertCircle,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { FeatureFlag, FlagType, Environment } from '@/api/featureFlagsApi';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FeatureFlagsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FlagType>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<'all' | Environment>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const { flags, stats, loading, error, toggleFlag, deleteFlag, loadFlags } = useFeatureFlags({ autoLoad: true });

  // Apply filters
  const filteredFlags = flags.filter(flag => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!flag.flag_key.toLowerCase().includes(query) && 
          !flag.flag_name.toLowerCase().includes(query) &&
          !(flag.description || '').toLowerCase().includes(query)) {
        return false;
      }
    }

    // Type filter
    if (typeFilter !== 'all' && flag.flag_type !== typeFilter) return false;

    // Environment filter
    if (environmentFilter !== 'all' && flag.environment !== environmentFilter) return false;

    // Status filter
    if (statusFilter === 'enabled' && !flag.is_enabled) return false;
    if (statusFilter === 'disabled' && flag.is_enabled) return false;

    return true;
  });

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

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await toggleFlag(flag.id);
      toast.success(t('featureFlags.toggleSuccess'));
    } catch (err: any) {
      toast.error(t('featureFlags.toggleError'), { description: err.message });
    }
  };

  const handleDelete = async (flag: FeatureFlag) => {
    const confirmMessage = t('featureFlags.deleteConfirm', { name: flag.flag_name });
    if (!confirm(confirmMessage)) return;
    
    try {
      await deleteFlag(flag.id);
      toast.success(t('featureFlags.deleteSuccess'));
    } catch (err: any) {
      toast.error(t('featureFlags.deleteError'), { description: err.message });
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadFlags()}>{t('common.retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('featureFlags.title')}</h1>
            <p className="text-gray-600 mt-1">{t('featureFlags.description')}</p>
          </div>
          <Button onClick={() => navigate('/core/feature-flags/new')} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('featureFlags.add')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('featureFlags.stats.total')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFlags}</p>
              </div>
              <Flag className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('featureFlags.stats.enabled')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.enabledFlags}</p>
              </div>
              <Power className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('featureFlags.stats.production')}</p>
                <p className="text-2xl font-bold text-blue-600">{stats.productionFlags}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('featureFlags.stats.avgRollout')}</p>
                <p className="text-2xl font-bold text-purple-600">{Math.round(stats.averageRollout)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 border border-gray-200">
        <div className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('featureFlags.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-indigo-50 border-indigo-200' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('common.filter')}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('featureFlags.filterByType')}
                </label>
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('featureFlags.allTypes')}</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="release">Release</SelectItem>
                    <SelectItem value="experiment">Experiment</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('featureFlags.filterByEnvironment')}
                </label>
                <Select value={environmentFilter} onValueChange={(value) => setEnvironmentFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('featureFlags.allEnvironments')}</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('featureFlags.filterByStatus')}
                </label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('featureFlags.allStatuses')}</SelectItem>
                    <SelectItem value="enabled">{t('featureFlags.enabled')}</SelectItem>
                    <SelectItem value="disabled">{t('featureFlags.disabled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('featureFlags.flag')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('featureFlags.environment')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('featureFlags.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('featureFlags.rollout')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('featureFlags.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('featureFlags.updated')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFlags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{t('featureFlags.noData')}</p>
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{flag.flag_name}</p>
                        <p className="text-sm text-gray-500 font-mono">{flag.flag_key}</p>
                        {flag.description && (
                          <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getEnvironmentColor(flag.environment)}>
                        {flag.environment}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getFlagTypeColor(flag.flag_type)}>
                        {flag.flag_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${flag.percentage_rollout}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12">{flag.percentage_rollout}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(flag)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          flag.is_enabled
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {flag.is_enabled ? (
                          <>
                            <Power className="w-3 h-3" />
                            {t('featureFlags.enabled')}
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-3 h-3" />
                            {t('featureFlags.disabled')}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(flag.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/core/feature-flags/${flag.id}`)}
                          className="text-gray-600 hover:text-indigo-600"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/core/feature-flags/edit/${flag.id}`)}
                          className="text-gray-600 hover:text-indigo-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(flag)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {t('common.showing')} {filteredFlags.length} {t('common.of')} {flags.length} {t('featureFlags.flags')}
          </p>
        </div>
      </div>
    </div>
  );
}
