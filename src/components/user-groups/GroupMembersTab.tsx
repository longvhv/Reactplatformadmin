/**
 * GroupMembersTab Component
 * Display and manage members of a user group
 * 
 * ✅ CREATED 2026-01-20: Group members management
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, X, Mail, Briefcase, Search, UserCog, Edit, Calendar, Check, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserGroup } from '@/api/userGroupsApi';
import { TenantMember } from '@/api/tenantMembersApi';
import { groupMembersApi, GroupMember } from '@/api/groupMembersApi';
import { toast } from 'sonner@2.0.3';

export interface GroupMembersTabProps {
  group: UserGroup;
  members: TenantMember[]; // These are the member profiles
  allMembers?: TenantMember[]; // All tenant members for assignment
  onRemoveMember?: (memberId: string) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

interface EnrichedMember extends TenantMember {
  membership?: GroupMember;
}

export function GroupMembersTab({
  group,
  members,
  allMembers = [],
  onRemoveMember,
  onRefresh,
  loading: parentLoading = false,
}: GroupMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [enrichedMembers, setEnrichedMembers] = useState<EnrichedMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<EnrichedMember[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<EnrichedMember | null>(null);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  // Load membership details to get role, is_primary, etc.
  useEffect(() => {
    const loadMemberships = async () => {
      if (!group._id) return;
      
      try {
        setLoadingMemberships(true);
        const memberships = await groupMembersApi.getByGroup(group._id);
        
        // Merge membership data with member profiles
        const enriched = members.map(member => {
          const membership = memberships.find(m => m.tenant_member_id === member._id);
          return {
            ...member,
            membership
          };
        });
        
        setEnrichedMembers(enriched);
      } catch (error) {
        console.error('Error loading memberships:', error);
      } finally {
        setLoadingMemberships(false);
      }
    };

    loadMemberships();
  }, [group._id, members]);

  // Filter members by search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = enrichedMembers.filter(member => {
      const matchesName = member.full_name?.toLowerCase().includes(query);
      const matchesEmail = member.email?.toLowerCase().includes(query);
      const matchesPosition = member.position?.toLowerCase().includes(query);
      const matchesRole = member.membership?.role_in_group?.toLowerCase().includes(query);
      return matchesName || matchesEmail || matchesPosition || matchesRole;
    });

    // Sort: Primary first, then Name
    filtered.sort((a, b) => {
      const isPrimaryA = a.membership?.is_primary;
      const isPrimaryB = b.membership?.is_primary;
      if (isPrimaryA !== isPrimaryB) return isPrimaryA ? -1 : 1;
      
      const nameA = a.full_name || a.email || '';
      const nameB = b.full_name || b.email || '';
      return nameA.localeCompare(nameB);
    });

    setFilteredMembers(filtered);
  }, [searchQuery, enrichedMembers]);

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên khỏi nhóm này?')) return;
    
    try {
      if (onRemoveMember) {
        await onRemoveMember(memberId);
      } else {
        // Fallback internal implementation
        await groupMembersApi.removeMember(group._id, memberId);
        toast.success('Đã xóa thành viên khỏi nhóm');
        if (onRefresh) onRefresh();
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Không thể xóa thành viên');
    }
  };

  const handleEditClick = (member: EnrichedMember) => {
    setEditingMember(member);
    setShowEditDialog(true);
  };

  if (parentLoading || loadingMemberships) {
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Thành viên nhóm
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {members.length} thành viên
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Làm mới
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAssignDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm thành viên
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Tìm theo tên, email, chức vụ hoặc vai trò..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Không tìm thấy thành viên nào'
                : 'Chưa có thành viên nào trong nhóm'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowAssignDialog(true)}
                className="mt-4"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm thành viên đầu tiên
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <Card key={member._id} className="p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                {/* Member Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {(member.full_name || member.email || '?')[0].toUpperCase()}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {member.full_name || 'N/A'}
                      </h4>
                      {member.membership?.is_primary && (
                        <Badge variant="outline" className="border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Nhóm chính
                        </Badge>
                      )}
                      {member.membership?.role_in_group && (
                        <Badge variant="secondary">
                          <Shield className="w-3 h-3 mr-1" />
                          {member.membership.role_in_group}
                        </Badge>
                      )}
                    </div>

                    {/* Email */}
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{member.email}</span>
                      </div>
                    )}

                    {/* Position & Joined */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {member.position && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{member.position}</span>
                        </div>
                      )}
                      {member.membership?.joined_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Tham gia: {new Date(member.membership.joined_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(member)}
                    className="text-gray-600 hover:text-indigo-600"
                    title="Chỉnh sửa vai trò"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {onRemoveMember && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Xóa khỏi nhóm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Members Dialog */}
      {showAssignDialog && (
        <AssignGroupMembersDialog
          group={group}
          currentMembers={members}
          allMembers={allMembers}
          onSuccess={() => {
            setShowAssignDialog(false);
            if (onRefresh) onRefresh();
          }}
          onClose={() => setShowAssignDialog(false)}
        />
      )}

      {/* Edit Member Dialog */}
      {showEditDialog && editingMember && editingMember.membership && (
        <EditGroupMemberDialog
          group={group}
          member={editingMember}
          membership={editingMember.membership}
          onSuccess={() => {
            setShowEditDialog(false);
            setEditingMember(null);
            if (onRefresh) onRefresh();
          }}
          onClose={() => {
            setShowEditDialog(false);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
}

// ==================== ASSIGN MEMBERS DIALOG ====================

interface AssignGroupMembersDialogProps {
  group: UserGroup;
  currentMembers: TenantMember[];
  allMembers: TenantMember[];
  onSuccess: () => void;
  onClose: () => void;
}

function AssignGroupMembersDialog({
  group,
  currentMembers,
  allMembers,
  onSuccess,
  onClose,
}: AssignGroupMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [role, setRole] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [joinedAt, setJoinedAt] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Filter available members (not already in group)
  const currentMemberIds = new Set(currentMembers.map(m => m._id));
  const availableMembers = allMembers.filter(
    m => !currentMemberIds.has(m._id) && m.is_active
  );

  // Filter by search query
  const filteredMembers = availableMembers.filter(member => {
    const query = searchQuery.toLowerCase();
    const matchesName = member.full_name?.toLowerCase().includes(query);
    const matchesEmail = member.email?.toLowerCase().includes(query);
    const matchesPosition = member.position?.toLowerCase().includes(query);
    return matchesName || matchesEmail || matchesPosition;
  });

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMemberIds);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMemberIds(newSelected);
  };

  const handleAssign = async () => {
    if (selectedMemberIds.size === 0) return;

    try {
      setSubmitting(true);
      
      const request = {
        tenant_member_ids: Array.from(selectedMemberIds),
        is_primary: isPrimary,
        role_in_group: role || undefined,
        metadata: {
          tenant_id: group.tenant_id // Required by helper
        }
      };

      await groupMembersApi.batchAssign(group._id, request);
      
      toast.success(`Đã thêm ${selectedMemberIds.size} thành viên`);
      onSuccess();
    } catch (error: any) {
      console.error('Error assigning members:', error);
      toast.error(error.message || 'Lỗi khi thêm thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle>Thêm thành viên vào {group.name}</DialogTitle>
          <DialogDescription>
            Chọn thành viên và thiết lập vai trò
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Member Selection */}
          <div className="w-2/3 flex flex-col border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm thành viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? 'Không tìm thấy thành viên nào'
                      : 'Không có thành viên khả dụng'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => {
                    const isSelected = selectedMemberIds.has(member._id);

                    return (
                      <div
                        key={member._id}
                        onClick={() => toggleMember(member._id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                          ${isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div className={`
                          w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                          ${isSelected
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-400'
                          }
                        `}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                          {(member.full_name || member.email || '?')[0].toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {member.full_name || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Settings */}
          <div className="w-1/3 p-6 space-y-6 bg-gray-50 dark:bg-gray-800/50">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Thiết lập chung</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vai trò trong nhóm</Label>
                  <Input 
                    placeholder="VD: Leader, Member..." 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ngày tham gia</Label>
                  <Input 
                    type="date" 
                    value={joinedAt}
                    onChange={(e) => setJoinedAt(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Nhóm chính</Label>
                    <p className="text-xs text-gray-500">
                      Đặt làm nhóm chính cho thành viên
                    </p>
                  </div>
                  <Switch 
                    checked={isPrimary}
                    onCheckedChange={setIsPrimary}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Đã chọn: <span className="font-semibold text-gray-900 dark:text-white">{selectedMemberIds.size}</span> thành viên
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={selectedMemberIds.size === 0 || submitting}
          >
            {submitting ? 'Đang xử lý...' : 'Thêm thành viên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== EDIT MEMBER DIALOG ====================

interface EditGroupMemberDialogProps {
  group: UserGroup;
  member: TenantMember;
  membership: GroupMember;
  onSuccess: () => void;
  onClose: () => void;
}

function EditGroupMemberDialog({
  group,
  member,
  membership,
  onSuccess,
  onClose,
}: EditGroupMemberDialogProps) {
  const [role, setRole] = useState(membership.role_in_group || '');
  const [isPrimary, setIsPrimary] = useState(membership.is_primary);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      // Update role
      await groupMembersApi.update(membership._id, {
        role_in_group: role || undefined,
        is_primary: isPrimary,
      });

      // Special handling: if isPrimary changed to true, we might need to use setPrimaryGroup
      // but the API update should handle it or we assume user understands the implication.
      // However, groupMembersApi.setPrimaryGroup is a dedicated method that handles unsetting others.
      // Let's use that if isPrimary is true and it wasn't before.
      
      if (isPrimary && !membership.is_primary) {
         await groupMembersApi.setPrimaryGroup(member._id, group._id);
      }

      toast.success('Đã cập nhật thông tin thành viên');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error(error.message || 'Lỗi khi cập nhật thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thành viên</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin của {member.full_name} trong {group.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Vai trò trong nhóm</Label>
            <Input 
              placeholder="VD: Leader, Member..." 
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-0.5">
              <Label className="text-base">Nhóm chính</Label>
              <p className="text-xs text-gray-500">
                Đây là nhóm chính của thành viên này
              </p>
            </div>
            <Switch 
              checked={isPrimary}
              onCheckedChange={setIsPrimary}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
