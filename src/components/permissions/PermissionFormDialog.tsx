/**
 * Permission Form Dialog
 * Form tạo/sửa permission với validation
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Permission {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  is_group: boolean;
  parent_code?: string | null;
  app_code: string;
  version?: number;
}

interface PermissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission | null;
  appCode: string;
  parentCode?: string | null;
  availableParents: Array<{ code: string; name: string }>;
  onSubmit: (data: Permission) => Promise<void>;
}

export function PermissionFormDialog({
  open,
  onOpenChange,
  permission,
  appCode,
  parentCode,
  availableParents,
  onSubmit,
}: PermissionFormDialogProps) {
  const [formData, setFormData] = useState<Permission>({
    code: '',
    name: '',
    description: '',
    is_group: false,
    parent_code: null,
    app_code: appCode,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permission) {
      setFormData({
        ...permission,
        app_code: appCode,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        is_group: false,
        parent_code: parentCode || null,
        app_code: appCode,
      });
    }
  }, [permission, appCode, parentCode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {permission ? 'Chỉnh sửa Permission' : 'Tạo Permission mới'}
            </DialogTitle>
            <DialogDescription>
              {permission 
                ? 'Cập nhật thông tin permission' 
                : 'Thêm permission mới vào hệ thống'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã Permission <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: hrm_recruit:employees:view"
                disabled={!!permission}
                required
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Mã định danh duy nhất (không thể thay đổi sau khi tạo)
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên hiển thị <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Xem danh sách nhân viên"
                required
              />
            </div>

            {/* Parent */}
            <div className="space-y-2">
              <Label htmlFor="parent_code">Permission cha</Label>
              <Select
                value={formData.parent_code || 'none'}
                onValueChange={(value) => 
                  setFormData({ 
                    ...formData, 
                    parent_code: value === 'none' ? null : value 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn permission cha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có (Root level)</SelectItem>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.code} value={parent.code}>
                      {parent.name} ({parent.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Is Group */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_group">Là thư mục phân nhóm</Label>
                <p className="text-xs text-gray-500">
                  Thư mục chỉ dùng để nhóm các quyền con
                </p>
              </div>
              <Switch
                id="is_group"
                checked={formData.is_group}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_group: checked })
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về quyền này..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {permission ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
