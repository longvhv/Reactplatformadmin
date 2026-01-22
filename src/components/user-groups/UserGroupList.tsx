/**
 * UserGroupList Component
 * Display list of user groups with filtering and management actions
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Archive,
  ArchiveRestore,
  Eye,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userGroupsApi, UserGroup, UserGroupStats } from '../../api/userGroupsApi';
import { UserGroupForm } from './UserGroupForm';
import { UserGroupDetailView } from './UserGroupDetailView';
import { toast } from 'sonner@2.0.3';

interface UserGroupListProps {
  tenantId: string;
}

export function UserGroupList({ tenantId }: UserGroupListProps) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserGroupStats | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  
  // Dialogs
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, statsData, typesData] = await Promise.all([
        userGroupsApi.getAll({ tenant_id: tenantId }),
        userGroupsApi.getStats(tenantId),
        userGroupsApi.getTypes(tenantId),
      ]);
      
      setGroups(groupsData);
      setStats(statsData);
      setAvailableTypes(typesData);
    } catch (error) {
      console.error('Error loading user groups:', error);
      toast.error('Không thể tải danh sách nhóm người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nhóm này?')) return;

    try {
      await userGroupsApi.delete(id);
      toast.success('Đã xóa nhóm người dùng');
      loadData();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(`Không thể xóa: ${error.message}`);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await userGroupsApi.archive(id);
      toast.success('Đã lưu trữ nhóm');
      loadData();
    } catch (error: any) {
      console.error('Error archiving group:', error);
      toast.error(`Không thể lưu trữ: ${error.message}`);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await userGroupsApi.activate(id);
      toast.success('Đã kích hoạt nhóm');
      loadData();
    } catch (error: any) {
      console.error('Error activating group:', error);
      toast.error(`Không thể kích hoạt: ${error.message}`);
    }
  };

  // Filter logic
  const filteredGroups = groups.filter(group => {
    const matchesSearch = 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || group.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || group.group_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort by order then name
  filteredGroups.sort((a, b) => {
    if ((a.order || 0) !== (b.order || 0)) {
      return (a.order || 0) - (b.order || 0);
    }
    return a.name.localeCompare(b.name);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'INACTIVE': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      case 'ARCHIVED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
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
            Quản lý các nhóm người dùng và phân quyền
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => {
            setEditingGroup(null);
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhóm
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số nhóm</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.by_status.ACTIVE}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
             <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Đã lưu trữ</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.by_status.ARCHIVED}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loại phổ biến</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {stats.most_common_type ? stats.most_common_type.type : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, mã hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Loại nhóm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            {availableTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Không tìm thấy nhóm người dùng nào</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <Card key={group._id} className="p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${getStatusColor(group.status).split(' ')[0]}`}>
                    <Users className={`w-5 h-5 ${getStatusColor(group.status).split(' ')[1]}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1" title={group.name}>
                      {group.name}
                    </h3>
                    <p className="text-xs font-mono text-gray-500">{group.code}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(group.status)}>
                  {group.status}
                </Badge>
              </div>

              {group.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                  {group.description}
                </p>
              )}

              <div className="flex items-center gap-2 mb-4">
                {group.group_type && (
                   <Badge variant="outline" className="text-xs font-normal">
                     {group.group_type}
                   </Badge>
                )}
                {group.order !== undefined && group.order !== 0 && (
                   <span className="text-xs text-gray-400">Order: {group.order}</span>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGroup(group)}
                  title="Xem chi tiết"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingGroup(group);
                    setShowForm(true);
                  }}
                  title="Chỉnh sửa"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                {group.status === 'ACTIVE' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(group._id)}
                    className="text-orange-600 hover:text-orange-700"
                    title="Lưu trữ"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleActivate(group._id)}
                    className="text-green-600 hover:text-green-700"
                    title="Kích hoạt"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(group._id)}
                  className="text-red-600 hover:text-red-700"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      {showForm && (
        <UserGroupForm
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingGroup(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingGroup(null);
            loadData();
          }}
          tenantId={tenantId}
          group={editingGroup}
          availableTypes={availableTypes}
        />
      )}

      {/* Detail View */}
      {selectedGroup && (
        <UserGroupDetailView
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onEdit={() => {
            setEditingGroup(selectedGroup);
            setShowForm(true);
            setSelectedGroup(null); // Optional: close detail view when editing? Or keep open and refresh?
            // Better to close detail view and reopen after edit, or just edit.
            // Let's just open form.
          }}
        />
      )}
    </div>
  );
}
