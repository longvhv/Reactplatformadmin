/**
 * UserTenantsTab Component
 * Display user's tenant memberships
 * 
 * ✅ FIXED 2026-01-14: Use tenantMembersApi instead of non-existent /api/v1/users/{userId}/tenants
 */

import { useState, useEffect } from 'react';
import {
  Building2,
  Crown,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useTenantMembers } from '../../hooks/useTenantMembers';
import { tenantsApi } from '../../api/tenantsApi';
import type { Tenant } from '../../data/tenants';
import type { TenantMember } from '../../api/tenantMembersApi';

interface UserTenantsTabProps {
  userId: string;
}

interface UserTenantWithMember extends Tenant {
  member: TenantMember;
}

export function UserTenantsTab({ userId }: UserTenantsTabProps) {
  const [tenants, setTenants] = useState<UserTenantWithMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Get all tenant members for this user
  const { members, loading: membersLoading } = useTenantMembers({ user_id: userId });

  useEffect(() => {
    fetchTenants();
  }, [members]);

  const fetchTenants = async () => {
    if (membersLoading || !members) return;

    try {
      setLoading(true);
      
      // Get tenant details for each membership
      const tenantPromises = members.map(async (member) => {
        try {
          const tenant = await tenantsApi.getById(member.tenant_id);
          return {
            ...tenant,
            member,
          } as UserTenantWithMember;
        } catch (error) {
          console.error(`Error fetching tenant ${member.tenant_id}:`, error);
          return null;
        }
      });

      const tenantsData = (await Promise.all(tenantPromises)).filter(Boolean) as UserTenantWithMember[];
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800',
      PRO: 'bg-blue-100 text-blue-800',
      ENTERPRISE: 'bg-purple-100 text-purple-800',
      PARTNER_BASIC: 'bg-green-100 text-green-800',
      PARTNER_PREMIUM: 'bg-yellow-100 text-yellow-800',
      PARTNER_ELITE: 'bg-orange-100 text-orange-800',
      PROVIDER: 'bg-red-100 text-red-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: UserTenantWithMember['member']['status']) => {
    const configs = {
      ACTIVE: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Active' },
      INVITED: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800', label: 'Invited' },
      SUSPENDED: { icon: XCircle, color: 'bg-orange-100 text-orange-800', label: 'Suspended' },
      RESIGNED: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: 'Resigned' },
    };
    const config = configs[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tenants</h2>
          <p className="text-sm text-gray-600">
            Danh sách các tenant mà người dùng tham gia
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter((t) => t.member.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vai trò</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.reduce((sum, t) => sum + t.member.roles_count, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <Crown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Primary</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenants.filter((t) => t.member.is_primary).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Tham gia</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                  Người dùng chưa tham gia tenant nào
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {tenant.name}
                        </p>
                        {tenant.member.is_primary && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs mt-1">
                            <Crown className="w-3 h-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-sm text-gray-600">
                      {tenant.code}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge className={getTierColor(tenant.tier)}>
                      {tenant.tier}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {tenant.member.display_name || '-'}
                    </span>
                  </TableCell>

                  <TableCell>{getStatusBadge(tenant.member.status)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {tenant.member.roles_count} role{tenant.member.roles_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      {new Date(tenant.member.joined_at).toLocaleDateString('vi-VN')}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/core/tenants/${tenant._id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}