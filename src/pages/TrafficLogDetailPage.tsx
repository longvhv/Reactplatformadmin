/**
 * Traffic Log Detail Page
 * View detailed information about a specific traffic log
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Server,
  Globe,
  Activity,
  Database,
  User,
  MapPin,
} from 'lucide-react';
import { getTrafficLogById, deleteTrafficLog, TrafficLog } from '../api/trafficLogsApi';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { StatusCodeBadge } from '../components/traffic-logs/StatusCodeBadge';
import { HttpMethodBadge } from '../components/traffic-logs/HttpMethodBadge';
import { toast } from 'sonner@2.0.3';

export default function TrafficLogDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [log, setLog] = useState<TrafficLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLog();
    }
  }, [id]);

  const loadLog = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await getTrafficLogById(id);
      setLog(data);
    } catch (error) {
      console.error('Error loading traffic log:', error);
      toast.error(t('trafficLogs.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm(t('trafficLogs.deleteConfirm'))) return;

    try {
      await deleteTrafficLog(id);
      toast.success(t('trafficLogs.deleteSuccess'));
      navigate('/core/traffic-logs');
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error(t('trafficLogs.deleteError'));
    }
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/core/traffic-logs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">{t('trafficLogs.notFound')}</p>
          </div>
        </div>
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
                {t('trafficLogs.detailTitle')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
                {log._id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/core/traffic-logs/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          </div>
        </div>

        {/* Request Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('trafficLogs.requestInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.method')}
                </label>
                <div className="mt-1">
                  <HttpMethodBadge method={log.method} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.path')}
                </label>
                <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                  {log.path || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.domain')}
                </label>
                <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                  {log.domain || '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.status')}
                </label>
                <div className="mt-1">
                  <StatusCodeBadge statusCode={log.status_code} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.latency')}
                </label>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {log.latency_ms !== null && log.latency_ms !== undefined
                    ? `${log.latency_ms} ms`
                    : '-'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.requestSize')}
                </label>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatBytes(log.request_size)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.responseSize')}
                </label>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatBytes(log.response_size)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('trafficLogs.totalSize')}
                </label>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatBytes((log.request_size || 0) + (log.response_size || 0))}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Client Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('trafficLogs.clientInfo')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('trafficLogs.ipAddress')}
              </label>
              <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                {log.ip_address || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('trafficLogs.userAgent')}
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-all">
                {log.user_agent || '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Metadata */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('trafficLogs.metadata')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('trafficLogs.appCode')}
              </label>
              <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                {log.app_code || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('trafficLogs.dataRegion')}
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {log.data_region || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('trafficLogs.tenantId')}
              </label>
              <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                {log.tenant_id || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('trafficLogs.userId')}
              </label>
              <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                {log.user_id || '-'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('trafficLogs.timestamp')}
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDate(log.timestamp)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
