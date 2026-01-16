/**
 * DepartmentMembersTab Component
 * Display and manage members of a department
 * 
 * ✅ CREATED 2026-01-15: Department members management
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, X, Mail, Briefcase, Search, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Department } from '@/api/departmentsApi';
import { TenantMember } from '@/api/tenantMembersApi';
import { AuditTrailCompact } from '@/components/common/AuditTrail';

export interface DepartmentMembersTabProps {
  department: Department;
  members: TenantMember[];
  allMembers?: TenantMember[]; // All tenant members for assignment
  onAssignMembers?: (memberIds: string[]) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

export function DepartmentMembersTab({
  department,
  members,
  allMembers = [],
  onAssignMembers,
  onRemoveMember,
  onRefresh,
  loading = false,
}: DepartmentMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TenantMember[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Filter members by search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => {
      const matchesName = member.full_name?.toLowerCase().includes(query);
      const matchesEmail = member.email?.toLowerCase().includes(query);
      const matchesPosition = member.position?.toLowerCase().includes(query);
      return matchesName || matchesEmail || matchesPosition;
    });

    // Sort by name
    filtered.sort((a, b) => {
      const nameA = a.full_name || a.email || '';
      const nameB = b.full_name || b.email || '';
      return nameA.localeCompare(nameB);
    });

    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên khỏi phòng ban này?')) return;
    
    try {
      if (onRemoveMember) {
        await onRemoveMember(memberId);
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const isManager = (memberId: string): boolean => {
    return department.manager_id === memberId;
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
          {onAssignMembers && (
            <Button size="sm" onClick={() => setShowAssignDialog(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Thêm thành viên
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Tìm theo tên, email, hoặc chức vụ..."
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
            {!searchQuery && onAssignMembers && (
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
            <Card key={member._id} className="p-4">
              <div className="flex items-start justify-between">
                {/* Member Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {(member.full_name || member.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {member.full_name || 'N/A'}
                      </h4>
                      {isManager(member._id) && (
                        <Badge className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                          <UserCog className="w-3 h-3 mr-1" />
                          Trưởng phòng
                        </Badge>
                      )}
                      {member.is_active ? (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
                          Không hoạt động
                        </Badge>
                      )}
                    </div>

                    {/* Email */}
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                    )}

                    {/* Position */}
                    {member.position && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span>{member.position}</span>
                      </div>
                    )}

                    {/* Audit Trail */}
                    <AuditTrailCompact data={member} className="mt-2" />
                  </div>
                </div>

                {/* Actions */}
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
            </Card>
          ))}
        </div>
      )}

      {/* Assign Members Dialog */}
      {showAssignDialog && onAssignMembers && (
        <AssignMembersDialog
          department={department}
          currentMembers={members}
          allMembers={allMembers}
          onAssign={onAssignMembers}
          onClose={() => setShowAssignDialog(false)}
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
  onAssign: (memberIds: string[]) => Promise<void>;
  onClose: () => void;
}

function AssignMembersDialog({
  department,
  currentMembers,
  allMembers,
  onAssign,
  onClose,
}: AssignMembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Filter available members (not already in department)
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
      await onAssign(Array.from(selectedMemberIds));
      onClose();
    } catch (error) {
      console.error('Error assigning members:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Thêm thành viên
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {department.name}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm theo tên, email, hoặc chức vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Members List */}
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
                  <button
                    key={member._id}
                    onClick={() => toggleMember(member._id)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {(member.full_name || member.email || '?')[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {member.full_name || 'N/A'}
                        </p>
                        {member.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        )}
                        {member.position && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {member.position}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedMemberIds.size > 0 && (
              <span className="text-indigo-600 dark:text-indigo-400">
                {selectedMemberIds.size} thành viên được chọn
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedMemberIds.size === 0 || submitting}
            >
              {submitting ? 'Đang xử lý...' : `Thêm (${selectedMemberIds.size})`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DepartmentMembersTab;
