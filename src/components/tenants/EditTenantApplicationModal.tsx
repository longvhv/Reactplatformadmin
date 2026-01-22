import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { 
  tenantApplicationsApi, 
  UpdateTenantApplicationRequest,
  LicenseType,
  TenantApplication
} from '../../api/tenantApplicationsApi';
import { toast } from 'sonner@2.0.3';
import { Calendar, Users } from 'lucide-react';

interface EditTenantApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  application: TenantApplication;
}

export function EditTenantApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  application,
}: EditTenantApplicationModalProps) {
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<UpdateTenantApplicationRequest>({
    is_active: true,
    license_type: 'BASIC',
    max_users: 10,
    expires_at: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && application) {
      setFormData({
        is_active: application.is_active,
        license_type: application.license_type,
        max_users: application.max_users,
        expires_at: application.expires_at || '',
      });
      setErrors({});
    }
  }, [isOpen, application]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.max_users || formData.max_users <= 0) {
      newErrors.max_users = 'Số lượng user tối đa phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      // Format expires_at or set to null if empty
      const submissionData = {
        ...formData,
        expires_at: formData.expires_at || undefined,
        version: application.version // Optimistic locking
      };
      
      await tenantApplicationsApi.update(application._id, submissionData);
      toast.success('Đã cập nhật ứng dụng thành công');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update tenant application:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật ứng dụng');
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLicenseTypeChange = (value: LicenseType) => {
    // Optionally update defaults, or let user keep current settings when changing type?
    // Let's keep current behavior simple: just change type
    setFormData(prev => ({
      ...prev,
      license_type: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh Sửa Ứng Dụng</DialogTitle>
          <DialogDescription>
            Cập nhật cấu hình cho ứng dụng <span className="font-semibold text-indigo-600">{application.app_code}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* License Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license_type">Loại License</Label>
              <Select
                value={formData.license_type}
                onValueChange={(value) => handleLicenseTypeChange(value as LicenseType)}
              >
                <SelectTrigger id="license_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAL">Dùng thử (Trial)</SelectItem>
                  <SelectItem value="BASIC">Cơ bản (Basic)</SelectItem>
                  <SelectItem value="PREMIUM">Cao cấp (Premium)</SelectItem>
                  <SelectItem value="ENTERPRISE">Doanh nghiệp (Enterprise)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_users">Max Users</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="max_users"
                  type="number"
                  min="1"
                  className="pl-9"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 0 })}
                />
              </div>
              {errors.max_users && <p className="text-sm text-red-500">{errors.max_users}</p>}
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expires_at">Ngày hết hạn (Tùy chọn)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="expires_at"
                type="date"
                className="pl-9 block w-full"
                value={formData.expires_at ? new Date(formData.expires_at).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">Để trống nếu muốn sử dụng vĩnh viễn</p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Đang hoạt động</Label>
          </div>

          {/* Audit Info (Read Only) */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-2 border-t">
            <div>
              <span className="font-medium">Tạo lúc:</span>{' '}
              {application.created_at ? new Date(application.created_at).toLocaleString('vi-VN') : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Cập nhật:</span>{' '}
              {application.updated_at ? new Date(application.updated_at).toLocaleString('vi-VN') : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Version:</span> {application.version}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {errors.submit}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}