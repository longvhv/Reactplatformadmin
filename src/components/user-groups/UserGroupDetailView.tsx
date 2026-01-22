/**
 * UserGroupDetailView Component
 * Detailed view of a user group
 */

import { useState } from 'react';
import {
  Users,
  History,
  X,
  Edit,
  Info,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { UserGroup } from '../../api/userGroupsApi';
import { AuditTrail } from '../common/AuditTrail';
// import { UserGroupMembersTab } from './UserGroupMembersTab'; // Will create this next

interface UserGroupDetailViewProps {
  group: UserGroup;
  onClose: () => void;
  onEdit?: () => void;
}

type TabType = 'overview' | 'members' | 'audit';

export function UserGroupDetailView({
  group,
  onClose,
  onEdit,
}: UserGroupDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'INACTIVE': return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      case 'ARCHIVED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: Info },
    // { id: 'members', label: 'Thành viên', icon: Users }, // Enabling later when MembersTab is ready
    { id: 'audit', label: 'Lịch sử', icon: History },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8">
        <Card className="overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getStatusColor(group.status).split(' ')[0]}`}>
                  <Users className={`w-6 h-6 ${getStatusColor(group.status).split(' ')[1]}`} />
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
                     {group.group_type && (
                       <Badge variant="outline">{group.group_type}</Badge>
                     )}
                     <span>Thứ tự: {group.order || 0}</span>
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
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'overview' && (
              <div className="grid gap-6">
                <Card className="p-4">
                   <h3 className="font-semibold mb-4">Thông tin chi tiết</h3>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Tenant ID</p>
                        <p className="font-mono">{group.tenant_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Group ID</p>
                        <p className="font-mono">{group._id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Created By</p>
                        <p>{group.created_by || 'System'}</p>
                      </div>
                      <div>
                         <p className="text-gray-500">Created At</p>
                         <p>{new Date(group.created_at).toLocaleString('vi-VN')}</p>
                      </div>
                   </div>
                </Card>

                {group.metadata && Object.keys(group.metadata).length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Metadata</h3>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(group.metadata, null, 2)}
                    </pre>
                  </Card>
                )}
              </div>
            )}

            {/* {activeTab === 'members' && (
               <div className="text-center py-8 text-gray-500">
                  Tính năng quản lý thành viên đang được phát triển
               </div>
            )} */}

            {activeTab === 'audit' && (
              <AuditTrail
                data={group}
                showVersion={true}
                showDeleted={true}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}