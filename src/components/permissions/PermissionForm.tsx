/**
 * Permission Form Component
 * Create and Edit permission forms with validation
 */

import { useState, useEffect } from 'react';
import {
  permissionsApi,
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from '../../api/permissionsApi';
import { useApplications } from '../../hooks/useApplications';
import { usePermissions } from '../../hooks/usePermissions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface PermissionFormProps {
  initialData?: Permission | null;
  onSubmit: (data: CreatePermissionRequest | UpdatePermissionRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export function PermissionForm({
  initialData,
  onSubmit,
  loading = false,
  onCancel,
}: PermissionFormProps) {
  const isEdit = !!initialData;
  const { applications, loadApplications } = useApplications({ autoLoad: true, isActive: true });
  const { permissions: allPermissions, loadPermissions } = usePermissions({ autoLoad: true });

  const [formData, setFormData] = useState<CreatePermissionRequest>({
    app_code: '',
    code: '',
    name: '',
    description: '',
    is_group: false,
    parent_code: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        app_code: initialData.app_code,
        code: initialData.code,
        name: initialData.name,
        description: initialData.description || '',
        is_group: initialData.is_group,
        parent_code: initialData.parent_code || null,
        version: initialData.version,
      } as any);
    }
  }, [initialData]);

  // Filter permissions for parent selection based on selected app_code
  // and exclude self (if editing) to prevent cycles
  const availableParents = allPermissions.filter((p) => {
    if (p.app_code !== formData.app_code) return false;
    if (isEdit && p.code === formData.code) return false;
    // Only groups can be parents? Usually yes, but let's stick to schema which doesn't strictly enforce it in FK,
    // but logically it makes sense. Let's filter by is_group if that's the intended logic,
    // but for now I'll list all permissions of the same app.
    // Better UX: only show 'is_group' permissions as parents.
    return p.is_group; 
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.app_code) newErrors.app_code = 'Application is required';
    if (!formData.code) newErrors.code = 'Code is required';
    else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must be UPPERCASE_SNAKE_CASE';
    }
    if (!formData.name) newErrors.name = 'Name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Code */}
        <div className="space-y-2">
          <Label htmlFor="app_code">Application <span className="text-red-500">*</span></Label>
          <Select
            value={formData.app_code}
            onValueChange={(value) => setFormData({ ...formData, app_code: value })}
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Application" />
            </SelectTrigger>
            <SelectContent>
              {applications.map((app) => (
                <SelectItem key={app.code} value={app.code}>
                  {app.name} ({app.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.app_code && <p className="text-sm text-red-500">{errors.app_code}</p>}
        </div>

        {/* Parent Code */}
        <div className="space-y-2">
          <Label htmlFor="parent_code">Parent Permission (Group)</Label>
          <Select
            value={formData.parent_code || "none"}
            onValueChange={(value) =>
              setFormData({ ...formData, parent_code: value === "none" ? null : value })
            }
            disabled={!formData.app_code}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.app_code ? "Select Parent (Optional)" : "Select Application First"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- No Parent (Root) --</SelectItem>
              {availableParents.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Only 'Group' type permissions can be selected as parents.</p>
        </div>

        {/* Permission Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Permission Code <span className="text-red-500">*</span></Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. USER_READ"
            disabled={isEdit}
          />
          {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
          <p className="text-xs text-gray-500">Format: UPPERCASE_SNAKE_CASE. Unique within the system.</p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Display Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Read Users"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this permission allows..."
          rows={3}
        />
      </div>

      {/* Is Group */}
      <div className="flex items-center space-x-2 border p-4 rounded-md">
        <Checkbox
          id="is_group"
          checked={formData.is_group}
          onCheckedChange={(checked) => setFormData({ ...formData, is_group: !!checked })}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="is_group"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Is Group?
          </Label>
          <p className="text-sm text-muted-foreground">
            Groups can contain other permissions but usually don't grant specific access themselves.
          </p>
        </div>
      </div>

      {errors.submit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update Permission' : 'Create Permission'}
        </Button>
      </div>
    </form>
  );
}