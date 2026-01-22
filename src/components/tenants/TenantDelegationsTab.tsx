/**
 * TenantDelegationsTab Component
 * Tab cho tenant detail page - hiển thị delegations của tenant
 * 
 * ✅ REWRITTEN 2026-01-14: Use new interface with 21 fields
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  Copy,
  Calendar,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useUserDelegations } from '../../hooks/useUserDelegations';
import {
  UserDelegation,
  DelegationStatus,
  DelegationScope,
  getStatusColor,
  getScopeColor,
  formatDate,
  formatDateTime,
  getDaysUntilExpiry,
  isExpiringSoon,
  computeStatus,
} from '../../api/userDelegationsApi';
import { supabase } from '../../utils/supabase/client';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner@2.0.3';

interface TenantDelegationsTabProps {
  tenantId: string;
}

export function TenantDelegationsTab({ tenantId }: TenantDelegationsTabProps) {
  const {
    delegations,
    loading,
    createDelegation,
    updateDelegation,
    activateDelegation,
    suspendDelegation,
    revokeDelegation,
    resumeDelegation,
    extendDelegation,
    deleteDelegation,
    getStats,
    refresh,
  } = useUserDelegations({ tenant_id: tenantId });

  const [stats, setStats] = useState({
    total: 0,
    by_status: {
      pending: 0,
      active: 0,
      expired: 0,
      revoked: 0,
      suspended: 0,
    },
    by_scope: {
      admin: 0,
      manager: 0,
      editor: 0,
      viewer: 0,
      approver: 0,
      reviewer: 0,
      auditor: 0,
      custom: 0,
    },
    active_now: 0,
    expiring_soon: 0,
    expiring_today: 0,
  });

  const [selectedDelegation, setSelectedDelegation] = useState<UserDelegation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  useEffect(() => {
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    loadStats();
  }, [delegations]);

  const filteredDelegations = delegations.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (scopeFilter !== 'all' && d.scope !== scopeFilter) return false;
    return true;
  });

  const handleActivate = async (id: string) => {
    try {
      await activateDelegation(id);
      toast.success('Đã kích hoạt ủy quyền');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleSuspend = async (id: string) => {
    const reason = prompt('Lý do tạm dừng:');
    if (reason === null) return;

    try {
      await suspendDelegation(id, reason);
      toast.success('Đã tạm dừng ủy quyền');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleRevoke = async (id: string) => {
    const reason = prompt('Lý do thu hồi:');
    if (reason === null) return;

    if (!confirm('Bạn có chắc muốn thu hồi ủy quyền này?')) return;

    try {
      await revokeDelegation(id, {
        revoked_by: 'current-user-id', // TODO: Get from auth context
        revoked_reason: reason,
      });
      toast.success('Đã thu hồi ủy quyền');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeDelegation(id);
      toast.success('Đã tiếp tục ủy quyền');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleExtend = async (id: string) => {
    const newEndDate = prompt('Ngày hết hạn mới (YYYY-MM-DD):');
    if (!newEndDate) return;

    try {
      await extendDelegation(id, newEndDate);
      toast.success('Đã gia hạn ủy quyền');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ủy quyền này?')) return;

    try {
      await deleteDelegation(id);
      toast.success('Đã xóa ủy quyền');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleViewDetails = (delegation: UserDelegation) => {
    setSelectedDelegation(delegation);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status?: DelegationStatus) => {
    const icons = {
      pending: Clock,
      active: CheckCircle,
      expired: AlertCircle,
      revoked: XCircle,
      suspended: Pause,
    };
    return icons[status || 'pending'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ủy quyền người dùng
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quản lý ủy quyền quyền hạn giữa các người dùng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.active')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.by_status.active}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.by_status.pending}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sắp hết hạn</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.expiring_soon}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revoked</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.by_status.revoked}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Phạm vi
            </label>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
              <option value="approver">Approver</option>
              <option value="reviewer">Reviewer</option>
              <option value="auditor">Auditor</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {filteredDelegations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter !== 'all' || scopeFilter !== 'all'
                ? 'Không tìm thấy ủy quyền nào phù hợp'
                : 'Tenant chưa có ủy quyền nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Delegator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Delegate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Scope
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Lý do
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDelegations.map((delegation) => {
                  const StatusIcon = getStatusIcon(delegation.status);
                  const daysLeft = getDaysUntilExpiry(delegation.end_date);
                  const expiringSoon = isExpiringSoon(delegation.end_date);

                  return (
                    <tr
                      key={delegation._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Delegator #{delegation.delegator_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Delegate #{delegation.delegate_id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {delegation.scope && (
                          <Badge className={getScopeColor(delegation.scope)}>
                            {delegation.scope}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(delegation.status)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {delegation.status || 'active'}
                          </Badge>
                          {expiringSoon && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              ({daysLeft} ngày)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(delegation.start_date)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          → {formatDate(delegation.end_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {delegation.reason || '-'}
                        </div>
                        {delegation.notes && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 italic">
                            {delegation.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(delegation)}
                            title="Chi tiết"
                          >
                            <Info className="w-4 h-4" />
                          </Button>

                          {delegation.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivate(delegation._id)}
                              title="Kích hoạt"
                            >
                              <Play className="w-4 h-4 text-green-600" />
                            </Button>
                          )}

                          {delegation.status === 'active' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuspend(delegation._id)}
                                title="Tạm dừng"
                              >
                                <Pause className="w-4 h-4 text-yellow-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExtend(delegation._id)}
                                title="Gia hạn"
                              >
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </Button>
                            </>
                          )}

                          {delegation.status === 'suspended' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResume(delegation._id)}
                              title="Tiếp tục"
                            >
                              <Play className="w-4 h-4 text-green-600" />
                            </Button>
                          )}

                          {(delegation.status === 'active' || delegation.status === 'suspended') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(delegation._id)}
                              title="Thu hồi"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(delegation._id)}
                            title="Xóa"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedDelegation && (
        <DelegationDetailsModal
          delegation={selectedDelegation}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDelegation(null);
          }}
        />
      )}
    </div>
  );
}

// ==================== DELEGATION DETAILS MODAL ====================

interface DelegationDetailsModalProps {
  delegation: UserDelegation;
  onClose: () => void;
}

function DelegationDetailsModal({ delegation, onClose }: DelegationDetailsModalProps) {
  const daysLeft = getDaysUntilExpiry(delegation.end_date);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chi tiết ủy quyền
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
            <div className="mt-1">
              <Badge className={getStatusColor(delegation.status)}>
                {delegation.status || 'active'}
              </Badge>
              {daysLeft !== null && daysLeft > 0 && (
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Còn {daysLeft} ngày
                </span>
              )}
            </div>
          </div>

          {/* Users */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Delegator</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {delegation.delegator_id}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Delegate</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {delegation.delegate_id}
              </div>
            </div>
          </div>

          {/* Scope & Permissions */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phạm vi</label>
            <div className="mt-1">
              {delegation.scope && (
                <Badge className={getScopeColor(delegation.scope)}>{delegation.scope}</Badge>
              )}
            </div>
          </div>

          {delegation.permissions && delegation.permissions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quyền hạn</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {delegation.permissions.map((perm, idx) => (
                  <Badge key={idx} variant="secondary">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bắt đầu</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDateTime(delegation.start_date)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kết thúc</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDateTime(delegation.end_date)}
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          {delegation.reason && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lý do</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {delegation.reason}
              </div>
            </div>
          )}

          {delegation.notes && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {delegation.notes}
              </div>
            </div>
          )}

          {/* Revoke Info */}
          {delegation.revoked_at && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="text-sm font-medium text-red-900 dark:text-red-400 mb-2">
                Thông tin thu hồi
              </h4>
              <div className="space-y-1 text-sm text-red-700 dark:text-red-300">
                <div>Thời gian: {formatDateTime(delegation.revoked_at)}</div>
                {delegation.revoked_by && <div>Người thu hồi: {delegation.revoked_by}</div>}
                {delegation.revoked_reason && <div>Lý do: {delegation.revoked_reason}</div>}
              </div>
            </div>
          )}

          {/* Config */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tự động hết hạn</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {delegation.auto_expire ? 'Có' : 'Không'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Đã thông báo</label>
              <div className="mt-1 text-sm text-gray-900 dark:text-white">
                {delegation.notified_before_expiry ? 'Có' : 'Chưa'}
              </div>
            </div>
          </div>

          {/* Metadata */}
          {delegation.metadata && Object.keys(delegation.metadata).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Metadata</label>
              <pre className="mt-1 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                {JSON.stringify(delegation.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Audit */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div>
                <div>Tạo lúc: {formatDateTime(delegation.created_at)}</div>
                {delegation.updated_at && (
                  <div>Cập nhật: {formatDateTime(delegation.updated_at)}</div>
                )}
              </div>
              <div>
                <div>Version: {delegation.version}</div>
                <div>ID: {delegation._id}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}

export default TenantDelegationsTab;