/**
 * User Group Form Component
 * Create/Edit user group with validation
 */

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { userGroupsApi, UserGroupWithMembers, CreateUserGroupRequest, UpdateUserGroupRequest } from '../../api/userGroupsApi';
import { toast } from 'sonner@2.0.3';

// ============================================
// TYPES
// ============================================

interface UserGroupFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  group?: UserGroupWithMembers | null; // For edit mode
  availableTypes?: string[];
}

interface FormData {
  code: string;
  name: string;
  description: string;
  group_type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  order: string;
  metadataString: string;
}

// ============================================
// COMPONENT
// ============================================

export function UserGroupForm({
  open,
  onClose,
  onSuccess,
  tenantId,
  group,
  availableTypes = [],
}: UserGroupFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    group_type: '',
    status: 'ACTIVE',
    order: '0',
    metadataString: '{}',
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        code: group?.code || '',
        name: group?.name || '',
        description: group?.description || '',
        group_type: group?.group_type || '',
        status: group?.status || 'ACTIVE',
        order: group?.order?.toString() || '0',
        metadataString: JSON.stringify(group?.metadata || {}, null, 2),
      });
      setError('');
    }
  }, [open, group]);

  // Validate form
  const validate = (): boolean => {
    if (!formData.code.trim()) {
      setError('Mã code là bắt buộc');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Tên nhóm là bắt buộc');
      return false;
    }

    // Validate JSON
    try {
      const parsed = JSON.parse(formData.metadataString);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError('Metadata phải là JSON object');
        return false;
      }
    } catch (e) {
      setError('Metadata không đúng định dạng JSON');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const metadata = JSON.parse(formData.metadataString);
      const order = parseInt(formData.order) || 0;

      if (group) {
        // Update existing
        const updateData: UpdateUserGroupRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          group_type: formData.group_type || undefined,
          status: formData.status,
          order: order,
          metadata: metadata,
          version: group.version, // Required for optimistic locking
        };

        await userGroupsApi.update(group._id, updateData);
        toast.success('Đã cập nhật nhóm');
      } else {
        // Create new
        const createData: CreateUserGroupRequest = {
          tenant_id: tenantId,
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          group_type: formData.group_type || undefined,
          status: formData.status,
          order: order,
          metadata: metadata,
        };

        await userGroupsApi.create(createData);
        toast.success('Đã tạo nhóm mới');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user group:', error);
      setError(error.message || 'Không thể lưu nhóm');
      toast.error(error.message || 'Không thể lưu nhóm');
    } finally {
      setSubmitting(false);
    }
  };

  const getModalTitle = () => {
    return group ? 'Chỉnh sửa nhóm người dùng' : 'Tạo nhóm người dùng mới';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            Quản lý thông tin nhóm và phân quyền
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: project-alpha"
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên nhóm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Alpha Team"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Group Type */}
            <div className="space-y-2">
              <Label htmlFor="group_type">Loại nhóm</Label>
              <div className="relative">
                <Input
                  id="group_type"
                  value={formData.group_type}
                  onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                  placeholder="VD: PROJECT, TEAM..."
                  list="group-types-list"
                />
                <datalist id="group-types-list">
                  {availableTypes.map(type => (
                    <option key={type} value={type} />
                  ))}
                  <option value="PROJECT" />
                  <option value="DEPARTMENT" />
                  <option value="TEAM" />
                  <option value="ORG_UNIT" />
                  <option value="PERMISSION" />
                </datalist>
              </div>
              <p className="text-xs text-gray-500">Tự nhập hoặc chọn từ danh sách</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả mục đích của nhóm..."
              rows={3}
            />
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order">Thứ tự hiển thị</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              placeholder="0"
              min="0"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              value={formData.metadataString}
              onChange={(e) => setFormData({ ...formData, metadataString: e.target.value })}
              className="font-mono text-xs"
              rows={3}
              placeholder='{"permissions": ["read:all"]}'
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {group ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
