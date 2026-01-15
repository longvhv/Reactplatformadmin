/**
 * TenantMembersTab Component
 * Tab cho tenant detail page - quản lý members của tenant
 * 
 * ✅ REWRITTEN 2026-01-14: Uses new tenantMembersApi with 19+ fields
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Crown,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Briefcase,
  Mail,
  UserCheck,
  UserX,
  TrendingUp,
} from 'lucide-react';
import {
  tenantMembersApi,
  TenantMember,
  MemberRole,
  MemberStatus,
} from '@/api/tenantMembersApi';
import { MemberModal } from '@/components/tenantMembers/MemberModal';
import { MemberDetailModal } from '@/components/tenantMembers/MemberDetailModal';
import { toast } from 'sonner';

interface TenantMembersTabProps {
  tenantId: string;
}

export function TenantMembersTab({ tenantId }: TenantMembersTabProps) {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<MemberRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all');
  
  const [stats, setStats] = useState({
    total: 0,
    by_role: { OWNER: 0, ADMIN: 0, MEMBER: 0, VIEWER: 0 },
    by_status: { ACTIVE: 0, RESIGNED: 0, ONBOARDING: 0, SUSPENDED: 0 },
    with_manager: 0,
    with_employee_code: 0,
    avg_tenure_days: 0,
    recent_joiners: 0,
    recent_leavers: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);
  const [viewingMember, setViewingMember] = useState<TenantMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, [tenantId]);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, roleFilter, statusFilter, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await tenantMembersApi.getByTenant(tenantId);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Lỗi khi tải danh sách thành viên');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const s = await tenantMembersApi.getStats(tenantId);
      setStats(s);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterMembers = () => {
    let result = [...members];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.user?.full_name?.toLowerCase().includes(query) ||
          m.user?.email?.toLowerCase().includes(query) ||
          m.employee_code?.toLowerCase().includes(query) ||
          m.job_title?.toLowerCase().includes(query) ||
          m.internal_email?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }

    setFilteredMembers(result);
  };

  const handleCreate = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleEdit = (member: TenantMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleView = async (member: TenantMember) => {
    try {
      const full = await tenantMembersApi.getById(member._id);
      setViewingMember(full);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error loading member details:', error);
      toast.error('Lỗi khi tải chi tiết thành viên');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingMember) {
        await tenantMembersApi.update(editingMember._id, data);
        toast.success('Đã cập nhật thành viên');
      } else {
        await tenantMembersApi.create({ ...data, tenant_id: tenantId });
        toast.success('Đã thêm thành viên mới');
      }
      setIsModalOpen(false);
      await fetchMembers();
      await fetchStats();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Lỗi khi lưu thông tin thành viên');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa thành viên này?')) return;
    
    setDeletingId(id);
    try {
      await tenantMembersApi.delete(id);
      toast.success('Đã xóa thành viên');
      await fetchMembers();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Lỗi khi xóa thành viên');
    } finally {
      setDeletingId(null);
    }
  };

  const handleChangeStatus = async (memberId: string, newStatus: MemberStatus) => {
    try {
      await tenantMembersApi.changeStatus(memberId, newStatus);
      toast.success('Đã thay đổi trạng thái');
      await fetchMembers();
      await fetchStats();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: MemberRole) => {
    try {
      await tenantMembersApi.changeRole(memberId, newRole);
      toast.success('Đã thay đổi vai trò');
      await fetchMembers();
      await fetchStats();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Lỗi khi thay đổi vai trò');
    }
  };

  const getRoleBadge = (role: MemberRole) => {
    const config = {
      OWNER: { color: 'bg-purple-100 text-purple-700', icon: Crown, label: 'Owner' },
      ADMIN: { color: 'bg-blue-100 text-blue-700', icon: Shield, label: 'Admin' },
      MEMBER: { color: 'bg-gray-100 text-gray-700', icon: Users, label: 'Member' },
      VIEWER: { color: 'bg-green-100 text-green-700', icon: Eye, label: 'Viewer' },
    };
    const c = config[role];
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const getStatusBadge = (status: MemberStatus) => {
    const config = {
      ACTIVE: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' },
      ONBOARDING: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Onboarding' },
      SUSPENDED: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle, label: 'Suspended' },
      RESIGNED: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Resigned' },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" />
            Tổng Thành Viên
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-green-600" />
              {stats.by_status.ACTIVE} Active
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              {stats.by_status.ONBOARDING} Onboarding
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Crown className="w-4 h-4" />
            Phân Bổ Vai Trò
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Owner/Admin:</span>
              <span className="font-medium">{stats.by_role.OWNER + stats.by_role.ADMIN}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Member/Viewer:</span>
              <span className="font-medium">{stats.by_role.MEMBER + stats.by_role.VIEWER}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Briefcase className="w-4 h-4" />
            Tổ Chức
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Có Manager:</span>
              <span className="font-medium">{stats.with_manager}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Có Mã NV:</span>
              <span className="font-medium">{stats.with_employee_code}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Hoạt Động (30 ngày)
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tham gia:</span>
              <span className="font-medium text-green-600">+{stats.recent_joiners}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rời đi:</span>
              <span className="font-medium text-red-600">-{stats.recent_leavers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, mã NV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as MemberRole | 'all')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'all')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Active</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Thành Viên ({filteredMembers.length})
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Thêm Thành Viên
        </button>
      </div>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Không tìm thấy thành viên nào'
              : 'Chưa có thành viên nào'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thành Viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Chức Vụ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vai Trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng Thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày Tham Gia</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                          {member.user?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {member.user?.full_name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                            {member.employee_code && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                {member.employee_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">{member.job_title || '-'}</p>
                        {member.manager && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Manager: {member.manager.full_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{formatDate(member.joined_at)}</p>
                      {member.left_at && (
                        <p className="text-xs text-red-600 mt-0.5">
                          Left: {formatDate(member.left_at)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(member)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Xem Chi Tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Chỉnh Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member._id)}
                          disabled={deletingId === member._id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Xóa"
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
      <MemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        member={editingMember}
        tenantId={tenantId}
      />

      <MemberDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        member={viewingMember}
      />
    </div>
  );
}

export default TenantMembersTab;
