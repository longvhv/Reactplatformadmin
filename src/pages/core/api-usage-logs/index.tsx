/**
 * API Usage Logs List Page
 * Main page for viewing and managing API usage logs
 * Route: /core/api-usage-logs
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BarChart3, Settings, Plus } from 'lucide-react';
import { ApiUsageLogsList } from '../../../components/api-usage-logs/ApiUsageLogsList';
import { ApiUsageLog } from '../../../services/apiUsageLogsService';

export default function ApiUsageLogsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

  // Handle log selection
  const handleSelectLog = (log: ApiUsageLog) => {
    navigate(`/core/api-usage-logs/${log._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('apiUsageLogs.title')}
              </h1>
              <p className="text-gray-500 mt-2">
                {t('apiUsageLogs.description')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/core/api-usage-logs/analytics')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                {t('apiUsageLogs.analytics')}
              </button>
              <button
                onClick={() => navigate('/core/api-usage-logs/settings')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t('common.settings')}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('apiUsageLogs.allLogs')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiUsageLogsList onSelectLog={handleSelectLog} />
      </div>
    </div>
  );
}
