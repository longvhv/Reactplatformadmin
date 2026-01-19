/**
 * Traffic Log Stats Component
 * Displays traffic statistics and metrics
 */

import React from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import {
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Database,
  AlertCircle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { Card } from '../ui/card';
import { TrafficLogStats as StatsType } from '../../api/trafficLogsApi';

interface TrafficLogStatsProps {
  stats: StatsType;
  loading?: boolean;
}

export const TrafficLogStats: React.FC<TrafficLogStatsProps> = ({ stats, loading }) => {
  const { t } = useTranslation();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: t('trafficLogs.stats.totalRequests'),
      value: formatNumber(stats.totalRequests),
      icon: Activity,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      title: t('trafficLogs.stats.avgLatency'),
      value: `${stats.avgLatency}ms`,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: t('trafficLogs.stats.successRate'),
      value: `${stats.successRate}%`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: t('trafficLogs.stats.errorRate'),
      value: `${stats.errorRate}%`,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      title: t('trafficLogs.stats.last24Hours'),
      value: formatNumber(stats.last24Hours),
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: t('trafficLogs.stats.last7Days'),
      value: formatNumber(stats.last7Days),
      icon: BarChart3,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      title: t('trafficLogs.stats.last30Days'),
      value: formatNumber(stats.last30Days),
      icon: TrendingDown,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    },
    {
      title: t('trafficLogs.stats.dataTransferred'),
      value: formatBytes(stats.totalDataTransferred),
      icon: Database,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="p-6 hover:shadow-lg transition-shadow duration-200 border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}

      {/* Top Methods */}
      {Object.keys(stats.byMethod).length > 0 && (
        <Card className="p-6 col-span-full lg:col-span-2 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t('trafficLogs.stats.topMethods')}
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byMethod)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([method, count]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                    {method}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${(count / stats.totalRequests) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-16 text-right">
                      {formatNumber(count)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Status Code Distribution */}
      {Object.keys(stats.byStatus).length > 0 && (
        <Card className="p-6 col-span-full lg:col-span-2 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            {t('trafficLogs.stats.statusDistribution')}
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byStatus)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                let color = 'bg-gray-600';
                if (status.startsWith('2')) color = 'bg-green-600 dark:bg-green-500';
                else if (status.startsWith('3')) color = 'bg-blue-600 dark:bg-blue-500';
                else if (status.startsWith('4')) color = 'bg-orange-600 dark:bg-orange-500';
                else if (status.startsWith('5')) color = 'bg-red-600 dark:bg-red-500';

                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                      {status}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full`}
                          style={{
                            width: `${(count / stats.totalRequests) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-16 text-right">
                        {formatNumber(count)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
};