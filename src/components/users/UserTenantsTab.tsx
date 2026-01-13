/**
 * UserTenantsTab Component
 * Displays tenants associated with a specific user
 * Used in UserDetailPage
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, Calendar, Loader2, Building, Users } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

// ============================================
// TYPES
// ============================================

interface Department {
  _id: string;
  name: string;
  code: string;
  is_primary?: boolean;
  role_in_department?: string;
}

interface UserGroup {
  _id: string;
  name: string;
  code: string;
  is_primary?: boolean;
  role_in_group?: string;
}

interface UserTenant {
  _id: string;
  tenant_id: string;
  tenant_name?: string;
  tenant_code?: string;
  tenant_tier?: string;
  user_id: string;
  employee_code?: string;
  job_title?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'RESIGNED' | 'ONBOARDING' | 'SUSPENDED';
  joined_at?: string;
  created_at: string;
  updated_at: string;
  departments?: Department[];
  user_groups?: UserGroup[];
}

interface UserTenantsTabProps {
  userId: string;
}

// ============================================
// COMPONENT
// ============================================

export function UserTenantsTab({ userId }: UserTenantsTabProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTenants();
  }, [userId]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      // Fetch tenant memberships
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenant-members?user_id=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user tenants');
      }

      const result = await response.json();
      const tenantsData = result.data || [];
      
      // Load departments and user groups for each tenant member
      const tenantsWithExtras = await Promise.all(
        tenantsData.map(async (tenant: UserTenant) => {
          const extras: Partial<UserTenant> = { ...tenant };
          
          // Load departments
          try {
            const deptResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenant-members/${tenant._id}/departments`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
              }
            );

            if (deptResponse.ok) {
              const deptResult = await deptResponse.json();
              extras.departments = deptResult.data || [];
            }
          } catch (err) {
            console.error('Error loading departments for tenant member:', err);
          }
          
          // Load user groups
          try {
            const groupsResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/tenant-members/${tenant._id}/user-groups`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
              }
            );

            if (groupsResponse.ok) {
              const groupsResult = await groupsResponse.json();
              extras.user_groups = groupsResult.data || [];
            }
          } catch (err) {
            console.error('Error loading user groups for tenant member:', err);
          }
          
          return extras as UserTenant;
        })
      );

      setTenants(tenantsWithExtras);
    } catch (err) {
      console.error('Error loading user tenants:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('tenant_members');
      if (stored) {
        const allMembers = JSON.parse(stored);
        const filtered = allMembers.filter((m: UserTenant) => m.user_id === userId);
        setTenants(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter tenants by search
  const filteredTenants = tenants.filter(tenant => {
    const query = searchQuery.toLowerCase();
    return (
      tenant.tenant_name?.toLowerCase().includes(query) ||
      tenant.tenant_code?.toLowerCase().includes(query) ||
      tenant.job_title?.toLowerCase().includes(query) ||
      tenant.employee_code?.toLowerCase().includes(query)
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

  // Get tier badge color
  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'BUSINESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STARTER': return 'bg-green-100 text-green-800 border-green-200';
      case 'FREE': return 'bg-gray-100 text-gray-800 border-gray-200';
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
            {t('users.tenants') || 'Tenants'} ({filteredTenants.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('users.tenantsDescription') || 'Organizations this user belongs to'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder={t('common.search') || 'Search tenants...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tenants List */}
      {filteredTenants.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery 
              ? t('common.noResults') || 'No tenants found'
              : t('users.noTenants') || 'No tenants yet'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTenants.map((tenant) => (
            <Card
              key={tenant._id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/core/tenants/${tenant.tenant_id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Tenant Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>

                  {/* Tenant Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold truncate">
                        {tenant.tenant_name || 'Unknown Tenant'}
                      </h4>
                      {tenant.tenant_code && (
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {tenant.tenant_code}
                        </code>
                      )}
                      {tenant.tenant_tier && (
                        <Badge variant="outline" className={getTierBadgeColor(tenant.tenant_tier)}>
                          {tenant.tenant_tier}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                      <Badge variant="outline" className={getRoleBadgeColor(tenant.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {tenant.role}
                      </Badge>
                      <Badge variant="outline" className={getStatusBadgeColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      {tenant.job_title && (
                        <div>
                          <span className="font-medium">Position:</span> {tenant.job_title}
                        </div>
                      )}
                      {tenant.employee_code && (
                        <div>
                          <span className="font-medium">Employee Code:</span> {tenant.employee_code}
                        </div>
                      )}
                      {tenant.joined_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Joined: {new Date(tenant.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {tenant.departments && tenant.departments.length > 0 && (
                        <div className="flex items-start gap-2 mt-2">
                          <Building className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {tenant.departments.map((dept, index) => (
                              <Badge
                                key={dept._id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {dept.name}
                                {dept.is_primary && (
                                  <span className="ml-1 text-primary">★</span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {tenant.user_groups && tenant.user_groups.length > 0 && (
                        <div className="flex items-start gap-2 mt-2">
                          <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {tenant.user_groups.map((group, index) => (
                              <Badge
                                key={group._id}
                                variant="outline"
                                className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200"
                              >
                                {group.name}
                                {group.is_primary && (
                                  <span className="ml-1 text-primary">★</span>
                                )}
                              </Badge>
                            ))}
                          </div>
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
                    navigate(`/core/tenants/${tenant.tenant_id}`);
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