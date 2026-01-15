/**
 * Webhook Detail Page
 * Page for viewing webhook details
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { 
  ArrowLeft, 
  Webhook as WebhookIcon, 
  AlertCircle,
  Loader,
  Activity,
  XCircle,
  CheckCircle2,
  LinkIcon,
  Key,
  Calendar,
  Edit
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { webhooksApi, Webhook } from '../api/webhooksApi';

export default function WebhookDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadWebhook();
    }
  }, [id]);

  const loadWebhook = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await webhooksApi.getById(id);
      setWebhook(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải webhook');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải webhook...</p>
        </div>
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Không tìm thấy webhook
          </h2>
          <div className="mb-6 space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              {error || 'Webhook không tồn tại hoặc đã bị xóa'}
            </p>
            {id && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  Webhook ID: <span className="font-semibold">{id}</span>
                </p>
              </div>
            )}
          </div>
          <Link
            to="/core/webhooks"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách webhooks
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (webhook.is_active) {
      return (
        <span className="px-3 py-1 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <Activity className="w-4 h-4" />
          Active
        </span>
      );
    }
    return (
      <span className="px-3 py-1 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        <XCircle className="w-4 h-4" />
        Inactive
      </span>
    );
  };

  const getHealthBadge = (failureCount: number) => {
    if (failureCount === 0) {
      return (
        <span className="px-3 py-1 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle2 className="w-4 h-4" />
          Healthy
        </span>
      );
    } else if (failureCount <= 5) {
      return (
        <span className="px-3 py-1 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          <AlertCircle className="w-4 h-4" />
          {failureCount} failures
        </span>
      );
    }
    return (
      <span className="px-3 py-1 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
        <XCircle className="w-4 h-4" />
        Unhealthy ({failureCount})
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/core/webhooks')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <WebhookIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Chi tiết Webhook
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  ID: {webhook._id}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/core/webhooks/edit/${webhook._id}`)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </div>

        {/* Status & Health */}
        <div className="flex gap-3 mb-6">
          {getStatusBadge()}
          {getHealthBadge(webhook.failure_count)}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Target URL */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
              <LinkIcon className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Target URL</h2>
            </div>
            <p className="text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 break-all">
              {webhook.url}
            </p>
          </div>

          {/* Subscribed Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Subscribed Events ({webhook.event_types?.length || 0})
            </h2>
            <div className="flex flex-wrap gap-2">
              {webhook.event_types && webhook.event_types.length > 0 ? (
                webhook.event_types.map((event) => (
                  <span 
                    key={event}
                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-sm rounded-md font-medium"
                  >
                    {event}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No events subscribed</p>
              )}
            </div>
          </div>

          {/* Secret Key */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
              <Key className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Secret Key</h2>
            </div>
            {webhook.secret_key ? (
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm font-mono bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 break-all">
                  {webhook.secret_key}
                </code>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(webhook.secret_key!);
                    alert('Secret key copied to clipboard!');
                  }}
                >
                  Copy
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">Không có secret key</p>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
              <Calendar className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Metadata</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Failure Count</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{webhook.failure_count}</p>
              </div>
              {webhook.tenant_name && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tenant</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{webhook.tenant_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(webhook.created_at!).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated At</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(webhook.updated_at!).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}