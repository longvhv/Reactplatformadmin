/**
 * API Usage Logs Settings Page
 * Configuration and settings for API usage logging
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../providers/LanguageProvider';
import { ArrowLeft } from 'lucide-react';
import { ApiUsageLogsSettings } from '../../../components/api-usage-logs/ApiUsageLogsSettings';

export default function ApiUsageLogsSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/core/api-usage-logs')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('apiUsageLogs.settings')}
              </h1>
              <p className="text-gray-500 mt-2">
                {t('apiUsageLogs.settingsDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiUsageLogsSettings />
      </div>
    </div>
  );
}