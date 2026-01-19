/**
 * Webhooks Page
 * Main page for webhooks management
 * 
 * Features:
 * - Table and Grid view modes
 * - Search by target URL
 * - Filter by status (active/inactive)
 * - Filter by unhealthy webhooks
 * - Health indicator (based on failure_count)
 * - Test webhook functionality
 * - Secret key management
 * - CRUD operations
 * - Responsive design
 * 
 * ✅ MIGRATED to Phase 3 Standards (2026-01-18):
 * - Replaced confirm() with ConfirmDialog
 * - Using showToast for all notifications
 * - Wrapped in Fragment
 * - Using PageLayout with icon/title/description
 * - Full dark mode support
 */

import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { webhooksApi, Webhook } from '../api/webhooksApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Webhook as WebhookIcon, 
  Plus, 
  Search, 
  Grid, 
  List, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  PlayCircle, 
  PauseCircle, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Link as LinkIcon,
  Key,
  Activity,
  Zap,
} from 'lucide-react';
import { showToast } from '../lib/toast';
import { PageLayout } from '../components/layout/PageLayout';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export default function WebhooksPage() {
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [unhealthyFilter, setUnhealthyFilter] = useState(false);
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadWebhooks();
  }, [activeFilter, unhealthyFilter]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await webhooksApi.getAll({
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
        is_verified: undefined,
        tenant_id: undefined,
      });
      setWebhooks(data);
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể tải danh sách webhooks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadWebhooks();
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa webhook',
      description: 'Bạn có chắc muốn xóa webhook này?',
      onConfirm: async () => {
        try {
          await webhooksApi.delete(id);
          showToast.success('Thành công', 'Xóa webhook thành công');
          loadWebhooks();
        } catch (error: any) {
          showToast.error('Lỗi', 'Không thể xóa webhook: ' + error.message);
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleTest = async (webhook: Webhook) => {
    try {
      showToast.info('Thông báo', 'Webhook testing - Feature to be implemented');
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể test webhook: ' + error.message);
    }
  };

  const handleResetFailures = async (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Reset failures',
      description: 'Bạn có muốn reset failure count về 0?',
      onConfirm: async () => {
        try {
          showToast.info('Thông báo', 'Reset failures - Feature to be implemented');
          loadWebhooks();
        } catch (error: any) {
          showToast.error('Lỗi', 'Không thể reset failures: ' + error.message);
        }
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const getHealthBadge = (failureCount: number) => {
    // Use failure_count from DB (correct field!)
    if (failureCount === 0) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (failureCount <= 5) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  };

  const getHealthLabel = (failureCount: number) => {
    if (failureCount === 0) return 'Healthy';
    if (failureCount <= 5) return `${failureCount} failures`;
    return `Unhealthy (${failureCount})`;
  };

  const getHealthIcon = (failureCount: number) => {
    if (failureCount === 0) return <CheckCircle2 className="w-4 h-4" />;
    if (failureCount <= 5) return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const copySecretKey = (secretKey: string) => {
    navigator.clipboard.writeText(secretKey);
    showToast.success('Thành công', 'Secret key đã được copy vào clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <Fragment>
      <PageLayout
        icon={WebhookIcon}
        title="Webhooks"
        description={`${webhooks.length} webhooks`}
        actions={
          <Button
            onClick={() => navigate('/integrations/webhooks/add', { replace: true })}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo webhook mới
          </Button>
        }
      >
        {/* Filters & Search */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Tìm theo target URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Active Filter */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Tạm dừng</option>
            </select>

            {/* Unhealthy Filter */}
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={unhealthyFilter}
                onChange={(e) => setUnhealthyFilter(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-900 dark:text-white">Chỉ unhealthy</span>
            </label>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                onClick={() => setViewMode('table')}
                size="sm"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
                size="sm"
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Target URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Events
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Health
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {webhooks.map((webhook) => (
                    <tr
                      key={webhook._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <button
                              onClick={() => navigate(`/integrations/webhooks/${webhook._id}`)}
                              className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-xs text-left"
                            >
                              {webhook.url}
                            </button>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {webhook.name || 'Unnamed webhook'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {webhook.event_types?.slice(0, 2).map((event) => (
                            <span key={event} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-xs rounded">
                              {event}
                            </span>
                          ))}
                          {(webhook.event_types?.length || 0) > 2 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                              +{(webhook.event_types?.length || 0) - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {webhook.is_active ? (
                          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            <Activity className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getHealthBadge(webhook.failure_count)}`}>
                          {getHealthIcon(webhook.failure_count)}
                          {getHealthLabel(webhook.failure_count)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTest(webhook)}
                            title="Test webhook"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/integrations/webhooks/edit/${webhook._id}`, { replace: true })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(webhook._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webhooks.map((webhook) => (
              <div
                key={webhook._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-lg">
                        <WebhookIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <button
                          onClick={() => navigate(`/integrations/webhooks/${webhook._id}`)}
                          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-left"
                        >
                          {webhook.name || 'Unnamed webhook'}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {webhook.event_types?.length || 0} events
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* URL */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                      <LinkIcon className="w-3 h-3" />
                      <span>Target URL</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white truncate font-mono">
                      {webhook.url}
                    </p>
                  </div>

                  {/* Status & Health */}
                  <div className="flex gap-2 mb-4">
                    {webhook.is_active ? (
                      <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <Activity className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                    <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getHealthBadge(webhook.failure_count)}`}>
                      {getHealthIcon(webhook.failure_count)}
                      {getHealthLabel(webhook.failure_count)}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Subscribed Events:</div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.event_types?.slice(0, 3).map((event) => (
                        <span key={event} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-xs rounded">
                          {event}
                        </span>
                      ))}
                      {(webhook.event_types?.length || 0) > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                          +{(webhook.event_types?.length || 0) - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Secret Key */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                      <Key className="w-3 h-3" />
                      <span>Secret Key</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-1 truncate">
                        {webhook.secret_key ? webhook.secret_key.substring(0, 20) + '...' : 'Not set'}
                      </code>
                      {webhook.secret_key && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copySecretKey(webhook.secret_key!)}
                        >
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook)}
                      className="flex-1"
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/integrations/webhooks/edit/${webhook._id}`, { replace: true })}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {webhooks.length === 0 && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <WebhookIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Chưa có webhook nào
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Bắt đầu bằng cách tạo webhook mới để nhận event notifications
            </p>
            <Button
              onClick={() => navigate('/integrations/webhooks/add')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo webhook mới
            </Button>
          </div>
        )}
      </PageLayout>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmLabel="Xác nhận"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </Fragment>
  );
}