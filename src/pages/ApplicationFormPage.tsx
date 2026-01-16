/**
 * Application Form Page
 * Create/Edit application form
 * 
 * ✅ Production-ready with full validation
 * ✅ Connects to Supabase via applicationsApi
 * ✅ FIXED 2026-01-15: Schema compliant - only use fields from database
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, X } from 'lucide-react';
import { applicationsApi, CreateApplicationRequest, UpdateApplicationRequest } from '../api/applicationsApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../providers/LanguageProvider';
import { toast } from 'sonner@2.0.3';

export function ApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isEdit = id && id !== 'new';

  // Form state - Only schema-compliant fields
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
  });
  const [versionNumber, setVersionNumber] = useState(1);

  // Load existing application if editing
  useEffect(() => {
    if (isEdit) {
      loadApplication();
    }
  }, [isEdit, id]);

  const loadApplication = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const app = await applicationsApi.getById(id);
      setFormData({
        code: app.code,
        name: app.name,
        description: app.description || '',
        is_active: app.is_active,
      });
      setVersionNumber(app.version);
    } catch (error: any) {
      console.error('Error loading application:', error);
      toast.error(error.message || 'Không thể tải thông tin ứng dụng');
      navigate('/core/applications', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã ứng dụng');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên ứng dụng');
      return;
    }

    // Validate code format (UPPERCASE_SNAKE_CASE)
    if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      toast.error('Mã ứng dụng phải là chữ hoa, số và gạch dưới (VD: TENANT_MGMT)');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        // Update existing
        const updateData: UpdateApplicationRequest = {
          name: formData.name,
          description: formData.description || undefined,
          is_active: formData.is_active,
          version: versionNumber,
        };
        await applicationsApi.update(id, updateData);
        toast.success('Cập nhật ứng dụng thành công');
      } else {
        // Create new
        const createData: CreateApplicationRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          is_active: formData.is_active,
        };
        await applicationsApi.create(createData);
        toast.success('Tạo ứng dụng mới thành công');
      }
      
      navigate('/core/applications', { replace: true });
    } catch (error: any) {
      console.error('Error saving application:', error);
      toast.error(error.message || 'Lỗi khi lưu ứng dụng');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/core/applications')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEdit ? 'Chỉnh sửa ứng dụng' : 'Thêm ứng dụng mới'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isEdit ? 'Cập nhật thông tin ứng dụng' : 'Tạo ứng dụng mới trong hệ thống'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã ứng dụng <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="VD: TENANT_MGMT, BILLING_SYS"
                  disabled={isEdit}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mã duy nhất, chữ hoa, không dấu, có thể dùng gạch dưới
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên ứng dụng <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="VD: Tenant Management System"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết về ứng dụng..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Kích hoạt ứng dụng
                </label>
              </div>
              <p className="text-xs text-gray-500 -mt-4 ml-7">
                Ứng dụng chỉ hoạt động khi được kích hoạt
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/core/applications')}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Cập nhật' : 'Tạo mới'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplicationFormPage;