/**
 * Edit System Job Page
 * Page for editing an existing system job
 * 
 * ✅ FIXED 2026-01-18: Use EnhancedSystemJobForm
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Settings } from 'lucide-react';
import { systemJobsApi, SystemJob } from '../api/systemJobsApi';
import { EnhancedSystemJobForm } from '../components/system-jobs/EnhancedSystemJobForm';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { showToast } from '@/lib/toast';

export default function EditSystemJobPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<SystemJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await systemJobsApi.getById(id);
        if (data) {
          setJob(data);
        } else {
          showToast.error('Lỗi', 'Không tìm thấy công việc hệ thống');
          navigate('/platform/system-jobs');
        }
      } catch (error: any) {
        console.error('Error fetching system job:', error);
        showToast.error('Lỗi', 'Không thể tải thông tin công việc: ' + error.message);
        navigate('/platform/system-jobs');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    setSaving(true);
    try {
      await systemJobsApi.update(id!, data);
      showToast.success('Thành công', 'Đã cập nhật công việc hệ thống');
      navigate('/platform/system-jobs');
    } catch (error: any) {
      console.error('Error updating system job:', error);
      showToast.error('Lỗi', 'Không thể cập nhật công việc: ' + error.message);
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

  if (!job) return null;

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa công việc"
      description={`Cập nhật cấu hình cho ${job.job_name}`}
      icon={Settings}
      backPath="/platform/system-jobs"
      backLabel="Quay lại danh sách"
    >
      <EnhancedSystemJobForm 
        initialData={job}
        isEdit={true}
        onSubmit={handleSubmit} 
        loading={saving}
        onCancel={() => navigate('/platform/system-jobs')}
      />
    </FormPageLayout>
  );
}
