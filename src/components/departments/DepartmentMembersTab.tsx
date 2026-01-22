/**
 * DepartmentMembersTab Component
 * Display and manage members of a department
 * 
 * ✅ UPDATED 2026-01-21: Strictly adheres to department_members schema
 * ✅ USES: department_members table for roles, is_primary, joined_at
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, X, Mail, Briefcase, Search, UserCog, Edit, Calendar, Check, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Department } from '../../api/departmentsApi';
import { TenantMember } from '../../api/tenantMembersApi';
import { departmentMembersApi, EnrichedDepartmentMember } from '../../api/departmentMembersApi';
import { toast } from 'sonner@2.0.3';

export interface DepartmentMembersTabProps {
  department: Department;
  members: TenantMember[]; // These are the member profiles
  allMembers?: TenantMember[]; // All tenant members for assignment
  onAssignMembers?: (memberIds: string[]) => Promise<void>; // Legacy prop
  onRemoveMember?: (memberId: string) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

interface EnrichedMember extends TenantMember {
  membership?: EnrichedDepartmentMember;
}

export function DepartmentMembersTab({
  department,
  members,
  allMembers = [],
  onAssignMembers,
  onRemoveMember,
  onRefresh,
  loading: parentLoading = false,
}: DepartmentMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [enrichedMembers, setEnrichedMembers] = useState<EnrichedMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<EnrichedMember[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<EnrichedMember | null>(null);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  // Load membership details from department_members table
  useEffect(() => {
    const loadMemberships = async () => {
      if (!department._id) return;
      
      try {
        setLoadingMemberships(true);
        // This returns DepartmentMember[] objects which contain: is_primary, role_in_department, joined_at
        const memberships = await departmentMembersApi.getByDepartment(department._id);
        
        // Merge membership data with tenant member profiles
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
  }, [department._id, members]);

  // Filter members by search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = enrichedMembers.filter(member => {
      const matchesName = member.user?.full_name?.toLowerCase().includes(query) || member.full_name?.toLowerCase().includes(query);
      const matchesEmail = member.user?.email?.toLowerCase().includes(query) || member.internal_email?.toLowerCase().includes(query);
      const matchesRole = member.membership?.role_in_department?.toLowerCase().includes(query);
      return matchesName || matchesEmail || matchesRole;
    });

    // Sort: Manager first, then Primary, then Name
    filtered.sort((a, b) => {
      const isManagerA = department.manager_id === a._id;
      const isManagerB = department.manager_id === b._id;
      if (isManagerA !== isManagerB) return isManagerA ? -1 : 1;
      
      const isPrimaryA = a.membership?.is_primary;
      const isPrimaryB = b.membership?.is_primary;
      if (isPrimaryA !== isPrimaryB) return isPrimaryA ? -1 : 1;
      
      const nameA = a.user?.full_name || a.full_name || '';
      const nameB = b.user?.full_name || b.full_name || '';
      return nameA.localeCompare(nameB);
    });

    setFilteredMembers(filtered);
  }, [searchQuery, enrichedMembers, department.manager_id]);

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên khỏi phòng ban này?')) return;
    
    try {
      if (onRemoveMember) {
        await onRemoveMember(memberId);
      } else {
        await departmentMembersApi.removeMember(department._id, memberId);
        toast.success('Đã xóa thành viên khỏi phòng ban');
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

  const isManager = (memberId: string): boolean => {
    return department.manager_id === memberId;
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
            Thành viên phòng ban
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
          placeholder="Tìm theo tên, email, hoặc vai trò..."
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
                : 'Chưa có thành viên nào trong phòng ban'}
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
          {filteredMembers.map((member) => {
            const displayName = member.user?.full_name || member.full_name || 'N/A';
            const displayEmail = member.user?.email || member.internal_email || '';
            const jobTitle = member.job_title || 'N/A';

            return (
              <Card key={member._id} className="p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  {/* Member Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      {isManager(member._id) && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1 rounded-full border-2 border-white dark:border-gray-800" title="Trưởng phòng">
                          <UserCog className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {displayName}
                        </h4>
                        {isManager(member._id) && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
                            Trưởng phòng
                          </Badge>
                        )}
                        {member.membership?.is_primary && (
                          <Badge variant="outline" className="border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Chính
                          </Badge>
                        )}
                        {member.membership?.role_in_department && (
                          <Badge variant="secondary">
                            {member.membership.role_in_department}
                          </Badge>
                        )}
                      </div>

                      {/* Email */}
                      {displayEmail && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{displayEmail}</span>
                        </div>
                      )}

                      {/* Position & Joined */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{jobTitle}</span>
                        </div>
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
                        disabled={isManager(member._id)}
                        title={isManager(member._id) ? 'Không thể xóa trưởng phòng' : 'Xóa khỏi phòng ban'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Members Dialog */}
      {showAssignDialog && (
        <AssignMembersDialog
          department={department}
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
        <EditMemberDialog
          department={department}
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

interface AssignMembersDialogProps {
  department: Department;
  currentMembers: TenantMember[];
  allMembers: TenantMember[];
  onSuccess: () => void;
  onClose: () => void;
}

function AssignMembersDialog({
  department,
  currentMembers,
  allMembers,
  onSuccess,
  onClose,
}: AssignMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [role, setRole] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [joinedAt, setJoinedAt] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Filter available members (not already in department)
  const currentMemberIds = new Set(currentMembers.map(m => m._id));
  const availableMembers = allMembers.filter(
    m => !currentMemberIds.has(m._id) && m.status === 'ACTIVE'
  );

  // Filter by search query
  const filteredMembers = availableMembers.filter(member => {
    const query = searchQuery.toLowerCase();
    const displayName = member.user?.full_name || member.full_name || '';
    const email = member.user?.email || member.internal_email || '';
    
    const matchesName = displayName.toLowerCase().includes(query);
    const matchesEmail = email.toLowerCase().includes(query);
    return matchesName || matchesEmail;
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
        department_id: department._id,
        tenant_member_ids: Array.from(selectedMemberIds),
        is_primary: isPrimary,
        role_in_department: role || undefined,
        joined_at: new Date(joinedAt).toISOString(),
      };

      await departmentMembersApi.batchAssign(request);
      
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
          <DialogTitle>Thêm thành viên vào {department.name}</DialogTitle>
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
                    const displayName = member.user?.full_name || member.full_name || 'N/A';
                    const email = member.user?.email || member.internal_email || '';

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
                          {displayName.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {email}
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
                  <Label>Vai trò trong phòng ban</Label>
                  <Input 
                    placeholder="VD: Developer, Lead..." 
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
                    <Label className="text-base">Phòng ban chính</Label>
                    <p className="text-xs text-gray-500">
                      Đặt làm phòng ban chính cho các thành viên này
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

interface EditMemberDialogProps {
  department: Department;
  member: TenantMember;
  membership: EnrichedDepartmentMember;
  onSuccess: () => void;
  onClose: () => void;
}

function EditMemberDialog({
  department,
  member,
  membership,
  onSuccess,
  onClose,
}: EditMemberDialogProps) {
  const [role, setRole] = useState(membership.role_in_department || '');
  const [isPrimary, setIsPrimary] = useState(membership.is_primary);
  const [joinedAt, setJoinedAt] = useState(
    membership.joined_at 
      ? new Date(membership.joined_at).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setSubmitting(true);
      
      // If setting as primary, we should use setPrimaryDepartment helper or custom logic.
      // But simple update also works if the API handles unset (which it doesn't automatically for simple update).
      // If isPrimary changed to true, we might want to call setPrimaryDepartment.
      if (isPrimary && !membership.is_primary) {
          await departmentMembersApi.setPrimaryDepartment(member._id, department._id);
          // If we also changed role/joined_at, we need another update, or setPrimaryDepartment accepts these?
          // Currently setPrimaryDepartment only sets primary.
          // Let's do a follow-up update for other fields.
      }

      await departmentMembersApi.update(membership._id, {
        role_in_department: role || undefined,
        is_primary: isPrimary,
        joined_at: new Date(joinedAt).toISOString(),
        version: membership.version, // Use version for optimistic locking
      });

      toast.success('Đã cập nhật thông tin thành viên');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error(error.message || 'Lỗi khi cập nhật thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = member.user?.full_name || member.full_name || 'N/A';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thành viên</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin của {displayName} trong {department.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Vai trò trong phòng ban</Label>
            <Input 
              placeholder="VD: Developer, Lead..." 
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

          <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="space-y-0.5">
              <Label className="text-base">Phòng ban chính</Label>
              <p className="text-xs text-gray-500">
                Đây là phòng ban chính của thành viên này
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

export default DepartmentMembersTab;