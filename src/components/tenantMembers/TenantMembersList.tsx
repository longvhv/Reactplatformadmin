/**
 * Tenant Members List Component
 * Display and manage tenant members with filtering and actions
 */

import { useState, useMemo } from 'react';
import { useLanguage } from '../../providers/LanguageProvider';
import { Users, UserPlus, Search, Filter, MoreVertical, Edit, Trash2, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

// ============================================
// TYPES
// ============================================

export interface TenantMember {
  _id: string;
  tenant_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  manager_id?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';
  joined_at?: string;
  left_at?: string;
  created_at: string;
  updated_at: string;
}

interface TenantMembersListProps {
  members: TenantMember[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (member: TenantMember) => void;
  onDelete?: (memberId: string) => void;
  onViewDetails?: (member: TenantMember) => void;
}

// ============================================
// COMPONENT
// ============================================

export function TenantMembersList({
  members,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onViewDetails,
}: TenantMembersListProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        member.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.employee_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MEMBER': return 'bg-green-100 text-green-800 border-green-200';
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'ONBOARDING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RESIGNED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{t('tenantMembers.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {filteredMembers.length} {t('tenantMembers.members')}
            </p>
          </div>
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {t('tenantMembers.addMember')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('tenantMembers.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('tenantMembers.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ONBOARDING">Onboarding</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="RESIGNED">Resigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Members List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('tenantMembers.noMembers')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMembers.map((member) => (
            <Card key={member._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                {/* Avatar & Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="relative">
                    {member.user_avatar ? (
                      <img
                        src={member.user_avatar}
                        alt={member.user_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        member.status === 'ACTIVE' ? 'bg-green-500' :
                        member.status === 'ONBOARDING' ? 'bg-blue-500' :
                        member.status === 'SUSPENDED' ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold">{member.user_name || 'Unknown'}</h3>
                      <Badge className={`${getRoleBadgeColor(member.role)} text-xs`}>
                        {member.role}
                      </Badge>
                      <Badge className={`${getStatusBadgeColor(member.status)} text-xs`}>
                        {member.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {member.job_title && (
                        <p className="font-medium text-foreground">{member.job_title}</p>
                      )}
                      {member.user_email && (
                        <p>{member.user_email}</p>
                      )}
                      {member.employee_code && (
                        <p>Employee Code: {member.employee_code}</p>
                      )}
                      {member.joined_at && (
                        <p>Joined: {formatDate(member.joined_at)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewDetails && (
                      <DropdownMenuItem onClick={() => onViewDetails(member)}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        {t('common.viewDetails')}
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(member)}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(member._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
