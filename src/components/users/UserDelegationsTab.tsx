/**
 * UserDelegationsTab Component  
 * Tab cho user detail page - hiển thị delegations của user
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Clock, XCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useUserDelegations } from '../../hooks/useUserDelegations';
import { DelegationModal } from '../delegations/DelegationModal';
import { UserDelegation } from '../../api/userDelegationsApi';
import { supabase } from '../../utils/supabase/client';

interface UserDelegationsTabProps {
  userId: string;
}

export function UserDelegationsTab({ userId }: UserDelegationsTabProps) {
  const { delegations, loading, createDelegation, updateDelegation, deleteDelegation } = useUserDelegations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelegation, setEditingDelegation] = useState<UserDelegation | null>(null);
  const [users, setUsers] = useState<Array<{ _id: string; email: string; full_name?: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ _id: string; name: string }>>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    if (editingDelegation) {
      await updateDelegation(editingDelegation._id, data);
    } else {
      await createDelegation(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa ủy quyền này?')) return;
    setDeletingId(id);
    try {
      await deleteDelegation(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { icon: CheckCircle, class: 'bg-green-100 text-green-700', label: 'Active' },
      pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      expired: { icon: AlertCircle, class: 'bg-orange-100 text-orange-700', label: 'Expired' },
      revoked: { icon: XCircle, class: 'bg-red-100 text-red-700', label: 'Revoked' },
      suspended: { icon: XCircle, class: 'bg-gray-100 text-gray-700', label: 'Suspended' },
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
      <div className="grid grid-cols-3 gap-4">
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
                Đã ủy quyền
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
                Được ủy quyền
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
            <p className="text-sm text-gray-600">Ủy quyền mà user này đã tạo cho người khác</p>
          )}
          {viewMode === 'received' && (
            <p className="text-sm text-gray-600">Ủy quyền mà user này nhận được từ người khác</p>
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {displayDelegations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Không có ủy quyền nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delegator</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delegate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayDelegations.map((delegation) => (
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
                      <span className="text-sm text-gray-900">{delegation.tenant?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3">{getScopeBadge(delegation.scope)}</td>
                    <td className="px-4 py-3">{getStatusBadge(delegation.status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{formatDate(delegation.start_date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{formatDate(delegation.end_date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{delegation.reason || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(delegation)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(delegation._id)}
                          disabled={deletingId === delegation._id}
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
      />
    </div>
  );
}

export default UserDelegationsTab;
