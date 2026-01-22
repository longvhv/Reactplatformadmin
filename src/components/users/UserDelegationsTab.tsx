/**
 * UserDelegationsTab Component  
 * Tab cho user detail page - hiển thị delegations của user
 * 
 * ✅ ENHANCED 2026-01-20:
 * - Added Revoke functionality
 * - Connected to real data via hooks
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Clock, XCircle, AlertCircle, ArrowRight, ArrowLeft, Ban, PlayCircle, PauseCircle } from 'lucide-react';
import { useUserDelegations } from '../../hooks/useUserDelegations';
import { DelegationModal } from '../delegations/DelegationModal';
import { UserDelegation } from '../../api/userDelegationsApi';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner';

interface UserDelegationsTabProps {
  userId: string;
}

export function UserDelegationsTab({ userId }: UserDelegationsTabProps) {
  const { 
    delegations, 
    loading, 
    createDelegation, 
    updateDelegation, 
    deleteDelegation,
    revokeDelegation,
    activateDelegation,
    suspendDelegation,
    refresh 
  } = useUserDelegations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelegation, setEditingDelegation] = useState<UserDelegation | null>(null);
  const [users, setUsers] = useState<Array<{ _id: string; email: string; full_name?: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ _id: string; name: string }>>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'delegated' | 'received'>('all');

  // Filter delegations for this user
  const userDelegations = delegations.filter(d => 
    d.delegator_id === userId || d.delegate_id === userId
  );

  const delegatedByUser = userDelegations.filter(d => d.delegator_id === userId);
  const receivedByUser = userDelegations.filter(d => d.delegate_id === userId);

  const displayDelegations = 
    viewMode === 'delegated' ? delegatedByUser :
    viewMode === 'received' ? receivedByUser :
    userDelegations;

  useEffect(() => {
    loadUsers();
    loadTenants();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('_id, email, full_name').limit(100);
    setUsers(data || []);
  };

  const loadTenants = async () => {
    const { data } = await supabase.from('tenants').select('_id, name').limit(50);
    setTenants(data || []);
  };

  const handleCreate = () => {
    setEditingDelegation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (delegation: UserDelegation) => {
    setEditingDelegation(delegation);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingDelegation) {
        await updateDelegation(editingDelegation._id, data);
        toast.success('Đã cập nhật ủy quyền');
      } else {
        await createDelegation(data);
        toast.success('Đã tạo ủy quyền mới');
      }
      refresh();
    } catch (error) {
      console.error('Error saving delegation:', error);
      toast.error('Có lỗi xảy ra');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn ủy quyền này? Hành động này không thể hoàn tác.')) return;
    setProcessingId(id);
    try {
      await deleteDelegation(id);
      toast.success('Đã xóa ủy quyền');
    } catch (error) {
      toast.error('Không thể xóa ủy quyền');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    const reason = window.prompt('Nhập lý do thu hồi ủy quyền:');
    if (reason === null) return; // Cancelled

    setProcessingId(id);
    try {
      await revokeDelegation(id, {
        revoked_by: userId, // Assuming current user performs action
        revoked_reason: reason || 'Thu hồi thủ công',
      });
      toast.success('Đã thu hồi ủy quyền');
    } catch (error) {
      toast.error('Không thể thu hồi ủy quyền');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (id: string) => {
    const reason = window.prompt('Nhập lý do tạm ngưng:');
    if (reason === null) return;

    setProcessingId(id);
    try {
      await suspendDelegation(id, reason || 'Tạm ngưng thủ công');
      toast.success('Đã tạm ngưng ủy quyền');
    } catch (error) {
      toast.error('Không thể tạm ngưng ủy quyền');
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivate = async (id: string) => {
    setProcessingId(id);
    try {
      await activateDelegation(id);
      toast.success('Đã kích hoạt lại ủy quyền');
    } catch (error) {
      toast.error('Không thể kích hoạt ủy quyền');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { icon: CheckCircle, class: 'bg-green-100 text-green-700', label: 'Active' },
      pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      expired: { icon: AlertCircle, class: 'bg-orange-100 text-orange-700', label: 'Expired' },
      revoked: { icon: XCircle, class: 'bg-red-100 text-red-700', label: 'Revoked' },
      suspended: { icon: PauseCircle, class: 'bg-gray-100 text-gray-700', label: 'Suspended' },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getScopeBadge = (scope: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      manager: 'bg-blue-100 text-blue-700',
      editor: 'bg-indigo-100 text-indigo-700',
      viewer: 'bg-gray-100 text-gray-700',
      approver: 'bg-green-100 text-green-700',
      reviewer: 'bg-cyan-100 text-cyan-700',
      auditor: 'bg-pink-100 text-pink-700',
      custom: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[scope] || colors.viewer}`}>
        {scope}
      </span>
    );
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tất cả</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{userDelegations.length}</p>
            </div>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Xem
            </button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Đã ủy quyền (Tôi tạo)
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{delegatedByUser.length}</p>
            </div>
            <button
              onClick={() => setViewMode('delegated')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'delegated' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Xem
            </button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Được ủy quyền (Tôi nhận)
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">{receivedByUser.length}</p>
            </div>
            <button
              onClick={() => setViewMode('received')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'received' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Xem
            </button>
          </div>
        </div>
      </div>

      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {viewMode === 'all' && <p className="text-sm text-gray-600">Hiển thị tất cả ủy quyền</p>}
          {viewMode === 'delegated' && (
            <p className="text-sm text-gray-600">Danh sách ủy quyền bạn đã cấp cho người khác</p>
          )}
          {viewMode === 'received' && (
            <p className="text-sm text-gray-600">Danh sách ủy quyền bạn nhận được từ người khác</p>
          )}
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo ủy quyền
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {displayDelegations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Không có ủy quyền nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người ủy quyền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người nhận</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phạm vi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayDelegations.map((delegation) => {
                  const isRevocable = delegation.status === 'active' || delegation.status === 'pending';
                  const isSuspendable = delegation.status === 'active';
                  const isActivatable = delegation.status === 'suspended';

                  return (
                    <tr key={delegation._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${delegation.delegator_id === userId ? 'text-blue-600' : 'text-gray-900'}`}>
                            {delegation.delegator?.full_name || delegation.delegator?.email}
                            {delegation.delegator_id === userId && ' (Tôi)'}
                          </span>
                          <span className="text-xs text-gray-500">{delegation.delegator?.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${delegation.delegate_id === userId ? 'text-green-600' : 'text-gray-900'}`}>
                            {delegation.delegate?.full_name || delegation.delegate?.email}
                            {delegation.delegate_id === userId && ' (Tôi)'}
                          </span>
                          <span className="text-xs text-gray-500">{delegation.delegate?.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {getScopeBadge(delegation.scope || 'viewer')}
                          {delegation.tenant?.name && (
                            <span className="text-xs text-gray-500">Tenant: {delegation.tenant.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(delegation.status || 'active')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-sm text-gray-900">
                          <span>Bắt đầu: {formatDate(delegation.start_date)}</span>
                          <span className="text-gray-500">Kết thúc: {formatDate(delegation.end_date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 truncate max-w-[150px] block" title={delegation.reason}>
                          {delegation.reason || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(delegation)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Revoke (Thu hồi) */}
                          {isRevocable && (
                            <button
                              onClick={() => handleRevoke(delegation._id)}
                              disabled={processingId === delegation._id}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Thu hồi (Revoke)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Suspend (Tạm ngưng) */}
                          {isSuspendable && (
                            <button
                              onClick={() => handleSuspend(delegation._id)}
                              disabled={processingId === delegation._id}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Tạm ngưng (Suspend)"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Activate (Kích hoạt lại) */}
                          {isActivatable && (
                            <button
                              onClick={() => handleActivate(delegation._id)}
                              disabled={processingId === delegation._id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Kích hoạt lại"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(delegation._id)}
                            disabled={processingId === delegation._id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <DelegationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        delegation={editingDelegation}
        users={users}
        tenants={tenants}
        currentUserId={userId}
        fixedDelegatorId={viewMode === 'delegated' ? userId : undefined}
      />
    </div>
  );
}

export default UserDelegationsTab;
