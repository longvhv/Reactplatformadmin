/**
 * TenantAppRoutesTab Component
 * Tab cho tenant detail page - quản lý domain routing của tenant
 * Dựa trên schema mới: domain-based routing (docs/DatabaseCommand.md)
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Shield, AlertCircle, CheckCircle, XCircle, Star, Globe, Power, PowerOff } from 'lucide-react';
import { AppRouteModal } from './AppRouteModal';
import { BUTTON_VARIANTS, CARD_VARIANTS, TABLE_STYLES, cn } from '../../constants/ui';
import { tenantAppRoutesApi, TenantAppRoute, RouteStatus, SSLStatus } from '../../api/tenantAppRoutesApi';
import { toast } from 'sonner';

interface TenantAppRoutesTabProps {
  tenantId: string;
}

export function TenantAppRoutesTab({ tenantId }: TenantAppRoutesTabProps) {
  const [routes, setRoutes] = useState<TenantAppRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, 
    primary: 0, 
    custom_domains: 0, 
    ssl_active: 0, 
    ssl_pending: 0, 
    ssl_failed: 0,
    by_app_code: {} as Record<string, number>
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TenantAppRoute | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'custom' | 'subdomain'>('all');

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setLoading(true);
        console.log('🔍 [TenantAppRoutesTab] Fetching routes for tenant:', tenantId);
        const data = await tenantAppRoutesApi.getByTenant(tenantId);
        console.log('✅ [TenantAppRoutesTab] Routes loaded:', data.length);
        setRoutes(data);
      } catch (error) {
        console.error('❌ [TenantAppRoutesTab] Error loading routes:', error);
        toast.error('Không thể tải danh sách routes');
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
  }, [tenantId]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await tenantAppRoutesApi.getStats({ tenant_id: tenantId });
        setStats(data);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    if (routes.length > 0) {
      loadStats();
    }
  }, [routes, tenantId]);

  const handleCreate = () => {
    setEditingRoute(null);
    setIsModalOpen(true);
  };

  const handleEdit = (route: TenantAppRoute) => {
    setEditingRoute(route);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingRoute) {
        console.log('🔄 [TenantAppRoutesTab] Updating route:', editingRoute._id);
        const response = await tenantAppRoutesApi.update(editingRoute._id, { ...data, version: editingRoute.version });
        setRoutes(routes.map(route => route._id === response._id ? response : route));
        toast.success('Đã cập nhật route');
      } else {
        console.log('➕ [TenantAppRoutesTab] Creating route for tenant:', tenantId);
        const response = await tenantAppRoutesApi.create({ ...data, tenant_id: tenantId });
        setRoutes([...routes, response]);
        toast.success('Đã tạo route mới');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Lỗi khi lưu route');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa route này?')) return;
    setDeletingId(id);
    try {
      console.log('🗑️ [TenantAppRoutesTab] Deleting route:', id);
      await tenantAppRoutesApi.delete(id);
      setRoutes(routes.filter(route => route._id !== id));
      toast.success('Đã xóa route');
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Lỗi khi xóa route');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (route: TenantAppRoute) => {
    if (route.is_primary) return;
    try {
      console.log('⭐ [TenantAppRoutesTab] Setting primary route:', route._id);
      const response = await tenantAppRoutesApi.setPrimary(route._id, tenantId);
      // Unset other primary routes
      setRoutes(routes.map(r => ({
        ...r,
        is_primary: r._id === response._id
      })));
      toast.success('Đã đặt route làm primary');
    } catch (error) {
      console.error('Error setting primary:', error);
      toast.error('Lỗi khi đặt primary route');
    }
  };

  const handleSetSSL = async (route: TenantAppRoute, status: SSLStatus) => {
    try {
      console.log('🔒 [TenantAppRoutesTab] Setting SSL status:', route._id, status);
      const response = await tenantAppRoutesApi.setSSLStatus(route._id, status);
      setRoutes(routes.map(r => r._id === response._id ? response : r));
      toast.success(`Đã cập nhật SSL status: ${status}`);
    } catch (error) {
      console.error('Error setting SSL:', error);
      toast.error('Lỗi khi cập nhật SSL status');
    }
  };

  const handleToggleStatus = async (route: TenantAppRoute) => {
    const newStatus: RouteStatus = route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      console.log('🔄 [TenantAppRoutesTab] Toggling status:', route._id, newStatus);
      const response = await tenantAppRoutesApi.setStatus(route._id, newStatus);
      setRoutes(routes.map(r => r._id === response._id ? response : r));
      toast.success(`Route đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'}`);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const getSSLBadge = (status: SSLStatus) => {
    const configs = {
      ACTIVE: { icon: CheckCircle, class: 'bg-green-100 text-green-700', label: 'SSL Active' },
      PENDING: { icon: AlertCircle, class: 'bg-yellow-100 text-yellow-700', label: 'SSL Pending' },
      FAILED: { icon: XCircle, class: 'bg-red-100 text-red-700', label: 'SSL Failed' },
      NONE: { icon: Shield, class: 'bg-gray-100 text-gray-700', label: 'No SSL' },
    };
    const config = configs[status] || configs.NONE;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: RouteStatus) => {
    const configs = {
      ACTIVE: { class: 'bg-green-100 text-green-700', label: 'Active' },
      INACTIVE: { class: 'bg-gray-100 text-gray-700', label: 'Inactive' },
      MAINTENANCE: { class: 'bg-orange-100 text-orange-700', label: 'Maintenance' },
      PENDING_DNS: { class: 'bg-yellow-100 text-yellow-700', label: 'Pending DNS' },
    };
    const config = configs[status] || configs.INACTIVE;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getRouteScopeBadge = (scope: string) => {
    const configs = {
      SPECIFIC_DOMAIN: { class: 'bg-blue-100 text-blue-700', label: 'Specific' },
      ALL_MY_DOMAINS: { class: 'bg-purple-100 text-purple-700', label: 'All Domains' },
      INHERITED: { class: 'bg-indigo-100 text-indigo-700', label: 'Inherited' },
    };
    const config = configs[scope as keyof typeof configs] || configs.SPECIFIC_DOMAIN;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const filteredRoutes = routes.filter(route => {
    if (filter === 'custom') return route.is_custom_domain;
    if (filter === 'subdomain') return !route.is_custom_domain;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Tổng routes</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Primary</div>
          <div className="text-2xl font-bold text-indigo-600">{stats.primary}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Custom Domains</div>
          <div className="text-2xl font-bold text-purple-600">{stats.custom_domains}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">SSL Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.ssl_active}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">SSL Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.ssl_pending}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">SSL Failed</div>
          <div className="text-2xl font-bold text-red-600">{stats.ssl_failed}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Tất cả ({routes.length})
          </button>
          <button
            onClick={() => setFilter('subdomain')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'subdomain' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Subdomain ({routes.filter(r => !r.is_custom_domain).length})
          </button>
          <button
            onClick={() => setFilter('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'custom' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Custom Domain ({routes.filter(r => r.is_custom_domain).length})
          </button>
        </div>

        <button
          onClick={handleCreate}
          className={BUTTON_VARIANTS.primary}
        >
          <Plus className="w-4 h-4" />
          Thêm Route
        </button>
      </div>

      {/* Routes Table */}
      <div className={CARD_VARIANTS.flat}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Domain & Path
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                App Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Scope
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                SSL
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Chưa có route nào
                </td>
              </tr>
            ) : (
              filteredRoutes.map((route) => (
                <tr key={route._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {route.is_primary && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm text-gray-900">{route.domain || '<all-domains>'}</span>
                          {route.domain && <ExternalLink className="w-3 h-3 text-gray-400" />}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Path: <span className="font-mono">{route.path_prefix}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-mono">
                      {route.app_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {route.is_custom_domain ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        Custom Domain
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        Subdomain
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getRouteScopeBadge(route.route_scope)}
                  </td>
                  <td className="px-6 py-4">
                    {getSSLBadge(route.ssl_status)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(route.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(route)}
                        className={`p-2 rounded-lg transition-colors ${
                          route.status === 'ACTIVE'
                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={route.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {route.status === 'ACTIVE' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      {!route.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(route)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(route)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(route._id)}
                        disabled={deletingId === route._id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AppRouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        route={editingRoute}
        tenantId={tenantId}
      />
    </div>
  );
}

export default TenantAppRoutesTab;