/**
 * Create System Job Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { EnhancedSystemJobForm } from '@/components/system-jobs/EnhancedSystemJobForm';
import { useSystemJobs } from '@/hooks/useSystemJobs';
import { CreateJobRequest } from '@/api/systemJobsApi';
import { showToast } from '@/lib/toast';
import { FormPageLayout } from '@/components/layouts/FormPageLayout';
import { Settings } from 'lucide-react';

export default function CreateSystemJobPage() {
  const router = useRouter();
  const { createJob } = useSystemJobs({ autoLoad: false });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await createJob(data as CreateJobRequest);
      showToast.success('Thành công', 'Đã tạo công việc mới');
      router.push('/platform/system-jobs');
    } catch (error: any) {
      console.error('Failed to create job:', error);
      showToast.error('Lỗi', error.message || 'Không thể tạo công việc');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo công việc hệ thống"
      description="Thiết lập công việc mới cho hệ thống"
      icon={Settings}
      backPath="/platform/system-jobs"
      backLabel="Quay lại danh sách"
    >
      <EnhancedSystemJobForm
        onSubmit={handleSubmit}
        loading={submitting}
        onCancel={() => router.push('/platform/system-jobs')}
      />
    </FormPageLayout>
  );
}
