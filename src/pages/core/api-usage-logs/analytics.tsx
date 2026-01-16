/**
 * API Usage Logs Analytics Page
 * Displays analytics and statistics for API usage
 * Route: /core/api-usage-logs/analytics
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { ApiUsageLogsAnalytics } from '../../../components/api-usage-logs/ApiUsageLogsAnalytics';
import { ApiUsageLogFilters } from '../../../services/apiUsageLogsService';

export default function ApiUsageLogsAnalyticsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ApiUsageLogFilters>({});
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Update filters based on date range
  const updateDateRange = (range: '7d' | '30d' | '90d' | 'all') => {
    setDateRange(range);
    
    const now = new Date();
    let date_from: string | undefined;

    switch (range) {
      case '7d':
        date_from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        date_from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        date_from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'all':
        date_from = undefined;
        break;
    }

    setFilters({ ...filters, date_from });
  };

  // Export analytics report
  const exportReport = () => {
    // In production, this would generate a comprehensive analytics report
    console.log('Exporting analytics report...');
    alert(t('common.exportSuccess'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/core/api-usage-logs')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('apiUsageLogs.analytics')}
                </h1>
                <p className="text-gray-500 mt-2">
                  {t('apiUsageLogs.analyticsDescription')}
                </p>
              </div>
            </div>

            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              {t('common.export')}
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => updateDateRange(range)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiUsageLogsAnalytics filters={filters} />
      </div>
    </div>
  );
}
