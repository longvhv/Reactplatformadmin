'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { 
  Shield, Plus, Search, Filter, Trash2, Edit, CheckCircle, 
  XCircle, Clock, Building, User, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { 
  userRolesApi, 
  UserRole, 
  UserRoleScope,
  UserRoleScopeHelper
} from '@/api/userRolesApi';
import { usersApi } from '@/api/usersApi';
import { rolesApi } from '@/api/rolesApi';
import { showToast } from '@/lib/toast';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export default function UserRolesPage() {
  const router = useRouter();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data Maps
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [urData, usersData, rolesData] = await Promise.all([
        userRolesApi.getAll(),
        usersApi.getAll(),
        rolesApi.getAll()
      ]);
      
      setUserRoles(urData);
      
      const uMap: Record<string, string> = {};
      usersData.forEach(u => uMap[u._id] = u.full_name);
      setUserMap(uMap);

      const rMap: Record<string, string> = {};
      rolesData.forEach(r => rMap[r._id] = r.name);
      setRoleMap(rMap);

    } catch (err) {
      console.error(err);
      showToast.error('Error', 'Failed to load user roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this role assignment?')) return;
    try {
      await userRolesApi.delete(id);
      showToast.success('Success', 'Role assignment removed');
      setUserRoles(prev => prev.filter(ur => ur._id !== id));
    } catch (err) {
      showToast.error('Error', 'Failed to remove role assignment');
    }
  };

  const handleToggleStatus = async (userRole: UserRole) => {
      try {
          if (userRole.is_active) {
              await userRolesApi.deactivate(userRole._id);
              showToast.success('Success', 'Role deactivated');
          } else {
              await userRolesApi.activate(userRole._id);
              showToast.success('Success', 'Role activated');
          }
          loadData();
      } catch (err) {
          showToast.error('Error', 'Failed to update status');
      }
  };

  const filteredRoles = userRoles.filter(ur => {
    const userName = userMap[ur.user_id] || '';
    const roleName = roleMap[ur.role_id] || '';
    const query = searchQuery.toLowerCase();
    
    return userName.toLowerCase().includes(query) ||
           roleName.toLowerCase().includes(query) ||
           ur.scope.toLowerCase().includes(query);
  });

  const getScopeBadge = (scope: UserRoleScope) => {
      switch(scope) {
          case 'global': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">Global</Badge>;
          case 'tenant': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Tenant</Badge>;
          case 'department': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">Dept</Badge>;
          case 'project': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Project</Badge>;
          default: return <Badge variant="outline">{scope}</Badge>;
      }
  };

  return (
    <PageLayout
      icon={Users}
      title="User Roles"
      description="Manage role assignments and permissions for users"
      actions={
        <Button onClick={() => router.push('/platform/user-roles/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Assign Role
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by user, role, or scope..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Granted / Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.map((ur) => (
                  <tr key={ur._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                             {userMap[ur.user_id]?.substring(0,2).toUpperCase() || '??'}
                         </div>
                         <div className="font-medium text-gray-900">{userMap[ur.user_id] || 'Unknown User'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{roleMap[ur.role_id] || 'Unknown Role'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                            <div>{getScopeBadge(ur.scope)}</div>
                            {ur.scope_id && (
                                <div className="text-xs text-gray-500 font-mono">
                                    ID: {ur.scope_id.substring(0,8)}...
                                </div>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {ur.is_active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                        ) : (
                            <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400">Granted: {ur.granted_at ? format(new Date(ur.granted_at), 'MMM dd, yyyy') : '-'}</span>
                        {ur.expires_at ? (
                             <span className={cn(
                                 "text-xs flex items-center gap-1",
                                 new Date(ur.expires_at) < new Date() ? "text-red-600 font-medium" : "text-gray-500"
                             )}>
                                <Clock className="w-3 h-3"/> {format(new Date(ur.expires_at), 'MMM dd, yyyy')}
                             </span>
                        ) : (
                            <span className="text-xs text-gray-400">Permanent</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/user-roles/edit/${ur._id}`)}>
                                Edit Assignment
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(ur)}>
                                {ur.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(ur._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No role assignments found.
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