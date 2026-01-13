/**
 * TenantDepartmentsTab Component
 * Manages departments for a specific tenant
 * Under 500 lines
 */

import { useState, useEffect } from 'react';
import { Building, Users, Loader2, Plus, Edit, Trash2, UserCheck } from 'lucide-react';
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
import type { Department } from '@/types';

// ============================================
// TYPES
// ============================================

interface TenantDepartmentsTabProps {
  tenantId: string;
}

interface DepartmentFormData {
  code: string;
  name: string;
  parent_department_id?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  order?: number;
}

// ============================================
// COMPONENT
// ============================================

export function TenantDepartmentsTab({ tenantId }: TenantDepartmentsTabProps) {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<DepartmentFormData>({
    code: '',
    name: '',
    parent_department_id: '',
    description: '',
    status: 'ACTIVE',
    order: 0,
  });

  useEffect(() => {
    loadDepartments();
  }, [tenantId]);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/departments?tenant_id=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const result = await response.json();
      setDepartments(result.data || []);
    } catch (err) {
      console.error('Error loading departments:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('departments');
      if (stored) {
        const allDepts = JSON.parse(stored);
        const filtered = allDepts.filter((d: Department) => 
          d.tenant_id === tenantId && !d.deleted_at
        );
        setDepartments(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDept(null);
    setFormData({
      code: '',
      name: '',
      parent_department_id: '',
      description: '',
      status: 'ACTIVE',
      order: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      code: dept.code,
      name: dept.name,
      parent_department_id: dept.parent_department_id || '',
      description: dept.description || '',
      status: dept.status,
      order: dept.order || 0,
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
      const url = editingDept
        ? `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/departments/${editingDept._id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/departments`;

      const method = editingDept ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        tenant_id: tenantId,
        parent_department_id: formData.parent_department_id === '__none__' ? null : (formData.parent_department_id || null),
        ...(editingDept && { version: editingDept.version }),
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
        throw new Error(error.error || 'Failed to save department');
      }

      await loadDepartments();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving department:', err);
      alert(err.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Are you sure you want to delete "${dept.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/departments/${dept._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete department');
      }

      await loadDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department');
    }
  };

  // Filter departments by search
  const filteredDepartments = departments.filter(dept => {
    const query = searchQuery.toLowerCase();
    return (
      dept.code.toLowerCase().includes(query) ||
      dept.name.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query)
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
            {t('departments.title') || 'Departments'} ({filteredDepartments.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('departments.description') || 'Manage organizational departments'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('departments.add') || 'Add Department'}
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder={t('common.search') || 'Search departments...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Departments List */}
      {filteredDepartments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery 
              ? t('common.noResults') || 'No departments found'
              : t('departments.noDepartments') || 'No departments yet'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDepartments.map((dept) => (
            <Card
              key={dept._id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-primary" />
                  </div>

                  {/* Department Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold truncate">{dept.name}</h4>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {dept.code}
                      </code>
                      <Badge variant="outline" className={getStatusBadgeColor(dept.status)}>
                        {dept.status}
                      </Badge>
                    </div>

                    {dept.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {dept.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {dept.parent_department_id && (
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span>Has parent</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        <span>Order: {dept.order || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(dept)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(dept)}
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
              {editingDept 
                ? t('departments.edit') || 'Edit Department'
                : t('departments.add') || 'Add Department'}
            </DialogTitle>
            <DialogDescription>
              {t('departments.formDescription') || 'Fill in the department details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('departments.code') || 'Code'} *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ENG"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('departments.status') || 'Status'}</Label>
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
              <Label>{t('departments.name') || 'Name'} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Engineering Department"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('departments.parent') || 'Parent Department'}</Label>
              <Select
                value={formData.parent_department_id}
                onValueChange={(v) => setFormData({ ...formData, parent_department_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {departments
                    .filter(d => d._id !== editingDept?._id)
                    .map(d => (
                      <SelectItem key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('departments.description') || 'Description'}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Department description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('departments.order') || 'Display Order'}</Label>
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