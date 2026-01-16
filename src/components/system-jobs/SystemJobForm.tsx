/**
 * System Job Form Component
 * Form for creating and editing system jobs
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SystemJob, SystemJobCreateData, SystemJobUpdateData } from '../../api/systemJobsApi';
import { JOB_TYPES, JOB_PRIORITIES, SCHEDULE_TYPES } from '../../data/system-jobs-demo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';
import { toast } from 'sonner@2.0.3';

interface SystemJobFormProps {
  job?: SystemJob;
  onSubmit: (data: SystemJobCreateData | SystemJobUpdateData) => Promise<void>;
  isLoading?: boolean;
}

export const SystemJobForm: React.FC<SystemJobFormProps> = ({
  job,
  onSubmit,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEditMode = !!job;

  const [formData, setFormData] = useState<SystemJobCreateData>({
    job_name: job?.job_name || '',
    job_type: job?.job_type || '',
    description: job?.description || '',
    status: job?.status || 'pending',
    priority: job?.priority || 'normal',
    schedule_type: job?.schedule_type || 'manual',
    cron_expression: job?.cron_expression || '',
    next_run_at: job?.next_run_at || '',
    is_active: job?.is_active ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.job_name.trim()) {
      newErrors.job_name = t('systemJobs.errors.jobNameRequired');
    }

    if (!formData.job_type) {
      newErrors.job_type = t('systemJobs.errors.jobTypeRequired');
    }

    if (formData.schedule_type === 'scheduled' && !formData.cron_expression?.trim()) {
      newErrors.cron_expression = t('systemJobs.errors.cronExpressionRequired');
    }

    // Basic cron expression validation (5 or 6 fields)
    if (formData.cron_expression?.trim()) {
      const cronParts = formData.cron_expression.trim().split(/\s+/);
      if (cronParts.length < 5 || cronParts.length > 6) {
        newErrors.cron_expression = t('systemJobs.errors.cronExpressionInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('common.error'), {
        description: t('common.error'),
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleChange = (field: keyof SystemJobCreateData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user makes a change
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {t('tenants.basicInformation')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="job_name">
              {t('systemJobs.jobName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="job_name"
              value={formData.job_name}
              onChange={(e) => handleChange('job_name', e.target.value)}
              placeholder={t('systemJobs.jobNamePlaceholder')}
              className={errors.job_name ? 'border-red-500' : ''}
            />
            {errors.job_name && (
              <p className="text-sm text-red-500">{errors.job_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_type">
              {t('systemJobs.jobType')} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.job_type}
              onValueChange={(value) => handleChange('job_type', value)}
            >
              <SelectTrigger className={errors.job_type ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(`systemJobs.jobTypes.${type.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.job_type && (
              <p className="text-sm text-red-500">{errors.job_type}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">{t('systemJobs.description')}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('systemJobs.descriptionPlaceholder')}
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Status & Priority */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {t('systemJobs.status')} & {t('systemJobs.priority')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">{t('systemJobs.priority')}</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {t(`systemJobs.priorityValues.${priority.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('systemJobs.status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  {t('systemJobs.statusValues.pending')}
                </SelectItem>
                <SelectItem value="paused">
                  {t('systemJobs.statusValues.paused')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex items-center gap-3 pt-8">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              {t('systemJobs.isActive')}
            </Label>
          </div>
        </div>
      </Card>

      {/* Schedule Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {t('systemJobs.scheduleType')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="schedule_type">{t('systemJobs.scheduleType')}</Label>
            <Select
              value={formData.schedule_type}
              onValueChange={(value) => handleChange('schedule_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(`systemJobs.scheduleTypes.${type.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.schedule_type === 'scheduled' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cron_expression">
                  {t('systemJobs.cronExpression')}{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cron_expression"
                  value={formData.cron_expression || ''}
                  onChange={(e) => handleChange('cron_expression', e.target.value)}
                  placeholder={t('systemJobs.cronExpressionPlaceholder')}
                  className={errors.cron_expression ? 'border-red-500' : ''}
                />
                {errors.cron_expression && (
                  <p className="text-sm text-red-500">{errors.cron_expression}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Format: minute hour day month weekday
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_run_at">{t('systemJobs.nextRunAt')}</Label>
                <Input
                  id="next_run_at"
                  type="datetime-local"
                  value={
                    formData.next_run_at
                      ? new Date(formData.next_run_at).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    handleChange(
                      'next_run_at',
                      e.target.value ? new Date(e.target.value).toISOString() : ''
                    )
                  }
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/core/system-jobs')}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
};