/**
 * TenantUserGroupsTab Component
 * Quản lý user groups trong tenant
 * 
 * ✅ REWRITTEN 2026-01-14: Uses userGroupsApi with 16 fields
 * ✅ UPDATED 2026-01-20: Added Detail View with Members management
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCog,
  Shield,
  Building2,
  FolderTree,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Filter,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { userGroupsApi, UserGroupWithMembers, getStatusColor } from '../../api/userGroupsApi';
import { tenantMembersApi, TenantMember } from '@/api/tenantMembersApi';
import { UserGroupForm } from '../user-groups/UserGroupForm';
import { UserGroupDetailView } from '../user-groups/UserGroupDetailView';
import { toast } from 'sonner@2.0.3';

interface TenantUserGroupsTabProps {
  tenantId: string;
}

export function TenantUserGroupsTab({ tenantId }: TenantUserGroupsTabProps) {
  const [groups, setGroups] = useState<UserGroupWithMembers[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<UserGroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroupWithMembers | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserGroupWithMembers | null>(null);
  
  // For Detail View
  const [groupMembers, setGroupMembers] = useState<TenantMember[]>([]);
  const [allMembers, setAllMembers] = useState<TenantMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    loadGroups();
    loadAllMembers();
  }, [tenantId]);

  useEffect(() => {
    filterGroups();
  }, [searchQuery, typeFilter, statusFilter, groups]);

  // Load members when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup._id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await userGroupsApi.getWithMemberCounts(tenantId);
      setGroups(data);
      
      // Extract unique types
      const types = await userGroupsApi.getTypes(tenantId);
      setAvailableTypes(types);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Không thể tải danh sách nhóm');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMembers = async () => {
    try {
      const members = await tenantMembersApi.getByTenant(tenantId);
      setAllMembers(members);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      setLoadingMembers(true);
      // In a real app, this would be a direct API call to get members of a group
      // Here we simulate it or use a helper if available
      // Ideally: const members = await userGroupsApi.getMembers(groupId);
      // But since we are migrating, we might need to fetch IDs and then filter
      
      // Temporary solution: We assume backend gives us the list or we fetch membership records
      // and map them to tenant members.
      // Since we don't have a direct "getMembers" returning TenantMember[] in userGroupsApi yet (it throws error),
      // we should use groupMembersApi which we just updated/verified.
      
      // Dynamic import to avoid circular dependency issues if any, or just use it if available
      const { groupMembersApi } = await import('../../api/groupMembersApi');
      const memberships = await groupMembersApi.getByGroup(groupId, true); // Active only
      
      const memberIds = new Set(memberships.map(m => m.tenant_member_id));
      const members = allMembers.filter(m => memberIds.has(m._id));
      
      setGroupMembers(members);
    } catch (error) {
      console.error('Error loading group members:', error);
      toast.error('Không thể tải thành viên nhóm');
    } finally {
      setLoadingMembers(false);
    }
  };

  const filterGroups = () => {
    let result = [...groups];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name?.toLowerCase().includes(query) ||
          g.code?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((g) => g.group_type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((g) => g.status === statusFilter);
    }

    setFilteredGroups(result);
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setShowDialog(true);
  };

  const handleEdit = (group: UserGroupWithMembers) => {
    setEditingGroup(group);
    setShowDialog(true);
  };

  const handleViewDetails = (group: UserGroupWithMembers) => {
    setSelectedGroup(group);
  };

  const handleDelete = async (id: string) => {
    // Check if can delete
    try {
      const check = await userGroupsApi.canDelete(id);
      if (!check.can_delete) {
        toast.error(`Không thể xóa: ${check.reason}`);
        return;
      }
    } catch (error) {
      console.error('Error checking delete:', error);
    }

    if (!confirm('Bạn có chắc muốn xóa nhóm này?')) return;

    try {
      await userGroupsApi.delete(id);
      toast.success('Đã xóa nhóm');
      await loadGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(`Không thể xóa: ${error.message}`);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await userGroupsApi.archive(id);
      toast.success('Đã lưu trữ nhóm');
      await loadGroups();
    } catch (error: any) {
      console.error('Error archiving group:', error);
      toast.error(`Không thể lưu trữ: ${error.message}`);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await userGroupsApi.activate(id);
      toast.success('Đã kích hoạt nhóm');
      await loadGroups();
    } catch (error: any) {
      console.error('Error activating group:', error);
      toast.error(`Không thể kích hoạt: ${error.message}`);
    }
  };

  const getTypeColor = (type?: string) => {
    // Common types with predefined colors
    const colors: Record<string, string> = {
      ORG_UNIT: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      PROJECT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      PERMISSION: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      CUSTOM: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
      DEPARTMENT: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      TEAM: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
    };
    
    if (!type) return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    
    return colors[type] || 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
  };

  const getTypeIcon = (type?: string) => {
    const icons: Record<string, any> = {
      ORG_UNIT: Building2,
      PROJECT: FolderTree,
      PERMISSION: Shield,
      CUSTOM: Users,
      DEPARTMENT: Building2,
      TEAM: Users,
    };
    
    if (!type) return Users;
    
    return icons[type] || Users;
  };

  const countByStatus = (status: string) => {
    return groups.filter(g => g.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nhóm người dùng</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quản lý nhóm và phân quyền người dùng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadGroups} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo nhóm
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {countByStatus('ACTIVE')}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {countByStatus('INACTIVE')}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Archive className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Archived</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {countByStatus('ARCHIVED')}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Types</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {availableTypes.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm nhóm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả loại</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </Card>

      {/* Groups Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên nhóm</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Thành viên</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Không tìm thấy nhóm nào phù hợp'
                    : 'Chưa có nhóm nào'}
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => {
                const TypeIcon = getTypeIcon(group.group_type);
                return (
                  <TableRow 
                    key={group._id} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleViewDetails(group)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(group.group_type).split(' ')[0]}`}>
                          <TypeIcon className={`w-4 h-4 ${getTypeColor(group.group_type).split(' ')[1]}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{group.name}</p>
                          {group.is_system && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">System</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.code && (
                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{group.code}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(group.group_type)}>
                        {group.group_type || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {group.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <UserCog className="w-4 h-4" />
                        {group.member_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(group.status)}>
                        {group.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(group)}
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(group)}
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {group.status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(group._id)}
                            title="Lưu trữ"
                          >
                            <Archive className="w-4 h-4 text-orange-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(group._id)}
                            title="Kích hoạt"
                          >
                            <ArchiveRestore className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {!group.is_system && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(group._id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <UserGroupForm
          open={showDialog}
          group={editingGroup}
          tenantId={tenantId}
          availableTypes={availableTypes}
          onClose={() => {
            setShowDialog(false);
            setEditingGroup(null);
          }}
          onSuccess={() => {
            setShowDialog(false);
            setEditingGroup(null);
            loadGroups();
          }}
        />
      )}

      {/* Detail View */}
      {selectedGroup && (
        <UserGroupDetailView
          group={selectedGroup}
          members={groupMembers}
          allMembers={allMembers}
          loading={loadingMembers}
          onClose={() => setSelectedGroup(null)}
          onEdit={() => handleEdit(selectedGroup)}
          onArchive={() => handleArchive(selectedGroup._id)}
          onActivate={() => handleActivate(selectedGroup._id)}
          onRefresh={() => loadGroupMembers(selectedGroup._id)}
        />
      )}
    </div>
  );
}

export default TenantUserGroupsTab;
