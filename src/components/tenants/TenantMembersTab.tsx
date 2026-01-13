/**
 * TenantMembersTab Component
 * Displays members of a specific tenant
 * Used in TenantDetailPage
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Briefcase, Calendar, UserCheck, Loader2 } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

// ============================================
// TYPES
// ============================================

interface TenantMember {
  _id: string;
  tenant_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  employee_code?: string;
  internal_email?: string;
  job_title?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';
  joined_at?: string;
  created_at: string;
  updated_at: string;
}

interface TenantMembersTabProps {
  tenantId: string;
}

// ============================================
// COMPONENT
// ============================================

export function TenantMembersTab({ tenantId }: TenantMembersTabProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
  }, [tenantId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenant-members?tenant_id=${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const result = await response.json();
      setMembers(result.data || []);
    } catch (err) {
      console.error('Error loading members:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('tenant_members');
      if (stored) {
        const allMembers = JSON.parse(stored);
        const filtered = allMembers.filter((m: TenantMember) => m.tenant_id === tenantId);
        setMembers(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter members by search
  const filteredMembers = members.filter(member => {
    const query = searchQuery.toLowerCase();
    return (
      member.user_name?.toLowerCase().includes(query) ||
      member.user_email?.toLowerCase().includes(query) ||
      member.employee_code?.toLowerCase().includes(query) ||
      member.job_title?.toLowerCase().includes(query)
    );
  });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {t('tenants.members') || 'Members'} ({filteredMembers.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('tenants.membersDescription') || 'Users associated with this tenant'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder={t('common.search') || 'Search members...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery 
              ? t('common.noResults') || 'No members found'
              : t('tenants.noMembers') || 'No members yet'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <Card
              key={member._id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/core/users/${member.user_id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {member.user_name || 'Unknown'}
                      </h4>
                      <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                        {member.role}
                      </Badge>
                      <Badge variant="outline" className={getStatusBadgeColor(member.status)}>
                        {member.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {member.user_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{member.user_email}</span>
                        </div>
                      )}
                      {member.job_title && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{member.job_title}</span>
                        </div>
                      )}
                      {member.employee_code && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          <span>Code: {member.employee_code}</span>
                        </div>
                      )}
                      {member.joined_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Joined: {new Date(member.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/core/users/${member.user_id}`);
                  }}
                >
                  {t('common.view') || 'View'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}