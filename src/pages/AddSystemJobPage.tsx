/**
 * Add System Job Page
 * Create a new system background job
 * 
 * ✅ FIXED 2026-01-18: Use EnhancedSystemJobForm
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Settings } from 'lucide-react';
import { systemJobsApi, CreateJobRequest } from '../api/systemJobsApi';
import { EnhancedSystemJobForm } from '../components/system-jobs/EnhancedSystemJobForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function AddSystemJobPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateJobRequest | any) => {
    setLoading(true);
    try {
      await systemJobsApi.create(data);
      showToast.success('Thành công', 'Đã tạo công việc hệ thống mới');
      navigate('/platform/system-jobs');
    } catch (error: any) {
      console.error('Error creating system job:', error);
      showToast.error('Lỗi', 'Không thể tạo công việc: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm công việc hệ thống"
      description="Tạo và cấu hình các tác vụ chạy ngầm của hệ thống"
      icon={Settings}
      backPath="/platform/system-jobs"
      backLabel="Quay lại danh sách"
    >
      <EnhancedSystemJobForm 
        onSubmit={handleSubmit} 
        loading={loading}
        onCancel={() => navigate('/platform/system-jobs')}
      />
    </FormPageLayout>
  );
}
