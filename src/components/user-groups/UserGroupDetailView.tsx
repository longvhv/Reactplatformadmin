/**
 * UserGroupDetailView Component
 * Detailed view of a user group with tabs (Overview, Members, Audit)
 * 
 * ✅ CREATED 2026-01-20: User Group detail with tabs
 */

import { useState } from 'react';
import {
  Users,
  History,
  X,
  Edit,
  Archive,
  ArchiveRestore,
  Shield,
  Building2,
  FolderTree,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserGroup, UserGroupWithMembers, getStatusColor } from '@/api/userGroupsApi';
import { TenantMember } from '@/api/tenantMembersApi';
import { GroupMembersTab } from './GroupMembersTab';
import { AuditTrail } from '@/components/common/AuditTrail';

type TabType = 'overview' | 'members' | 'audit';

export interface UserGroupDetailViewProps {
  group: UserGroupWithMembers;
  members?: TenantMember[]; // Current members of this group
  allMembers?: TenantMember[]; // All tenant members available for assignment
  onClose: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onActivate?: () => void;
  onRemoveMember?: (memberId: string) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

export function UserGroupDetailView({
  group,
  members = [],
  allMembers = [],
  onClose,
  onEdit,
  onArchive,
  onActivate,
  onRemoveMember,
  onRefresh,
  loading = false,
}: UserGroupDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  const getTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      ORG_UNIT: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      PROJECT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      PERMISSION: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      CUSTOM: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
      DEPARTMENT: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      TEAM: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
    };
    
    return type ? (colors[type] || colors.CUSTOM) : colors.CUSTOM;
  };

  const TypeIcon = getTypeIcon(group.group_type);

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: Building2 },
    { id: 'members', label: 'Thành viên', icon: Users, count: members.length },
    { id: 'audit', label: 'Lịch sử', icon: History },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-5xl my-8">
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getTypeColor(group.group_type).split(' ')[0]}`}>
                  <TypeIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {group.name}
                    </h2>
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      ({group.code})
                    </span>
                    <Badge className={getStatusColor(group.status)}>
                      {group.status}
                    </Badge>
                  </div>
                  {group.description && (
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{members.length} thành viên</span>
                    </div>
                    {group.group_type && (
                      <Badge variant="outline" className={getTypeColor(group.group_type)}>
                        {group.group_type}
                      </Badge>
                    )}
                    {group.is_system && (
                      <Badge variant="secondary">
                        System Group
                      </Badge>
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
                {group.status === 'ACTIVE' && onArchive && (
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
                {group.status !== 'ACTIVE' && onActivate && (
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
              <OverviewTab group={group} />
            )}

            {activeTab === 'members' && (
              <GroupMembersTab
                group={group}
                members={members}
                allMembers={allMembers}
                onRemoveMember={onRemoveMember}
                onRefresh={onRefresh}
                loading={loading}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTab group={group} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ==================== OVERVIEW TAB ====================

interface OverviewTabProps {
  group: UserGroupWithMembers;
}

function OverviewTab({ group }: OverviewTabProps) {
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
              {group.code}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tên nhóm</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">
              {group.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loại nhóm</p>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {group.group_type || 'Custom'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Thứ tự hiển thị</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">
              {group.order || 0}
            </p>
          </div>
        </div>
        {group.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Mô tả</p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">
              {group.description}
            </p>
          </div>
        )}
      </Card>

      {/* Metadata (if exists) */}
      {group.metadata && Object.keys(group.metadata).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Metadata
          </h3>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(group.metadata, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

// ==================== AUDIT TAB ====================

interface AuditTabProps {
  group: UserGroup;
}

function AuditTab({ group }: AuditTabProps) {
  return (
    <div className="max-w-2xl">
      <AuditTrail
        data={group}
        showVersion={true}
        showDeleted={true}
      />
    </div>
  );
}

export default UserGroupDetailView;
