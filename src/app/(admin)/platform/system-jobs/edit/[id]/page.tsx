/**
 * Edit System Job Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { EnhancedSystemJobForm } from '../../../../../../components/system-jobs/EnhancedSystemJobForm';
import { useSystemJob, useSystemJobs } from '../../../../../../hooks/useSystemJobs';
import { UpdateJobRequest } from '../../../../../../api/systemJobsApi';
import { showToast } from '../../../../../../lib/toast';
import { FormPageLayout } from '../../../../../../components/layouts/FormPageLayout';
import { Settings, Loader2 } from 'lucide-react';

export default function EditSystemJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const { job, loading: fetching } = useSystemJob(id);
  const { updateJob } = useSystemJobs({ autoLoad: false });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await updateJob(id, data as UpdateJobRequest);
      showToast.success('Thành công', 'Đã cập nhật công việc');
      router.push('/platform/system-jobs');
    } catch (error: any) {
      console.error('Failed to update job:', error);
      showToast.error('Lỗi', error.message || 'Không thể cập nhật công việc');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!job) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen gap-4">
         <p className="text-gray-500">Không tìm thấy công việc</p>
         <button onClick={() => router.push('/platform/system-jobs')} className="text-indigo-600 hover:underline">
           Quay lại danh sách
         </button>
       </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa công việc"
      description={`Cập nhật thông tin cho công việc: ${job.job_name}`}
      icon={Settings}
      backPath="/platform/system-jobs"
      backLabel="Quay lại danh sách"
    >
      <EnhancedSystemJobForm
        initialData={job}
        isEdit={true}
        onSubmit={handleSubmit}
        loading={submitting}
        onCancel={() => router.push('/platform/system-jobs')}
      />
    </FormPageLayout>
  );
}