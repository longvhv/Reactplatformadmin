/**
 * Permissions Management Page
 * List and manage system permissions
 */

'use client';

import { useState } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useApplications } from '../../../../hooks/useApplications';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Card } from '../../../../components/ui/card';
import {
  Shield,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Folder,
  FileKey,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { showToast } from '../../../../lib/toast';
import { Permission } from '../../../../api/permissionsApi';

export default function PermissionsPage() {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hooks
  const { applications } = useApplications({ autoLoad: true });
  const { permissions, loading, deletePermission, loadPermissions } = usePermissions({ 
    autoLoad: true 
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Filter logic
  const filteredPermissions = permissions.filter(p => {
    const matchesApp = selectedApp === 'all' || p.app_code === selectedApp;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesApp && matchesSearch;
  });

  // Sort: Groups first, then by code
  const sortedPermissions = [...filteredPermissions].sort((a, b) => {
    if (a.app_code !== b.app_code) return a.app_code.localeCompare(b.app_code);
    if (a.is_group !== b.is_group) return a.is_group ? -1 : 1;
    return a.code.localeCompare(b.code);
  });

  const handleDelete = (permission: Permission) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Permission',
      description: `Are you sure you want to delete permission "${permission.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deletePermission(permission._id);
          showToast.success('Success', 'Permission deleted successfully');
        } catch (error: any) {
          showToast.error('Error', error.message || 'Failed to delete permission');
        }
      },
    });
  };

  return (
    <PageLayout
      title="Permissions"
      description="Manage system permissions and access controls"
      icon={Shield}
      actions={
        <Button onClick={() => router.push('/platform/permissions/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Permission
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedApp} onValueChange={setSelectedApp}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Filter by Application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  {applications.map(app => (
                    <SelectItem key={app.code} value={app.code}>
                      {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* List */}
        <Card>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
              <p className="mt-2 text-gray-500">Loading permissions...</p>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No permissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                  <tr>
                    <th className="px-6 py-3">Permission</th>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Application</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedPermissions.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {p.is_group ? (
                            <Folder className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileKey className="w-4 h-4 text-gray-400" />
                          )}
                          <div className="font-medium text-gray-900">{p.name}</div>
                        </div>
                        {p.description && (
                          <div className="text-xs text-gray-500 mt-0.5 ml-6">{p.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">{p.code}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {p.app_code}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {p.is_group ? (
                          <span className="text-blue-600 text-xs font-medium">Group</span>
                        ) : (
                          <span className="text-gray-500 text-xs">Permission</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/permissions/edit/${p._id}`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDelete(p)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </PageLayout>
  );
}