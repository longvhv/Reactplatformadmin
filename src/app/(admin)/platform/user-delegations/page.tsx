'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { 
  UserCog, Plus, Search, Filter, Trash2, Edit, CheckCircle, 
  XCircle, Clock, AlertCircle, Shield, ArrowRight, Calendar, StopCircle, RefreshCcw
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { 
  userDelegationsApi, 
  UserDelegation, 
  DelegationStatus,
  DelegationScope,
  DelegationStatusHelper,
  getScopeColor,
  getStatusColor,
  formatDate
} from '../../../../api/userDelegationsApi';
import { usersApi } from '../../../../api/usersApi';
import { tenantsApi } from '../../../../api/tenantsApi';
import { showToast } from '../../../../lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../../components/ui/dropdown-menu';

export default function UserDelegationsPage() {
  const router = useRouter();
  const [delegations, setDelegations] = useState<UserDelegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DelegationStatus>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | DelegationScope>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Maps for display names
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [tenantMap, setTenantMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [delegationsData, usersData, tenantsData] = await Promise.all([
        userDelegationsApi.getAll(),
        usersApi.getAll(),
        tenantsApi.getAll()
      ]);
      
      setDelegations(delegationsData);
      
      const uMap: Record<string, string> = {};
      usersData.forEach(u => uMap[u._id] = u.full_name || u.email);
      setUserMap(uMap);

      const tMap: Record<string, string> = {};
      tenantsData.forEach(t => tMap[t._id] = t.name);
      setTenantMap(tMap);

    } catch (err) {
      console.error(err);
      showToast.error('Error', 'Failed to load delegations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delegation record?')) return;
    try {
      await userDelegationsApi.delete(id);
      showToast.success('Success', 'Delegation deleted');
      setDelegations(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      showToast.error('Error', 'Failed to delete delegation');
    }
  };

  const handleRevoke = async (id: string) => {
    const reason = prompt('Reason for revocation (optional):');
    if (reason === null) return;

    try {
       // In a real app, revoked_by would come from current user context
       // Here we might need a mock ID or handle it in backend
       await userDelegationsApi.revoke(id, { 
           revoked_by: delegations.find(d => d._id === id)?.delegator_id || 'system', // Fallback
           revoked_reason: reason 
       });
       showToast.success('Success', 'Delegation revoked');
       loadData();
    } catch (err) {
       showToast.error('Error', 'Failed to revoke delegation');
    }
  };

  const handleSuspend = async (id: string) => {
     try {
         await userDelegationsApi.suspend(id);
         showToast.success('Success', 'Delegation suspended');
         loadData();
     } catch (err) {
         showToast.error('Error', 'Failed to suspend');
     }
  };

  const handleResume = async (id: string) => {
    try {
        await userDelegationsApi.resume(id);
        showToast.success('Success', 'Delegation resumed');
        loadData();
    } catch (err) {
        showToast.error('Error', 'Failed to resume');
    }
 };

  const filteredDelegations = delegations.filter(d => {
    const delegatorName = userMap[d.delegator_id] || '';
    const delegateName = userMap[d.delegate_id] || '';
    const query = searchQuery.toLowerCase();
    
    // Search
    const matchesSearch = 
        delegatorName.toLowerCase().includes(query) ||
        delegateName.toLowerCase().includes(query) ||
        d.reason?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Filters
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (scopeFilter !== 'all' && d.scope !== scopeFilter) return false;

    return true;
  });

  const getStatusBadge = (status?: string) => {
      const s = status as DelegationStatus;
      const config = {
        active: { icon: CheckCircle, label: 'Active', class: 'bg-green-100 text-green-800' },
        pending: { icon: Clock, label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
        expired: { icon: AlertCircle, label: 'Expired', class: 'bg-orange-100 text-orange-800' },
        revoked: { icon: XCircle, label: 'Revoked', class: 'bg-red-100 text-red-800' },
        suspended: { icon: StopCircle, label: 'Suspended', class: 'bg-gray-100 text-gray-800' },
      };
      const c = config[s] || config.pending;
      const Icon = c.icon;
      
      return (
          <Badge variant="outline" className={`border-0 ${c.class} flex items-center gap-1`}>
              <Icon className="w-3 h-3" /> {c.label}
          </Badge>
      );
  };

  return (
    <PageLayout
      icon={UserCog}
      title="User Delegations"
      description="Manage authority delegation between users"
      actions={
        <Button onClick={() => router.push('/platform/user-delegations/create')}>
          <Plus className="w-4 h-4 mr-2" />
          New Delegation
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by delegator, delegate, or reason..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
           <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
        </div>

        {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scope</label>
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Scopes</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                  <option value="approver">Approver</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="auditor">Auditor</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
          )}

        {loading ? (
           <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delegation Chain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope / Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDelegations.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{userMap[d.delegator_id] || 'Unknown'}</div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <div className="font-medium text-gray-900">{userMap[d.delegate_id] || 'Unknown'}</div>
                      </div>
                      {d.reason && <p className="text-xs text-gray-500 mt-1 italic">"{d.reason}"</p>}
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="outline" className={`mb-1 ${getScopeColor(d.scope)} border-0`}>
                            {d.scope}
                        </Badge>
                        {d.tenant_id && (
                             <div className="text-xs text-gray-500 flex items-center gap-1">
                                 <Shield className="w-3 h-3" />
                                 {tenantMap[d.tenant_id] || 'Unknown Tenant'}
                             </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        {getStatusBadge(d.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400"/>
                          {formatDate(d.start_date)}
                      </div>
                      {d.end_date && (
                         <div className="flex items-center gap-1 mt-1 text-xs">
                             <span className="text-gray-400">to</span> {formatDate(d.end_date)}
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/user-delegations/edit/${d._id}`)}>
                                Edit Details
                            </DropdownMenuItem>
                            
                            {d.status === 'active' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleSuspend(d._id)}>
                                        <StopCircle className="w-4 h-4 mr-2 text-orange-600" />
                                        Suspend
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRevoke(d._id)}>
                                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                        Revoke
                                    </DropdownMenuItem>
                                </>
                            )}

                            {d.status === 'suspended' && (
                                <DropdownMenuItem onClick={() => handleResume(d._id)}>
                                    <RefreshCcw className="w-4 h-4 mr-2 text-green-600" />
                                    Resume
                                </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(d._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredDelegations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No delegations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}