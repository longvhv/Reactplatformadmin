/**
 * TenantMembers Component
 * Quản lý thành viên của tenant
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical,
  Mail,
  Calendar,
  Shield,
  Trash2
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { useTenantMembers } from '../../../hooks/useTenantMembers';

interface TenantMembersProps {
  tenantId: string;
}

export function TenantMembers({ tenantId }: TenantMembersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { 
    members, 
    loading, 
    error, 
    inviteMember, 
    removeMember,
    updateMemberStatus 
  } = useTenantMembers(tenantId);

  const filteredMembers = members.filter(member => {
    if (statusFilter !== 'all' && member.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        member.user.email.toLowerCase().includes(query) ||
        member.user.full_name.toLowerCase().includes(query) ||
        member.display_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      INVITED: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      RESIGNED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.ACTIVE;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này?')) return;
    try {
      await removeMember(memberId);
    } catch (err) {
      alert('Xóa thành viên thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Thành viên</h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý người dùng trong tổ chức
            </p>
          </div>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Mời thành viên
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tham gia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Không tìm thấy thành viên'
                        : 'Chưa có thành viên nào'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {member.user.avatar_url ? (
                          <img
                            src={member.user.avatar_url}
                            alt={member.user.full_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {member.user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.display_name || member.user.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {member._id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {member.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(member.joined_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemove(member._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Tổng thành viên</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {members.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {members.filter(m => m.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Invited</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {members.filter(m => m.status === 'INVITED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {members.filter(m => m.status === 'SUSPENDED').length}
          </p>
        </div>
      </div>
    </div>
  );
}
