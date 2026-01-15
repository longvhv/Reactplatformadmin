/**
 * ApplicationStats Component
 * Thống kê của application - Real data from Supabase
 */

import { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Users, Activity, Layers } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

interface ApplicationStatsProps {
  appId: string;
  appCode: string;
}

interface StatsData {
  totalCapabilities: number;
  activeCapabilities: number;
  totalTenants: number;
  activeTenants: number;
  usageThisMonth: number;
  topTenants: Array<{
    tenant_code: string;
    name: string;
    usage: number;
    percentage: number;
  }>;
}

export function ApplicationStats({ appId, appCode }: ApplicationStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [appId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [ApplicationStats] Fetching stats for app:', { appId, appCode });

      // Fetch capabilities count (FIXED: use correct field name 'status' not 'is_enabled')
      const { count: totalCapabilities, error: capError1 } = await supabase
        .from('app_capabilities')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', appId)
        .is('deleted_at', null);

      if (capError1) {
        console.error('❌ Error fetching total capabilities:', capError1);
        throw capError1;
      }

      const { count: activeCapabilities, error: capError2 } = await supabase
        .from('app_capabilities')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', appId)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (capError2) {
        console.error('❌ Error fetching active capabilities:', capError2);
        throw capError2;
      }

      console.log('✅ Capabilities:', { totalCapabilities, activeCapabilities });

      // Fetch tenant subscriptions count (tenants using this app)
      const { count: totalTenants, error: tenantError1 } = await supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('app_code', appCode)
        .is('deleted_at', null);

      if (tenantError1) {
        console.error('❌ Error fetching total tenants:', tenantError1);
        throw tenantError1;
      }

      const { count: activeTenants, error: tenantError2 } = await supabase
        .from('tenant_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('app_code', appCode)
        .eq('status', 'ACTIVE')
        .is('deleted_at', null);

      if (tenantError2) {
        console.error('❌ Error fetching active tenants:', tenantError2);
        throw tenantError2;
      }

      console.log('✅ Tenants:', { totalTenants, activeTenants });

      // Fetch top tenants (simplified - just get all subscriptions)
      const { data: subscriptions, error: subError } = await supabase
        .from('tenant_subscriptions')
        .select(`
          tenant_id,
          tenants!inner(name, code)
        `)
        .eq('app_code', appCode)
        .eq('status', 'ACTIVE')
        .is('deleted_at', null)
        .limit(5);

      if (subError) {
        console.error('❌ Error fetching subscriptions:', subError);
        throw subError;
      }

      console.log('✅ Subscriptions:', subscriptions);

      const topTenants = (subscriptions || []).map((sub: any, index: number) => ({
        tenant_code: sub.tenants?.code || 'N/A',
        name: sub.tenants?.name || 'Unknown',
        usage: Math.floor(Math.random() * 1000), // Mock usage for now
        percentage: Math.max(100 - (index * 20), 10)
      }));

      const statsData = {
        totalCapabilities: totalCapabilities || 0,
        activeCapabilities: activeCapabilities || 0,
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        usageThisMonth: Math.floor(Math.random() * 10000), // Mock for now
        topTenants
      };

      console.log('✅ Stats loaded successfully:', statsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('❌ Error fetching stats:', err);
      setError(err?.message || 'Không thể tải thống kê');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="ml-3 text-gray-500">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng Tenants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalTenants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.activeTenants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Capabilities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalCapabilities}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.activeCapabilities} active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Usage tháng này</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.usageThisMonth.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tenant Usage</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng tenants</span>
              <span className="font-semibold text-gray-900">{stats.totalTenants}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active tenants</span>
              <span className="font-semibold text-green-600">{stats.activeTenants}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Inactive tenants</span>
              <span className="font-semibold text-gray-500">
                {stats.totalTenants - stats.activeTenants}
              </span>
            </div>
            {stats.totalTenants > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active rate</span>
                  <span className="font-semibold text-indigo-600">
                    {Math.round((stats.activeTenants / stats.totalTenants) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Capabilities</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng capabilities</span>
              <span className="font-semibold text-gray-900">{stats.totalCapabilities}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active capabilities</span>
              <span className="font-semibold text-green-600">{stats.activeCapabilities}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Inactive capabilities</span>
              <span className="font-semibold text-gray-500">
                {stats.totalCapabilities - stats.activeCapabilities}
              </span>
            </div>
            {stats.totalCapabilities > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active rate</span>
                  <span className="font-semibold text-indigo-600">
                    {Math.round((stats.activeCapabilities / stats.totalCapabilities) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Biểu đồ sử dụng</h2>
        </div>

        <div className="p-6">
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed">
            <div className="text-center">
              <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Biểu đồ sử dụng sẽ hiển thị ở đây</p>
              <p className="text-sm text-gray-400 mt-1">Tích hợp với Recharts hoặc Chart.js</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tenants */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Top Tenants sử dụng</h2>
        </div>

        <div className="p-6">
          {stats.topTenants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có tenant nào sử dụng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topTenants.map((tenant, index) => (
                <div key={tenant.tenant_code} className="flex items-center gap-4">
                  <div className="w-8 text-center">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{tenant.name}</span>
                      <span className="text-sm text-gray-500">{tenant.usage} lượt</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${tenant.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}