/**
 * Department Form Component
 * Create/Edit department with validation and manager selection
 */

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { departmentsApi, DepartmentTreeNode, CreateDepartmentRequest, UpdateDepartmentRequest } from '../../api/departmentsApi';
import { tenantMembersApi, TenantMember } from '../../api/tenantMembersApi';
import { toast } from 'sonner@2.0.3';

// ============================================
// TYPES
// ============================================

interface DepartmentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  department?: DepartmentTreeNode | null; // For edit mode
  parentDepartment?: DepartmentTreeNode | null; // For create child mode
}

interface FormData {
  code: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  order: string;
  manager_id: string;
  metadataString: string;
}

// ============================================
// COMPONENT
// ============================================

export function DepartmentForm({
  open,
  onClose,
  onSuccess,
  tenantId,
  department,
  parentDepartment,
}: DepartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE',
    order: '0',
    manager_id: 'none',
    metadataString: '{}',
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        code: department?.code || '',
        name: department?.name || '',
        description: department?.description || '',
        status: department?.status || 'ACTIVE',
        order: department?.order?.toString() || '0',
        manager_id: department?.manager_id || 'none',
        metadataString: JSON.stringify(department?.metadata || {}, null, 2),
      });
      setError('');
      loadMembers();
    }
  }, [open, department]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await tenantMembersApi.getByTenant(tenantId);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members:', err);
      // Don't block form usage, just won't be able to select manager
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validate = (): boolean => {
    if (!formData.code.trim()) {
      setError('Mã code là bắt buộc');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Tên phòng ban là bắt buộc');
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
      const managerId = formData.manager_id === 'none' ? undefined : formData.manager_id;
      const order = parseInt(formData.order) || 0;

      if (department) {
        // Update existing
        const updateData: UpdateDepartmentRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
          order: order,
          manager_id: managerId, // Update manager
          metadata: metadata,
          version: department.version,
        };
        
        // Handle removing manager if explicitly set to none
        if (formData.manager_id === 'none' && department.manager_id) {
           // The API update handles undefined as "no change" usually, but here we want to clear it.
           // However, departmentsApi.update helper `assignManager` or `removeManager` exists.
           // But the adapter `update` usually takes the partial object. 
           // If the backend implementation of PATCH respects null/empty for clearing, 
           // we need to check how `adapter.update` handles it. 
           // In `departmentsApi.ts`:
           // assignManager uses { manager_id: id }
           // removeManager uses { manager_id: undefined }
           // If we pass undefined to `updateData.manager_id`, JSON.stringify might drop it.
           // So `manager_id` needs to be explicit null or handled.
           // Let's rely on the fact that if it changed, we send it.
           // If the backend uses Go zero values, string pointer is better.
           // For now, assuming the API client handles `undefined` correctly (or we might need a specific `removeManager` call if it fails).
           // Actually, `departmentsApi.removeManager` sets it to `undefined`? No, Typescript `undefined` usually means "do not update".
           // To clear it, we might need to send `null` but the type is `string | undefined`.
           // Let's assume the backend handles an empty string or specific clear command.
           // Or we use `departmentsApi.removeManager` if manager_id is 'none'.
           // Let's stick to standard update. If it fails to clear, we'll fix later.
           // FIX: If manager_id is 'none', we should probably send `null` casted to string if the API supports it, or use the dedicated endpoint.
           // Ideally, the Clean Architecture UpdateRequest struct has *string for nullable fields.
        }

        await departmentsApi.update(department._id, updateData);
        
        // Special case: If manager is removed, we might need to call removeManager explicitly if standard update ignores undefined
        if (department.manager_id && formData.manager_id === 'none') {
             await departmentsApi.removeManager(department._id);
        }

        toast.success('Đã cập nhật phòng ban');
      } else {
        // Create new
        const createData: CreateDepartmentRequest = {
          tenant_id: tenantId,
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          parent_department_id: parentDepartment?._id,
          status: formData.status,
          order: order,
          manager_id: managerId,
          metadata: metadata,
        };

        await departmentsApi.create(createData);
        toast.success('Đã tạo phòng ban mới');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving department:', error);
      setError(error.message || 'Không thể lưu phòng ban');
      toast.error(error.message || 'Không thể lưu phòng ban');
    } finally {
      setSubmitting(false);
    }
  };

  const getModalTitle = () => {
    if (department) return 'Chỉnh sửa phòng ban';
    if (parentDepartment) return 'Thêm phòng ban con';
    return 'Tạo phòng ban mới';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            {parentDepartment ? (
              <span>Phòng ban cha: <span className="font-semibold">{parentDepartment.name}</span></span>
            ) : (
              'Thông tin phòng ban'
            )}
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
                placeholder="VD: ENG"
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên phòng ban <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Engineering"
                required
              />
            </div>
          </div>

          {/* Manager */}
          <div className="space-y-2">
            <Label htmlFor="manager">Trưởng phòng</Label>
            <Select 
              value={formData.manager_id} 
              onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Đang tải..." : "Chọn trưởng phòng"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Không có --</SelectItem>
                {members.map(member => (
                  <SelectItem key={member._id} value={member._id}>
                    {member.user_name || member.user_email || 'Unknown User'} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả phòng ban..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              placeholder='{"cost_center": "CC-123"}'
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
              {department ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
