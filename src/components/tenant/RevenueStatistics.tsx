/**
 * Revenue Statistics Component
 * Displays revenue statistics and charts for tenant
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  businessReportsService,
  RevenueStats,
  BusinessReport,
} from '../../services/businessReportsService';

interface RevenueStatisticsProps {
  tenantId: string; // partner_id in database
}

export const RevenueStatistics: React.FC<RevenueStatisticsProps> = ({ tenantId }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [reports, setReports] = useState<BusinessReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  // Chart colors
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date filter
      let date_from: string | undefined;
      const now = new Date();

      switch (dateRange) {
        case '7d':
          date_from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '30d':
          date_from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '90d':
          date_from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '1y':
          date_from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'all':
          date_from = undefined;
          break;
      }

      const filters = date_from ? { date_from } : {};

      const [statsData, reportsData] = await Promise.all([
        businessReportsService.getRevenueStats(tenantId, filters),
        businessReportsService.getByPartnerId(tenantId, filters),
      ]);

      setStats(statsData);
      setReports(reportsData);
    } catch (err) {
      setError(t('revenue.fetchError'));
      console.error('Error loading revenue statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId, dateRange]);

  // Format currency
  const formatCurrency = (value: number, currency: string = 'VND') => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Export data
  const exportData = () => {
    if (reports.length === 0) return;

    const csv = [
      ['Date', 'Category', 'Revenue', 'Currency', 'Tenant Count'],
      ...reports.map(r => [
        r.report_date || '',
        r.revenue_category || '',
        r.total_revenue?.toString() || '0',
        r.currency_code || 'VND',
        r.tenant_count?.toString() || '0',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${tenantId}-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {error}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2 font-semibold">🚨 Quick Fix (2 phút):</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong>Enable Telemetry Schema:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                      <li>Mở Supabase Dashboard → Settings → API</li>
                      <li>Tìm "Exposed schemas" hoặc "DB Schema"</li>
                      <li>Sửa từ <code className="bg-red-100 px-1 py-0.5 rounded">public</code> thành <code className="bg-red-100 px-1 py-0.5 rounded">public, telemetry</code></li>
                      <li>Click Save</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Hard Refresh:</strong> Press <code className="bg-red-100 px-1 py-0.5 rounded">Ctrl+Shift+R</code> (Windows) or <code className="bg-red-100 px-1 py-0.5 rounded">Cmd+Shift+R</code> (Mac)
                  </li>
                </ol>
                <p className="mt-3 text-xs bg-red-50 p-2 rounded border border-red-200">
                  📖 Chi tiết: <code className="font-mono">/docs/QUICK-FIX-TELEMETRY-SCHEMA.md</code>
                  <br />
                  📖 Full guide: <code className="font-mono">/docs/bugfix/2026-01-16-telemetry-schema-postgrest-config.md</code>
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadData}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('revenue.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  dateRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === 'all' ? t('common.all') : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            {t('common.export')}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-100 rounded-lg p-2">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">{t('revenue.totalRevenue')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.total_revenue)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 rounded-lg p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">{t('revenue.avgRevenue')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.avg_revenue)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 rounded-lg p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">{t('revenue.totalTenants')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.total_tenants.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      {stats.by_date.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('revenue.revenueTrend')}
            </h3>
            <div className="flex gap-2">
              {(['day', 'week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t(`common.${range}`)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.by_date}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                name={t('revenue.revenue')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        {stats.categories.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t('revenue.revenueByCategory')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categories}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.category}: ${formatCurrency(entry.revenue)}`}
                >
                  {stats.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart by Currency */}
        {stats.by_currency.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t('revenue.revenueByCurrency')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.by_currency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="currency" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name, props) => formatCurrency(value, props.payload.currency)}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Details Table */}
      {stats.categories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('revenue.categoryDetails')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('revenue.category')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('revenue.revenue')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('revenue.tenantCount')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('revenue.avgPerTenant')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.categories.map((cat, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{cat.category}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(cat.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {cat.tenant_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">
                      {formatCurrency(cat.tenant_count > 0 ? cat.revenue / cat.tenant_count : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.categories.length === 0 && stats.by_date.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('revenue.noReports')}</p>
        </div>
      )}
    </div>
  );
};