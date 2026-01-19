/**
 * API Usage Logs Settings Component
 * Manages settings and configurations for API usage logging
 * Design inspired by Stripe/GitHub/Vercel
 */

import React, { useState } from 'react';
import { useTranslation } from '../../providers/LanguageProvider';
import { Settings, Database, Clock, Shield, AlertTriangle, Save } from 'lucide-react';

export const ApiUsageLogsSettings: React.FC = () => {
  const { t } = useTranslation();
  
  // Settings state
  const [settings, setSettings] = useState({
    retention_days: 90,
    enable_logging: true,
    log_request_body: false,
    log_response_body: false,
    enable_analytics: true,
    alert_on_errors: true,
    error_threshold: 10,
    latency_threshold: 5000,
  });

  const [saved, setSaved] = useState(false);

  // Handle save
  const handleSave = () => {
    // In production, this would call an API endpoint
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('apiUsageLogs.settings')}
        </h3>
        <p className="text-sm text-gray-500">
          {t('apiUsageLogs.settingsDescription')}
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="h-4 w-4" />
          {t('apiUsageLogs.generalSettings')}
        </h4>
        
        <div className="space-y-4">
          {/* Enable Logging */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                {t('apiUsageLogs.enableLogging')}
              </label>
              <p className="text-sm text-gray-500">
                {t('apiUsageLogs.enableLoggingDescription')}
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enable_logging: !settings.enable_logging })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enable_logging ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enable_logging ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Retention Period */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t('apiUsageLogs.retentionPeriod')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="365"
                value={settings.retention_days}
                onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) })}
                className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-500">{t('common.days')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('apiUsageLogs.retentionPeriodDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Data Collection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t('apiUsageLogs.dataCollection')}
        </h4>
        
        <div className="space-y-4">
          {/* Log Request Body */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                {t('apiUsageLogs.logRequestBody')}
              </label>
              <p className="text-sm text-gray-500">
                {t('apiUsageLogs.logRequestBodyDescription')}
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, log_request_body: !settings.log_request_body })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.log_request_body ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.log_request_body ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Log Response Body */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                {t('apiUsageLogs.logResponseBody')}
              </label>
              <p className="text-sm text-gray-500">
                {t('apiUsageLogs.logResponseBodyDescription')}
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, log_response_body: !settings.log_response_body })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.log_response_body ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.log_response_body ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Enable Analytics */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                {t('apiUsageLogs.enableAnalytics')}
              </label>
              <p className="text-sm text-gray-500">
                {t('apiUsageLogs.enableAnalyticsDescription')}
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enable_analytics: !settings.enable_analytics })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enable_analytics ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enable_analytics ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {t('apiUsageLogs.alertsNotifications')}
        </h4>
        
        <div className="space-y-4">
          {/* Alert on Errors */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                {t('apiUsageLogs.alertOnErrors')}
              </label>
              <p className="text-sm text-gray-500">
                {t('apiUsageLogs.alertOnErrorsDescription')}
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, alert_on_errors: !settings.alert_on_errors })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.alert_on_errors ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.alert_on_errors ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Error Threshold */}
          {settings.alert_on_errors && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {t('apiUsageLogs.errorThreshold')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.error_threshold}
                  onChange={(e) => setSettings({ ...settings, error_threshold: parseInt(e.target.value) })}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {t('apiUsageLogs.errorThresholdDescription')}
              </p>
            </div>
          )}

          {/* Latency Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('apiUsageLogs.latencyThreshold')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="100"
                max="30000"
                step="100"
                value={settings.latency_threshold}
                onChange={(e) => setSettings({ ...settings, latency_threshold: parseInt(e.target.value) })}
                className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-500">ms</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('apiUsageLogs.latencyThresholdDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('common.saved')}
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          {t('common.save')}
        </button>
      </div>
    </div>
  );
};