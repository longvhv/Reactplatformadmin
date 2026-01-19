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
import { AppWindow } from 'lucide-react';
import { applicationsApi, CreateApplicationRequest, UpdateApplicationRequest } from '../api/applicationsApi';
import { useLanguage } from '../providers/LanguageProvider';
import { showToast } from '@/lib/toast';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { EnhancedApplicationForm } from '@/components/applications/EnhancedApplicationForm';

export function ApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
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
      setInitialData({
        code: app.code,
        name: app.name,
        description: app.description || '',
        is_active: app.is_active,
      });
      setVersionNumber(app.version);
    } catch (error: any) {
      console.error('Error loading application:', error);
      showToast.error('Lỗi', error.message || 'Không thể tải thông tin ứng dụng');
      navigate('/platform/applications', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
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
        showToast.success('Thành công', 'Cập nhật ứng dụng thành công');
      } else {
        // Create new
        const createData: CreateApplicationRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description || undefined,
          is_active: formData.is_active,
        };
        await applicationsApi.create(createData);
        showToast.success('Thành công', 'Tạo ứng dụng mới thành công');
      }
      
      navigate('/platform/applications', { replace: true });
    } catch (error: any) {
      console.error('Error saving application:', error);
      showToast.error('Lỗi', error.message || 'Lỗi khi lưu ứng dụng');
    } finally {
      setSaving(false);
    }
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
    <FormPageLayout
      mode={isEdit ? 'edit' : 'add'}
      title={isEdit ? 'Chỉnh sửa ứng dụng' : 'Thêm ứng dụng mới'}
      description={isEdit ? 'Cập nhật thông tin ứng dụng' : 'Tạo ứng dụng mới trong hệ thống'}
      icon={AppWindow}
      backPath="/platform/applications"
      backLabel="Quay lại danh sách"
    >
      <EnhancedApplicationForm
        initialData={initialData}
        isEdit={!!isEdit}
        onSubmit={handleSubmit}
        loading={saving}
      />
    </FormPageLayout>
  );
}

export default ApplicationFormPage;
