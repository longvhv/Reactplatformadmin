/**
 * API Usage Log Detail Page
 * Shows details of a specific API usage log
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from '../../providers/LanguageProvider';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { ApiUsageLogDetail } from '../../../components/api-usage-logs/ApiUsageLogDetail';
import { apiUsageLogsService, ApiUsageLog } from '../../../services/apiUsageLogsService';

export default function ApiUsageLogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [log, setLog] = useState<ApiUsageLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load log
  useEffect(() => {
    if (!id) return;

    const loadLog = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiUsageLogsService.getById(id);
        if (data) {
          setLog(data);
        } else {
          setError(t('apiUsageLogs.notFound'));
        }
      } catch (err) {
        setError(t('apiUsageLogs.fetchError'));
        console.error('Error loading API usage log:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLog();
  }, [id, t]);

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;

    try {
      await apiUsageLogsService.delete(id);
      navigate('/core/api-usage-logs');
    } catch (err) {
      console.error('Error deleting log:', err);
      alert(t('common.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || t('apiUsageLogs.notFound')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/core/api-usage-logs')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('apiUsageLogs.detail')}
                </h1>
                <p className="text-gray-500 mt-1">
                  {log.api_method} {log.api_endpoint}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiUsageLogDetail log={log} />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('common.confirmDelete')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('apiUsageLogs.deleteConfirm')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}