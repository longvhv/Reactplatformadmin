/**
 * Manager Assignment Dialog
 * Select manager from tenant_members for a department
 * 
 * ✅ CREATED 2026-01-15: Department manager assignment
 */

import { useState, useEffect } from 'react';
import { UserCog, Search, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Department } from '@/api/departmentsApi';

/**
 * Tenant Member Interface (minimal)
 * TODO: Import from tenantMembersApi when available
 */
export interface TenantMember {
  _id: string;
  user_id: string;
  tenant_id: string;
  email?: string;
  full_name?: string;
  position?: string;
  department_id?: string;
  is_active: boolean;
}

export interface ManagerAssignmentDialogProps {
  department: Department;
  currentManager?: TenantMember | null;
  members: TenantMember[];
  onAssign: (managerId: string) => Promise<void>;
  onRemove: () => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export function ManagerAssignmentDialog({
  department,
  currentManager,
  members,
  onAssign,
  onRemove,
  onClose,
  loading = false,
}: ManagerAssignmentDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TenantMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TenantMember | null>(currentManager || null);

  // Filter members based on search query
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => {
      // Only show active members
      if (!member.is_active) return false;

      // Search by name, email, or position
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

  const handleAssign = async () => {
    if (!selectedMember) return;
    
    try {
      await onAssign(selectedMember._id);
      onClose();
    } catch (error) {
      console.error('Error assigning manager:', error);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Bạn có chắc muốn xóa trưởng phòng khỏi phòng ban này?')) return;
    
    try {
      await onRemove();
      onClose();
    } catch (error) {
      console.error('Error removing manager:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <UserCog className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chỉ định Trưởng phòng
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {department.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Current Manager Info */}
        {currentManager && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trưởng phòng hiện tại
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {currentManager.full_name || currentManager.email || 'N/A'}
                </p>
                {currentManager.position && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentManager.position}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            </div>
          </div>
        )}

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
              <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'Không tìm thấy thành viên nào'
                  : 'Không có thành viên nào trong tenant'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const isSelected = selectedMember?._id === member._id;
                const isCurrent = currentManager?._id === member._id;

                return (
                  <button
                    key={member._id}
                    onClick={() => setSelectedMember(member)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all text-left
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {member.full_name || member.email || 'N/A'}
                          </p>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              Hiện tại
                            </Badge>
                          )}
                        </div>
                        {member.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {member.email}
                          </p>
                        )}
                        {member.position && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {member.position}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 ml-4">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
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
            {filteredMembers.length} thành viên
            {selectedMember && selectedMember._id !== currentManager?._id && (
              <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                • {selectedMember.full_name || selectedMember.email} được chọn
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedMember || selectedMember._id === currentManager?._id || loading}
            >
              {loading ? 'Đang xử lý...' : 'Chỉ định'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ManagerAssignmentDialog;
