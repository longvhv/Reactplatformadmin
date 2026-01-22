/**
 * TenantRateLimitsTab Component
 * Tab for tenant detail page - managing tenant rate limits
 * 
 * ✅ UPDATED: Support for strict mode display and new schema fields
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, AlertTriangle, 
  Zap, RotateCcw, Database, HardDrive, Mail, Cpu, Network, MessageSquare,
  Shield, ShieldAlert
} from 'lucide-react';
import { useTenantRateLimits } from '../../hooks/useTenantRateLimits';
import { RateLimitModal } from './RateLimitModal';
import { TenantRateLimit, ResourceType } from '../../api/tenantRateLimitsApi';
import { toast } from 'sonner';

interface TenantRateLimitsTabProps {
  tenantId: string;
}

export function TenantRateLimitsTab({ tenantId }: TenantRateLimitsTabProps) {
  const { 
    limits, 
    loading, 
    createLimit, 
    updateLimit, 
    enableLimit, 
    disableLimit, 
    resetUsage, 
    deleteLimit, 
    getStats,
    toggleAlert,
  } = useTenantRateLimits({ tenant_id: tenantId });
  
  const [stats, setStats] = useState({ 
    total: 0, 
    enabled: 0, 
    disabled: 0, 
    api: 0, 
    storage: 0, 
    database: 0, 
    email: 0, 
    compute: 0,
    network: 0,
    sms: 0,
    alertsEnabled: 0, 
    exceeded: 0 
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<TenantRateLimit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    if (limits.length > 0 || !loading) {
      loadStats();
    }
  }, [limits, loading, getStats]);

  const handleCreate = () => {
    setEditingLimit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (limit: TenantRateLimit) => {
    setEditingLimit(limit);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingLimit) {
        await updateLimit(editingLimit._id, data);
        toast.success('Rate limit updated');
      } else {
        await createLimit({ ...data, tenant_id: tenantId });
        toast.success('Rate limit created');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving rate limit:', error);
      toast.error('Failed to save rate limit');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rate limit?')) return;
    setDeletingId(id);
    try {
      await deleteLimit(id);
      toast.success('Rate limit deleted');
    } catch (error) {
      console.error('Error deleting rate limit:', error);
      toast.error('Failed to delete rate limit');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (limit: TenantRateLimit) => {
    try {
      if (limit.is_enabled) {
        await disableLimit(limit._id);
        toast.success('Rate limit disabled');
      } else {
        await enableLimit(limit._id);
        toast.success('Rate limit enabled');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const handleResetUsage = async (id: string) => {
    if (!window.confirm('Are you sure you want to reset the usage counter?')) return;
    try {
      await resetUsage(id);
      toast.success('Usage counter reset');
    } catch (error) {
      console.error('Error resetting usage:', error);
      toast.error('Failed to reset usage');
    }
  };

  const handleToggleAlert = async (limit: TenantRateLimit) => {
    try {
      await toggleAlert(limit._id, !limit.alert_enabled);
      toast.success(limit.alert_enabled ? 'Alert disabled' : 'Alert enabled');
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('Failed to toggle alert');
    }
  };

  const getResourceIcon = (type?: ResourceType | null) => {
    const icons = {
      api: Zap,
      storage: HardDrive,
      database: Database,
      email: Mail,
      compute: Cpu,
      network: Network,
      sms: MessageSquare,
    };
    return type ? icons[type] || Zap : Zap;
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (!max) return 0;
    return Math.round((current / max) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Limits</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Enabled</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.enabled}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">API</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.api}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Alerts</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.alertsEnabled}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Exceeded</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.exceeded}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Rate Limits ({limits.length})
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rate Limit
        </button>
      </div>

      {/* Limits Table */}
      {limits.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No rate limits configured</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Limit Config</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Policy</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {limits.map((limit) => {
                  const ResourceIcon = getResourceIcon(limit.resource_type);
                  const usagePercent = getUsagePercentage(limit.current_usage, limit.max_requests);
                  const usageColor = getUsageColor(usagePercent);
                  
                  return (
                    <tr key={limit._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                            <ResourceIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {limit.limit_name}
                             </span>
                             <span className="text-xs text-gray-500 font-mono uppercase">
                                {limit.resource_type || 'custom'}
                             </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {limit.max_requests.toLocaleString()} req / {limit.time_window} {limit.window_unit}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                             {limit.burst_limit && (
                               <span>Burst: {limit.burst_limit.toLocaleString()}</span>
                             )}
                             {limit.concurrent_limit && (
                               <span>Conc: {limit.concurrent_limit}</span>
                             )}
                          </div>
                          {limit.endpoint_pattern && (
                            <p className="text-xs font-mono text-gray-400 mt-0.5" title="Endpoint Pattern">
                               {limit.endpoint_pattern}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                               {limit.limit_type.replace('_', ' ')}
                             </span>
                          </div>
                          <div className="flex items-center gap-1">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                               {limit.limit_scope}
                             </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                             {limit.is_strict ? (
                                <span className="text-xs flex items-center gap-0.5 text-red-600 dark:text-red-400" title="Strict Mode: Blocks requests">
                                   <ShieldAlert className="w-3 h-3" /> Strict
                                </span>
                             ) : (
                                <span className="text-xs flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400" title="Audit Mode: Only logs">
                                   <Shield className="w-3 h-3" /> Audit
                                </span>
                             )}
                             {limit.priority > 0 && (
                               <span className="text-xs text-gray-500" title="Priority">P:{limit.priority}</span>
                             )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[120px]">
                          <div className="flex items-center justify-between mb-1">
                             <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                               {usagePercent}%
                             </span>
                             <span className="text-xs text-gray-500">
                               {limit.current_usage.toLocaleString()}
                             </span>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${usageColor.replace('text-', 'bg-').replace('bg-bg-', 'bg-')}`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          {limit.exceeded_count > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                               <AlertTriangle className="w-3 h-3" />
                               {limit.exceeded_count} exceeded
                            </p>
                          )}
                          {limit.last_exceeded_at && (
                            <p className="text-[10px] text-gray-400 mt-0.5" title={new Date(limit.last_exceeded_at).toLocaleString()}>
                              Last: {new Date(limit.last_exceeded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {limit.is_enabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              <XCircle className="w-3 h-3" />
                              Disabled
                            </span>
                          )}
                          
                          <div 
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors w-fit ${
                              limit.alert_enabled 
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200' 
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => handleToggleAlert(limit)}
                            title={limit.alert_enabled ? `Alert at ${limit.alert_threshold}%` : 'Click to enable alerts'}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {limit.alert_enabled ? `${limit.alert_threshold}%` : 'No Alert'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleResetUsage(limit._id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Reset Usage Counter"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(limit)}
                            className={`p-1.5 rounded transition-colors ${
                              limit.is_enabled
                                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={limit.is_enabled ? 'Disable' : 'Enable'}
                          >
                            {limit.is_enabled ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(limit)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                            title="Edit Configuration"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(limit._id)}
                            disabled={deletingId === limit._id}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <RateLimitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        limit={editingLimit}
        tenantId={tenantId}
      />
    </div>
  );
}

export default TenantRateLimitsTab;