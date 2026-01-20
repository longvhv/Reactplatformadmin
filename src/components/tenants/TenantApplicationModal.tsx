import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  tenantApplicationsApi, 
  CreateTenantApplicationRequest,
  LicenseType,
  getLicenseTypeLabel
} from '@/api/tenantApplicationsApi';
import { applicationsApi, Application } from '@/api/applicationsApi';
import { toast } from 'sonner@2.0.3';
import { Package, Calendar, Users, AlertCircle } from 'lucide-react';

interface TenantApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

export function TenantApplicationModal({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
}: TenantApplicationModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [availableApps, setAvailableApps] = useState<Application[]>([]);
  
  const [formData, setFormData] = useState<CreateTenantApplicationRequest>({
    tenant_id: tenantId,
    app_code: '',
    is_active: true,
    license_type: 'BASIC',
    max_users: 10,
    expires_at: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadApplications();
      // Reset form
      setFormData({
        tenant_id: tenantId,
        app_code: '',
        is_active: true,
        license_type: 'BASIC',
        max_users: 10,
        expires_at: '',
      });
      setErrors({});
    }
  }, [isOpen, tenantId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      // Fetch all system applications
      const allApps = await applicationsApi.getAll({ is_active: true });
      setApplications(allApps);
      
      // Fetch already assigned applications to filter them out
      const assignedApps = await tenantApplicationsApi.getAll({ tenant_id: tenantId });
      const assignedAppCodes = new Set(assignedApps.map(app => app.app_code));
      
      const available = allApps.filter(app => !assignedAppCodes.has(app.code));
      setAvailableApps(available);
      
      if (available.length > 0) {
        setFormData(prev => ({ ...prev, app_code: available[0].code }));
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast.error('Không thể tải danh sách ứng dụng hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.app_code) {
      newErrors.app_code = 'Vui lòng chọn ứng dụng';
    }
    
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
        expires_at: formData.expires_at || undefined
      };
      
      await tenantApplicationsApi.create(submissionData);
      toast.success('Đã thêm ứng dụng thành công');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create tenant application:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi thêm ứng dụng');
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLicenseTypeChange = (value: LicenseType) => {
    // Set default values based on license type
    let defaultMaxUsers = 10;
    if (value === 'TRIAL') defaultMaxUsers = 5;
    if (value === 'PREMIUM') defaultMaxUsers = 50;
    if (value === 'ENTERPRISE') defaultMaxUsers = 1000;
    
    setFormData(prev => ({
      ...prev,
      license_type: value,
      max_users: defaultMaxUsers
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Ứng Dụng vào Tenant</DialogTitle>
          <DialogDescription>
            Chọn ứng dụng và cấu hình các thông số để thêm vào tenant của bạn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Application Selection */}
          <div className="space-y-2">
            <Label htmlFor="app_code">Chọn ứng dụng</Label>
            {loading ? (
              <div className="h-10 w-full bg-gray-100 animate-pulse rounded-md" />
            ) : availableApps.length === 0 ? (
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm flex items-start gap-2 border border-yellow-200">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Tất cả ứng dụng hệ thống đã được gán cho tenant này, hoặc chưa có ứng dụng nào trong hệ thống.
                </p>
              </div>
            ) : (
              <Select
                value={formData.app_code}
                onValueChange={(value) => setFormData({ ...formData, app_code: value })}
              >
                <SelectTrigger id="app_code">
                  <SelectValue placeholder="Chọn ứng dụng" />
                </SelectTrigger>
                <SelectContent>
                  {availableApps.map((app) => (
                    <SelectItem key={app.code} value={app.code}>
                      <div className="flex items-center gap-2">
                        {app.icon_url ? (
                          <img src={app.icon_url} alt="" className="w-4 h-4 object-contain" />
                        ) : (
                          <Package className="w-4 h-4 text-gray-500" />
                        )}
                        <span>{app.name}</span>
                        <span className="text-xs text-gray-400 ml-1">({app.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.app_code && <p className="text-sm text-red-500">{errors.app_code}</p>}
          </div>

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
            <Label htmlFor="is_active" className="cursor-pointer">Kích hoạt ngay sau khi tạo</Label>
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
            disabled={submitting || loading || availableApps.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? 'Đang thêm...' : 'Thêm ứng dụng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}