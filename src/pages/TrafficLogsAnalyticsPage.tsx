/**
 * Traffic Logs Analytics Page
 * Advanced analytics and visualizations for traffic data
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Calendar } from 'lucide-react';
import {
  getTrafficStats,
  getTrafficTrend,
  getStatusCodeDistribution,
  TrafficLogStats as StatsType,
} from '../api/trafficLogsApi';
import { TrafficLogStats } from '../components/traffic-logs/TrafficLogStats';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner@2.0.3';
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
  Area,
  AreaChart,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

export default function TrafficLogsAnalyticsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatsType | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const [statsData, trendRaw, statusDist] = await Promise.all([
        getTrafficStats({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
        getTrafficTrend(timeRange),
        getStatusCodeDistribution({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
      ]);

      setStats(statsData);
      setTrendData(trendRaw);
      setStatusDistribution(statusDist);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error(t('trafficLogs.analyticsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleExport = () => {
    const data = {
      stats,
      trendData,
      statusDistribution,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-analytics-${new Date().toISOString()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(t('trafficLogs.exportSuccess'));
  };

  // Prepare chart data
  const statusChartData = Object.entries(statusDistribution).map(([code, count]) => ({
    name: code,
    value: count,
  }));

  const methodsChartData = stats
    ? Object.entries(stats.byMethod).map(([method, count]) => ({
        name: method,
        value: count,
      }))
    : [];

  const regionsChartData = stats
    ? Object.entries(stats.byRegion).map(([region, count]) => ({
        name: region,
        value: count,
      }))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/core/traffic-logs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('trafficLogs.analytics')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('trafficLogs.analyticsDescription')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('trafficLogs.last7Days')}</SelectItem>
                <SelectItem value="30">{t('trafficLogs.last30Days')}</SelectItem>
                <SelectItem value="90">{t('trafficLogs.last90Days')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && <TrafficLogStats stats={stats} />}

        {/* Traffic Trend */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            {t('trafficLogs.trafficTrend')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorCount)"
                name={t('trafficLogs.requests')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Latency Trend */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            {t('trafficLogs.latencyTrend')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgLatency"
                stroke="#8b5cf6"
                strokeWidth={2}
                name={t('trafficLogs.avgLatency')}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HTTP Methods Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              {t('trafficLogs.methodsDistribution')}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={methodsChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Status Codes Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              {t('trafficLogs.statusDistribution')}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
                <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Regional Distribution */}
          {regionsChartData.length > 0 && (
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                {t('trafficLogs.regionalDistribution')}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                  <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
                  <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
