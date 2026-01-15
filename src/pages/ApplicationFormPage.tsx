/**
 * Application Form Page
 * Create/Edit application form
 * 
 * ✅ Production-ready with full validation
 * ✅ Connects to Supabase via applicationsApi
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

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    app_type: 'WEB' as 'WEB' | 'MOBILE' | 'API' | 'SERVICE',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'DEPRECATED',
    version: '1.0.0',
    is_public: false,
    metadata: {} as Record<string, any>,
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
        app_type: app.app_type,
        status: app.status,
        version: app.version,
        is_public: app.is_public,
        metadata: app.metadata || {},
      });
      setVersionNumber(app.version_number);
    } catch (error: any) {
      console.error('Error loading application:', error);
      toast.error(error.message || 'Không thể tải thông tin ứng dụng');
      navigate('/core/applications');
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
    if (!formData.version.trim()) {
      toast.error('Vui lòng nhập phiên bản');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        // Update existing
        const updateData: UpdateApplicationRequest = {
          ...formData,
          version_number: versionNumber,
        };
        await applicationsApi.update(id, updateData);
        toast.success('Cập nhật ứng dụng thành công');
      } else {
        // Create new
        const createData: CreateApplicationRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description,
          app_type: formData.app_type,
          version: formData.version,
          is_public: formData.is_public,
          metadata: formData.metadata,
        };
        await applicationsApi.create(createData);
        toast.success('Tạo ứng dụng mới thành công');
      }
      
      navigate('/core/applications');
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

              {/* App Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại ứng dụng <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.app_type}
                  onChange={(e) => handleInputChange('app_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="WEB">Web Application</option>
                  <option value="MOBILE">Mobile Application</option>
                  <option value="API">API Service</option>
                  <option value="SERVICE">Microservice</option>
                </select>
              </div>

              {/* Status */}
              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DEPRECATED">Deprecated</option>
                  </select>
                </div>
              )}

              {/* Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phiên bản <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="VD: 1.0.0, 2.1.3"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Theo chuẩn Semantic Versioning (major.minor.patch)
                </p>
              </div>

              {/* Is Public */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => handleInputChange('is_public', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
                  Ứng dụng công khai
                </label>
              </div>
              <p className="text-xs text-gray-500 -mt-4 ml-7">
                Cho phép truy cập công khai không cần xác thực
              </p>
            </CardContent>
          </Card>

          {/* Metadata (Optional - Advanced) */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Metadata (Tùy chọn)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON Metadata
                </label>
                <textarea
                  value={JSON.stringify(formData.metadata, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleInputChange('metadata', parsed);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Dữ liệu bổ sung dạng JSON (tùy chọn)
                </p>
              </div>
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
