/**
 * Edit System Job Page
 * Edit an existing system job
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  systemJobsApi,
  SystemJob,
  SystemJobUpdateData,
} from '../api/systemJobsApi';
import { SystemJobForm } from '../components/system-jobs/SystemJobForm';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { toast } from 'sonner@2.0.3';

export default function EditSystemJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<SystemJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await systemJobsApi.getById(id);
        if (data) {
          setJob(data);
        } else {
          toast.error(t('systemJobs.notFound'));
          navigate('/core/system-jobs');
        }
      } catch (error) {
        console.error('Error loading job:', error);
        toast.error(t('systemJobs.fetchError'));
        navigate('/core/system-jobs');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  const handleSubmit = async (data: SystemJobUpdateData) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      await systemJobsApi.update(id, data);
      toast.success(t('systemJobs.updateSuccess'));
      navigate('/core/system-jobs');
    } catch (error) {
      console.error('Error updating system job:', error);
      toast.error(t('systemJobs.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/core/system-jobs')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('systemJobs.edit')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('systemJobs.editJobDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <SystemJobForm job={job} onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}