/**
 * TenantWebhooksTab Component
 * Tab cho tenant detail page - quản lý webhooks của tenant
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Eye, TestTube, ShieldCheck } from 'lucide-react';
import { useWebhooks } from '@/hooks/useWebhooks';
import { WebhookModal } from '@/components/webhooks/WebhookModal';
import { WebhookDetailModal } from '@/components/webhooks/WebhookDetailModal';
import { Webhook } from '@/api/webhooksApi';
import { toast } from 'sonner';

interface TenantWebhooksTabProps {
  tenantId: string;
}

export function TenantWebhooksTab({ tenantId }: TenantWebhooksTabProps) {
  const { 
    webhooks, loading, createWebhook, updateWebhook, enableWebhook, 
    disableWebhook, verifyWebhook, testWebhook, deleteWebhook, getStats, getWebhook 
  } = useWebhooks({ tenant_id: tenantId });
  
  const [stats, setStats] = useState({ 
    total: 0, 
    active: 0, 
    inactive: 0, 
    verified: 0, 
    unverified: 0, 
    total_triggers: 0, 
    total_success: 0, 
    total_failures: 0, 
    avg_success_rate: 0,
    avg_response_time_ms: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [viewingWebhook, setViewingWebhook] = useState<Webhook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    if (webhooks.length > 0 || !loading) {
      loadStats();
    }
  }, [webhooks, loading, getStats]);

  const handleCreate = () => {
    setEditingWebhook(null);
    setIsModalOpen(true);
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setIsModalOpen(true);
  };

  const handleView = async (webhook: Webhook) => {
    try {
      const full = await getWebhook(webhook._id);
      setViewingWebhook(full);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error loading webhook details:', error);
      toast.error('Lỗi khi tải chi tiết webhook');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingWebhook) {
        await updateWebhook(editingWebhook._id, data);
        toast.success('Đã cập nhật webhook');
      } else {
        await createWebhook({ ...data, tenant_id: tenantId });
        toast.success('Đã tạo webhook mới');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Lỗi khi lưu webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa webhook này?')) return;
    setDeletingId(id);
    try {
      await deleteWebhook(id);
      toast.success('Đã xóa webhook');
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Lỗi khi xóa webhook');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (webhook: Webhook) => {
    try {
      if (webhook.is_active) {
        await disableWebhook(webhook._id);
        toast.success('Đã vô hiệu hóa webhook');
      } else {
        await enableWebhook(webhook._id);
        toast.success('Đã kích hoạt webhook');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleVerify = async (id: string) => {
    if (!window.confirm('Mark this webhook as verified?')) return;
    try {
      await verifyWebhook(id);
      toast.success('Đã xác thực webhook');
    } catch (error) {
      console.error('Error verifying webhook:', error);
      toast.error('Lỗi khi xác thực webhook');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testWebhook(id);
      toast.success(result.message || 'Test thành công');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Test failed: ' + message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Tổng Webhooks</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.verified}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Triggers</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.total_triggers.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{Math.round(stats.avg_success_rate)}%</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Webhooks ({webhooks.length})
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Webhook
        </button>
      </div>

      {/* Webhooks Table */}
      {webhooks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">Chưa có webhook nào</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Events</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stats</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {webhooks.map((webhook) => (
                  <tr key={webhook._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{webhook.name}</p>
                        <p className="text-xs text-gray-500">
                          {webhook.method} • Priority: {webhook.priority}
                        </p>
                        {webhook.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                            {webhook.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono text-gray-600 truncate max-w-xs">{webhook.url}</p>
                      {webhook.timeout_ms && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Timeout: {webhook.timeout_ms}ms
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {webhook.event_types.slice(0, 2).map(event => (
                          <span key={event} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">
                            {event}
                          </span>
                        ))}
                        {webhook.event_types.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            +{webhook.event_types.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm space-y-0.5">
                        <p className="text-gray-900">
                          <span className="text-green-600 font-medium">{webhook.success_count}</span>
                          {' / '}
                          <span className="text-red-600 font-medium">{webhook.failure_count}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {webhook.total_count} total
                          {webhook.avg_response_time_ms && ` • ${webhook.avg_response_time_ms}ms`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
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
                        {webhook.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 ml-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(webhook)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTest(webhook._id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Test"
                        >
                          <TestTube className="w-4 h-4" />
                        </button>
                        {!webhook.is_verified && (
                          <button
                            onClick={() => handleVerify(webhook._id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Verify"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(webhook)}
                          className={`p-1 rounded transition-colors ${webhook.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={webhook.is_active ? 'Disable' : 'Enable'}
                        >
                          {webhook.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(webhook)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(webhook._id)}
                          disabled={deletingId === webhook._id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <WebhookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        webhook={editingWebhook}
        tenantId={tenantId}
      />

      <WebhookDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        webhook={viewingWebhook}
      />
    </div>
  );
}

export default TenantWebhooksTab;