/**
 * Add System Job Page
 * Create a new system job
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { systemJobsApi, SystemJobCreateData } from '../api/systemJobsApi';
import { SystemJobForm } from '../components/system-jobs/SystemJobForm';
import { Button } from '../components/ui/button';
import { toast } from 'sonner@2.0.3';

export default function AddSystemJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: SystemJobCreateData) => {
    setIsLoading(true);
    try {
      await systemJobsApi.create(data);
      toast.success(t('systemJobs.createSuccess'));
      navigate('/core/system-jobs');
    } catch (error) {
      console.error('Error creating system job:', error);
      toast.error(t('systemJobs.createError'));
    } finally {
      setIsLoading(false);
    }
  };

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
            {t('systemJobs.add')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('systemJobs.addJobDescription')}
          </p>
        </div>
      </div>

      {/* Form */}
      <SystemJobForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}