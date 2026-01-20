/**
 * User Delegations Page
 * Trang quản lý ủy quyền giữa các users
 * ✅ CREATED: 2026-01-20
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { UserCog, Plus, Search, CheckCircle, Clock, XCircle, AlertCircle, ArrowRight, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { useUserDelegations } from '@/hooks/useUserDelegations';
import { UserDelegation, DelegationStatusHelper, DelegationScopeHelper } from '@/api/userDelegationsApi';
import { showToast } from '@/lib/toast';

function UserDelegationsPage() {
  const router = useRouter();
  const { delegations, loading, deleteDelegation } = useUserDelegations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expired' | 'revoked'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | string>('all');

  // Filter delegations
  const filteredDelegations = delegations.filter(delegation => {
    const matchesSearch = 
      delegation.delegator_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delegation.delegate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delegation.delegator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delegation.delegate_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || delegation.status === statusFilter;
    const matchesScope = scopeFilter === 'all' || delegation.scope === scopeFilter;
    
    return matchesSearch && matchesStatus && matchesScope;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa ủy quyền này?')) return;
    try {
      await deleteDelegation(id);
      showToast.success('Thành công', 'Đã xóa ủy quyền');
    } catch (error: any) {
      showToast.error('Lỗi', error.message || 'Không thể xóa ủy quyền');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { icon: CheckCircle, class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Active' },
      pending: { icon: Clock, class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', label: 'Pending' },
      expired: { icon: AlertCircle, class: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', label: 'Expired' },
      revoked: { icon: XCircle, class: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Revoked' },
      suspended: { icon: XCircle, class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', label: 'Suspended' },
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
    const colorMap: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      editor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      approver: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      reviewer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
      auditor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      custom: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorMap[scope] || colorMap.custom}`}>
        <Shield className="w-3 h-3" />
        {scope}
      </span>
    );
  };

  // Statistics
  const stats = {
    total: delegations.length,
    active: delegations.filter(d => DelegationStatusHelper.isActive(d.status)).length,
    pending: delegations.filter(d => DelegationStatusHelper.isPending(d.status)).length,
    expired: delegations.filter(d => DelegationStatusHelper.isExpired(d.status)).length,
  };

  return (
    <Fragment>
      <PageLayout
        icon={UserCog}
        title="Ủy quyền người dùng"
        description="Quản lý ủy quyền quyền hạn giữa các người dùng"
        actions={
          <Button onClick={() => router.push('/admin/user-delegations/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo ủy quyền
          </Button>
        }
      >
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <UserCog className="w-8 h-8 text-gray-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chờ xử lý</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hết hạn</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expired}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Phạm vi
                </label>
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
          </div>

          {/* Delegations List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Đang tải...</p>
            </div>
          ) : filteredDelegations.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                {statusFilter !== 'all' || scopeFilter !== 'all'
                  ? 'Không tìm thấy ủy quyền nào phù hợp'
                  : 'Chưa có ủy quyền nào'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDelegations.map((delegation) => (
                <div
                  key={delegation._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Delegator -> Delegate */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {delegation.delegator_name || delegation.delegator_email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {delegation.delegator_email}
                          </p>
                        </div>
                        
                        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {delegation.delegate_name || delegation.delegate_email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {delegation.delegate_email}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {getStatusBadge(delegation.status)}
                        {getScopeBadge(delegation.scope)}
                        
                        <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(delegation.start_date)} - {formatDate(delegation.end_date)}
                        </span>
                        
                        {delegation.tenant_name && (
                          <span className="text-gray-600 dark:text-gray-400">
                            Tenant: {delegation.tenant_name}
                          </span>
                        )}
                      </div>

                      {delegation.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Lý do: {delegation.reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(delegation._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageLayout>
    </Fragment>
  );
}

export { UserDelegationsPage };
export default UserDelegationsPage;
