/**
 * RateLimitsPage Component
 * Global Rate Limits Management Page
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, AlertTriangle, 
  Zap, RotateCcw, Database, HardDrive, Mail, Cpu, Network, Search
} from 'lucide-react';
import { useTenantRateLimits } from '../hooks/useTenantRateLimits';
import { RateLimitModal } from '../components/tenants/RateLimitModal';
import { TenantRateLimit, ResourceType } from '../api/tenantRateLimitsApi';

export function RateLimitsPage() {
  const { limits, loading, createLimit, updateLimit, enableLimit, disableLimit, resetUsage, deleteLimit, getStats } = useTenantRateLimits();
  const [stats, setStats] = useState({ total: 0, enabled: 0, disabled: 0, api: 0, storage: 0, database: 0, email: 0, alertsEnabled: 0, exceeded: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<TenantRateLimit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState<ResourceType | 'all'>('all');

  useEffect(() => {
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    loadStats();
  }, [limits, getStats]);

  const handleCreate = () => {
    setEditingLimit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (limit: TenantRateLimit) => {
    setEditingLimit(limit);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingLimit) {
      await updateLimit(editingLimit._id, data);
    } else {
      await createLimit(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa rate limit này?')) return;
    setDeletingId(id);
    try {
      await deleteLimit(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (limit: TenantRateLimit) => {
    if (limit.is_enabled) {
      await disableLimit(limit._id);
    } else {
      await enableLimit(limit._id);
    }
  };

  const handleResetUsage = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn reset usage counter?')) return;
    await resetUsage(id);
  };

  const getResourceIcon = (type?: ResourceType) => {
    const icons = {
      api: Zap,
      storage: HardDrive,
      database: Database,
      email: Mail,
      compute: Cpu,
      network: Network,
    };
    return type ? icons[type] || Zap : Zap;
  };

  const getUsagePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  // Filter limits
  const filteredLimits = limits.filter(limit => {
    const matchesSearch = searchQuery === '' || 
      limit.limit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      limit.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      limit.endpoint_pattern?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesResource = resourceFilter === 'all' || limit.resource_type === resourceFilter;
    
    return matchesSearch && matchesResource;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Limits</h1>
        <p className="text-gray-500">Quản lý rate limiting cho tất cả tenants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Tổng Limits</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Enabled</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.enabled}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">API</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.api}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Alerts</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.alertsEnabled}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Exceeded</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.exceeded}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, tenant, endpoint..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value as ResourceType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Resources</option>
            <option value="api">API</option>
            <option value="storage">Storage</option>
            <option value="database">Database</option>
            <option value="email">Email</option>
            <option value="compute">Compute</option>
            <option value="network">Network</option>
          </select>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm Rate Limit
          </button>
        </div>
      </div>

      {/* Limits Table */}
      {filteredLimits.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery || resourceFilter !== 'all' ? 'Không tìm thấy rate limit phù hợp' : 'Chưa có rate limit nào'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Limit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type/Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLimits.map((limit) => {
                  const ResourceIcon = getResourceIcon(limit.resource_type);
                  const usagePercent = getUsagePercentage(limit.current_usage, limit.max_requests);
                  const usageColor = getUsageColor(usagePercent);
                  
                  return (
                    <tr key={limit._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{limit.tenant?.name}</p>
                          <p className="text-xs text-gray-500">{limit.tenant?.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded">
                            <ResourceIcon className="w-4 h-4 text-gray-700" />
                          </div>
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {limit.resource_type || 'general'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{limit.limit_name}</p>
                          {limit.endpoint_pattern && (
                            <p className="text-xs font-mono text-gray-500 mt-0.5">{limit.endpoint_pattern}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {limit.max_requests.toLocaleString()} / {limit.time_window} {limit.window_unit}
                          </p>
                          {limit.burst_limit && (
                            <p className="text-xs text-gray-500">Burst: {limit.burst_limit.toLocaleString()}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            {limit.limit_type}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 ml-1">
                            {limit.limit_scope}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${usageColor.replace('text-', 'bg-').replace('bg-bg-', 'bg-')}`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${usageColor}`}>
                              {usagePercent}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {limit.current_usage} / {limit.max_requests}
                            {limit.exceeded_count > 0 && (
                              <span className="text-red-600 ml-1">({limit.exceeded_count} exceeded)</span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {limit.is_enabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              <XCircle className="w-3 h-3" />
                              Disabled
                            </span>
                          )}
                          {limit.alert_enabled && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 ml-1">
                              <AlertTriangle className="w-3 h-3" />
                              Alert
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetUsage(limit._id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Reset Usage"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(limit)}
                            className={`p-1 rounded transition-colors ${
                              limit.is_enabled
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={limit.is_enabled ? 'Disable' : 'Enable'}
                          >
                            {limit.is_enabled ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(limit)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(limit._id)}
                            disabled={deletingId === limit._id}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
      />
    </div>
  );
}

export default RateLimitsPage;
