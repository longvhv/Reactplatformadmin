/**
 * Role Detail Page
 * Displays comprehensive role information with tabs for permissions and users
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../components/shim/next-navigation';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Edit, 
  Trash2, 
  Settings,
  Lock,
  User,
  Info,
  MoreVertical,
  UserCheck,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../../../../providers/LanguageProvider';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Badge } from '../../../../../components/ui/badge';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { useRole } from '../../../../../hooks/useRole';
import { usePermissions } from '../../../../../hooks/usePermissions';
import { userRolesApi, UserRole } from '../../../../../api/userRolesApi';
import { ConfirmDialog } from '../../../../../components/common/ConfirmDialog';
import { showToast } from '../../../../../lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';

function RoleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t } = useLanguage();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddPermissions, setShowAddPermissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');
  const [roleUsers, setRoleUsers] = useState<UserRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { 
    role, 
    loading, 
    error, 
    updateRole, 
    deleteRole 
  } = useRole(id);

  const { permissions, loading: permissionsLoading } = usePermissions({ autoLoad: true });

  useEffect(() => {
    if (!id) {
      router.push('/admin/roles');
    }
  }, [id, router]);

  useEffect(() => {
    if (activeTab === 'users' && id) {
      loadRoleUsers();
    }
  }, [activeTab, id]);

  const loadRoleUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await userRolesApi.getUsersByRole(id);
      setRoleUsers(users);
    } catch (error) {
      console.error('Failed to load role users:', error);
      showToast.error('Error', 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRole();
      showToast.success('Success', 'Role deleted successfully');
      router.push('/admin/roles');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete role');
    }
  };

  const handleTogglePermission = async (permissionId: string) => {
    if (!role) return;
    
    try {
      const currentPermissions = role.permissions || [];
      const hasPermission = currentPermissions.includes(permissionId);
      
      const updatedPermissions = hasPermission
        ? currentPermissions.filter(p => p !== permissionId)
        : [...currentPermissions, permissionId];

      await updateRole({ permissions: updatedPermissions });
      showToast.success('Success', 'Permissions updated');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update permissions');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await userRolesApi.removeUserFromRole(id, userId);
      showToast.success('Success', 'User removed from role');
      loadRoleUsers();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to remove user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Role Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The role you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/admin/roles')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rolePermissions = role.permissions || [];

  return (
    <>
      <PageLayout
        icon={Shield}
        title={role.name}
        description={role.description || 'Manage role permissions and users'}
        backButton={{
          label: 'Back to Roles',
          onClick: () => router.push('/admin/roles'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/admin/roles/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {/* Role Info */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role Name</p>
              <p className="text-lg font-semibold">{role.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Permissions</p>
              <p className="text-lg font-semibold">{rolePermissions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Users</p>
              <p className="text-lg font-semibold">{roleUsers.length}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Permissions ({rolePermissions.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users ({roleUsers.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'permissions' && (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowAddPermissions(!showAddPermissions)}>
                  {showAddPermissions ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Permissions
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {filteredPermissions.length} permissions available
              </p>

              <div className="space-y-2">
                {filteredPermissions.map((permission) => {
                  const isAssigned = rolePermissions.includes(permission._id);
                  
                  return (
                    <div
                      key={permission._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Lock className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium">{permission.name}</span>
                          {isAssigned && (
                            <Badge className="bg-green-100 text-green-800">Assigned</Badge>
                          )}
                        </div>
                        {permission.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={isAssigned ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleTogglePermission(permission._id)}
                      >
                        {isAssigned ? 'Remove' : 'Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {activeTab === 'users' && (
          <Card className="p-6">
            {loadingUsers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : roleUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No users assigned to this role</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roleUsers.map((userRole) => (
                  <div
                    key={userRole._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{userRole.user_email}</p>
                      <p className="text-sm text-gray-500">
                        Assigned: {new Date(userRole.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(userRole.user_id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Role"
        description={`Are you sure you want to delete "${role.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

// Named export for reuse
export { RoleDetailPage };

// Default export for routing
export default RoleDetailPage;