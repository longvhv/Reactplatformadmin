/**
 * DepartmentDetailView Component
 * Detailed view of a department with tabs (Overview, Members, Audit)
 * 
 * ✅ UPDATED 2026-01-21: Supports EnrichedDepartment and joined manager data
 */

import { useState } from 'react';
import {
  Building2,
  Users,
  History,
  X,
  UserCog,
  Edit,
  Archive,
  ArchiveRestore,
  FolderTree,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { EnrichedDepartment, Department } from '../../api/departmentsApi';
import { TenantMember } from '../../api/tenantMembersApi';
import { DepartmentMembersTab } from './DepartmentMembersTab';
import { AuditTrail } from '../common/AuditTrail';
import { ManagerAssignmentDialog } from './ManagerAssignmentDialog';

type TabType = 'overview' | 'members' | 'audit';

export interface DepartmentDetailViewProps {
  department: Department | EnrichedDepartment;
  members?: TenantMember[];
  allMembers?: TenantMember[];
  currentManager?: TenantMember | null;
  onClose: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onActivate?: () => void;
  onAssignManager?: (managerId: string) => Promise<void>;
  onRemoveManager?: () => Promise<void>;
  onAssignMembers?: (memberIds: string[]) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
  onRefreshMembers?: () => void;
  loading?: boolean;
}

export function DepartmentDetailView({
  department,
  members = [],
  allMembers = [],
  currentManager,
  onClose,
  onEdit,
  onArchive,
  onActivate,
  onAssignManager,
  onRemoveManager,
  onAssignMembers,
  onRemoveMember,
  onRefreshMembers,
  loading = false,
}: DepartmentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showManagerDialog, setShowManagerDialog] = useState(false);

  // Helper to check if department is enriched
  const isEnriched = (dept: any): dept is EnrichedDepartment => {
    return dept.manager !== undefined;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      INACTIVE: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
      ARCHIVED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.INACTIVE;
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: Building2 },
    { id: 'members', label: 'Thành viên', icon: Users, count: members.length },
    { id: 'audit', label: 'Kiểm toán', icon: History },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-8">
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getStatusColor(department.status).split(' ')[0]}`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {department.name}
                    </h2>
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      ({department.code})
                    </span>
                    <Badge className={getStatusColor(department.status)}>
                      {department.status}
                    </Badge>
                  </div>
                  {department.description && (
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                      {department.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    {members.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{members.length} thành viên</span>
                      </div>
                    )}
                    {department.manager_id && (
                      <div className="flex items-center gap-1">
                        <UserCog className="w-4 h-4" />
                        <span>Có trưởng phòng</span>
                      </div>
                    )}
                    {department.parent_department_id && (
                      <div className="flex items-center gap-1">
                        <FolderTree className="w-4 h-4" />
                        <span>Phòng ban con</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Sửa
                  </Button>
                )}
                {department.status === 'ACTIVE' && onArchive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onArchive}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Lưu trữ
                  </Button>
                )}
                {department.status !== 'ACTIVE' && onActivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onActivate}
                    className="text-green-600 hover:text-green-700"
                  >
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Kích hoạt
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
                      ${isActive
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.count !== undefined && (
                      <Badge variant="secondary" className="ml-1">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab
                department={department}
                currentManager={currentManager}
                onAssignManager={() => setShowManagerDialog(true)}
              />
            )}

            {activeTab === 'members' && (
              <DepartmentMembersTab
                department={department}
                members={members}
                allMembers={allMembers}
                onAssignMembers={onAssignMembers}
                onRemoveMember={onRemoveMember}
                onRefresh={onRefreshMembers}
                loading={loading}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTab department={department} />
            )}
          </div>
        </Card>

        {/* Manager Assignment Dialog */}
        {showManagerDialog && onAssignManager && onRemoveManager && (
          <ManagerAssignmentDialog
            department={department}
            currentManager={currentManager}
            members={allMembers}
            onAssign={onAssignManager}
            onRemove={onRemoveManager}
            onClose={() => setShowManagerDialog(false)}
          />
        )}
      </div>
    </div>
  );
}

// ==================== OVERVIEW TAB ====================

interface OverviewTabProps {
  department: Department | EnrichedDepartment;
  currentManager?: TenantMember | null;
  onAssignManager?: () => void;
}

function OverviewTab({
  department,
  currentManager,
  onAssignManager,
}: OverviewTabProps) {
  // Use enriched data if available, fallback to currentManager prop
  const managerName = (department as EnrichedDepartment).manager?.user?.full_name 
    || currentManager?.user_name || (currentManager as any)?.user?.full_name || 'N/A';
  
  const managerEmail = (department as EnrichedDepartment).manager?.user?.email
    || (currentManager as any)?.email || (currentManager as any)?.user?.email;

  const managerInitial = (managerName || managerEmail || '?')[0].toUpperCase();

  const hasManager = !!department.manager_id;

  return (
    <div className="grid gap-6">
      {/* Basic Info */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Thông tin cơ bản
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mã code</p>
            <p className="font-mono font-semibold text-gray-900 dark:text-white mt-1">
              {department.code}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tên phòng ban</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">
              {department.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</p>
            <Badge className="mt-1">
              {department.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Thứ tự</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">
              {department.order || 0}
            </p>
          </div>
        </div>
        {department.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Mô tả</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">
              {department.description}
            </p>
          </div>
        )}
      </Card>

      {/* Manager Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Trưởng phòng
          </h3>
          {onAssignManager && (
            <Button variant="outline" size="sm" onClick={onAssignManager}>
              <UserCog className="w-4 h-4 mr-2" />
              {hasManager ? 'Thay đổi' : 'Chỉ định'}
            </Button>
          )}
        </div>
        {hasManager ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {managerInitial}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {managerName}
              </p>
              {managerEmail && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {managerEmail}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <UserCog className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chưa có trưởng phòng
            </p>
          </div>
        )}
      </Card>

      {/* Metadata (if exists) */}
      {department.metadata && Object.keys(department.metadata).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Metadata
          </h3>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(department.metadata, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ==================== AUDIT TAB ====================

interface AuditTabProps {
  department: Department;
}

function AuditTab({ department }: AuditTabProps) {
  return (
    <div className="max-w-2xl">
      <AuditTrail
        data={department}
        showVersion={true}
        showDeleted={true}
      />
    </div>
  );
}

export default DepartmentDetailView;