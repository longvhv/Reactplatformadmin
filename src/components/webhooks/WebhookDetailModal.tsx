/**
 * WebhookDetailModal Component
 * Modal for viewing webhook details with tabs
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Activity, Info, BarChart3 } from 'lucide-react';
import { Webhook } from '../../api/webhooksApi';
import { webhookDeliveryLogsApi, DeliveryStats } from '../../api/webhookDeliveryLogsApi';
import { WebhookStatsTab } from './WebhookStatsTab';

interface WebhookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhook: Webhook | null;
}

type TabType = 'details' | 'stats';

export function WebhookDetailModal({ isOpen, onClose, webhook }: WebhookDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (isOpen && webhook && activeTab === 'stats') {
      loadStats();
    }
  }, [isOpen, webhook, activeTab]);

  const loadStats = async () => {
    if (!webhook) return;
    
    setIsLoadingStats(true);
    try {
      const deliveryStats = await webhookDeliveryLogsApi.getStats(webhook._id);
      setStats(deliveryStats);
    } catch (error) {
      console.error('Error loading delivery stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (!isOpen || !webhook) return null;

  const successRate = webhook.total_count > 0
    ? Math.round((webhook.success_count / webhook.total_count) * 100)
    : 0;

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('vi-VN');
  };

  const tabs = [
    { id: 'details' as TabType, label: 'Chi tiết', icon: Info },
    { id: 'stats' as TabType, label: 'Thống kê', icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{webhook.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              {webhook.is_active ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <XCircle className="w-3 h-3" />
                  Inactive
                </span>
              )}
              {webhook.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  <Clock className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-1 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Activity className="w-4 h-4" />
                    Total Triggers
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{webhook.total_count.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Success
                  </div>
                  <p className="text-2xl font-bold text-green-700">{webhook.success_count.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                    <TrendingDown className="w-4 h-4" />
                    Failures
                  </div>
                  <p className="text-2xl font-bold text-red-700">{webhook.failure_count.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Success Rate
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{successRate}%</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="space-y-3">
                  {webhook.description && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Description</label>
                      <p className="text-sm text-gray-900">{webhook.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 uppercase">URL</label>
                    <p className="text-sm font-mono text-gray-900 break-all">{webhook.url}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Method</label>
                      <p className="text-sm font-medium text-gray-900">{webhook.method}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Timeout</label>
                      <p className="text-sm text-gray-900">{webhook.timeout_ms}ms</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Types */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Event Types ({webhook.event_types.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {webhook.event_types.map(event => (
                    <span key={event} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">
                      {event}
                    </span>
                  ))}
                </div>
              </div>

              {/* Authentication */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Authentication</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Auth Type</label>
                    <p className="text-sm font-medium text-gray-900 capitalize">{webhook.auth_type}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Secret Key</label>
                    <p className="text-sm text-gray-900">{webhook.secret_key ? '••••••••••••' : 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Retry Configuration */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Retry Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Max Retries</label>
                    <p className="text-sm text-gray-900">{webhook.retry_config.max_retries}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Retry Delay</label>
                    <p className="text-sm text-gray-900">{webhook.retry_config.retry_delay}ms</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Backoff Multiplier</label>
                    <p className="text-sm text-gray-900">{webhook.retry_config.backoff_multiplier}x</p>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Avg Response Time</label>
                    <p className="text-sm text-gray-900">
                      {webhook.avg_response_time_ms ? `${webhook.avg_response_time_ms}ms` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Last Triggered</label>
                    <p className="text-sm text-gray-900">{formatDate(webhook.last_triggered_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Last Success</label>
                    <p className="text-sm text-gray-900">{formatDate(webhook.last_success_at)}</p>
                  </div>
                </div>
                {webhook.last_failure_at && (
                  <div className="mt-3 pt-3 border-t">
                    <label className="text-xs text-gray-500 uppercase">Last Failure</label>
                    <p className="text-sm text-red-600">{formatDate(webhook.last_failure_at)}</p>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              {(webhook.batch_size || webhook.rate_limit || webhook.priority > 0) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Advanced Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {webhook.batch_size && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Batch Size</label>
                        <p className="text-sm text-gray-900">{webhook.batch_size}</p>
                      </div>
                    )}
                    {webhook.rate_limit && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Rate Limit</label>
                        <p className="text-sm text-gray-900">{webhook.rate_limit}/min</p>
                      </div>
                    )}
                    {webhook.priority > 0 && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase">Priority</label>
                        <p className="text-sm text-gray-900">{webhook.priority}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {webhook.tags && webhook.tags.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {webhook.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(webhook.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Updated At</label>
                    <p className="text-sm text-gray-900">{formatDate(webhook.updated_at)}</p>
                  </div>
                  {webhook.verified_at && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Verified At</label>
                      <p className="text-sm text-gray-900">{formatDate(webhook.verified_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <WebhookStatsTab 
              webhook={webhook} 
              stats={stats} 
              isLoading={isLoadingStats}
              onRefresh={loadStats}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default WebhookDetailModal;