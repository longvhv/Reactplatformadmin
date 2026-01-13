/**
 * TenantUserGroupsTab Component
 * Manages user groups for a specific tenant
 * Under 500 lines
 */

import { useState, useEffect } from 'react';
import { Users, Loader2, Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import type { UserGroup } from '@/types';

// ============================================
// TYPES
// ============================================

interface TenantUserGroupsTabProps {
  tenantId: string;
}

interface UserGroupFormData {
  code: string;
  name: string;
  description?: string;
  group_type?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  order?: number;
}

// ============================================
// COMPONENT
// ============================================

export function TenantUserGroupsTab({ tenantId }: TenantUserGroupsTabProps) {
  const { t } = useLanguage();
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<UserGroupFormData>({
    code: '',
    name: '',
    description: '',
    group_type: '',
    status: 'ACTIVE',
    order: 0,
  });

  useEffect(() => {
    loadUserGroups();
  }, [tenantId]);

  const loadUserGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/user-groups?tenant_id=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user groups');
      }

      const result = await response.json();
      setUserGroups(result.data || []);
    } catch (err) {
      console.error('Error loading user groups:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('user_groups');
      if (stored) {
        const allGroups = JSON.parse(stored);
        const filtered = allGroups.filter((g: UserGroup) => 
          g.tenant_id === tenantId && !g.deleted_at
        );
        setUserGroups(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      group_type: '',
      status: 'ACTIVE',
      order: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setFormData({
      code: group.code,
      name: group.name,
      description: group.description || '',
      group_type: group.group_type || '',
      status: group.status,
      order: group.order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      alert('Code and name are required');
      return;
    }

    setSaving(true);
    try {
      const url = editingGroup
        ? `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/user-groups/${editingGroup._id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/user-groups`;

      const method = editingGroup ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        tenant_id: tenantId,
        group_type: formData.group_type || null,
        ...(editingGroup && { version: editingGroup.version }),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user group');
      }

      await loadUserGroups();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving user group:', err);
      alert(err.message || 'Failed to save user group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group: UserGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/user-groups/${group._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete user group');
      }

      await loadUserGroups();
    } catch (err) {
      console.error('Error deleting user group:', err);
      alert('Failed to delete user group');
    }
  };

  // Filter user groups by search
  const filteredUserGroups = userGroups.filter(group => {
    const query = searchQuery.toLowerCase();
    return (
      group.code.toLowerCase().includes(query) ||
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    );
  });

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ARCHIVED': return 'bg-orange-100 text-orange-800 border-orange-200';
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
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {t('userGroups.title') || 'User Groups'} ({filteredUserGroups.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('userGroups.description') || 'Manage user groups and permissions'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('userGroups.add') || 'Add User Group'}
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder={t('common.search') || 'Search user groups...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* User Groups List */}
      {filteredUserGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery 
              ? t('common.noResults') || 'No user groups found'
              : t('userGroups.noUserGroups') || 'No user groups yet'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUserGroups.map((group) => (
            <Card
              key={group._id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold truncate">{group.name}</h4>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {group.code}
                      </code>
                      <Badge variant="outline" className={getStatusBadgeColor(group.status)}>
                        {group.status}
                      </Badge>
                    </div>

                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {group.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {group.group_type && (
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          <span>{group.group_type}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>Order: {group.order || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(group)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(group)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup 
                ? t('userGroups.edit') || 'Edit User Group'
                : t('userGroups.add') || 'Add User Group'}
            </DialogTitle>
            <DialogDescription>
              {t('userGroups.formDescription') || 'Fill in the user group details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('userGroups.code') || 'Code'} *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ADMIN"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('userGroups.status') || 'Status'}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('userGroups.name') || 'Name'} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Administrators"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('userGroups.groupType') || 'Group Type'}</Label>
              <Input
                value={formData.group_type}
                onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                placeholder="ROLE, PERMISSION, CUSTOM"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('userGroups.description') || 'Description'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="User group description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('userGroups.order') || 'Display Order'}</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                t('common.save') || 'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}