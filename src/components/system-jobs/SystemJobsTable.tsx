/**
 * System Jobs Table Component
 * Display and manage system jobs in a table format
 */

import React, { useState } from 'react';
import { useTranslation } from '../../providers/LanguageProvider'; // ✅ FIX: Use custom implementation
import { useNavigate } from 'react-router'; // ✅ FIX: Use react-router not react-router-dom
import { Play, Pause, RotateCw, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { SystemJob } from '../../api/systemJobsApi';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface SystemJobsTableProps {
  jobs: SystemJob[];
  loading?: boolean;
  onExecute?: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SystemJobsTable: React.FC<SystemJobsTableProps> = ({
  jobs,
  loading = false,
  onExecute,
  onPause,
  onResume,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'normal':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('systemJobs.jobName')}</TableHead>
              <TableHead>{t('systemJobs.jobType')}</TableHead>
              <TableHead>{t('systemJobs.status')}</TableHead>
              <TableHead>{t('systemJobs.priority')}</TableHead>
              <TableHead>{t('systemJobs.lastRunAt')}</TableHead>
              <TableHead>{t('systemJobs.nextRunAt')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="h-8 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t('systemJobs.noJobs')}</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {t('systemJobs.noJobsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('systemJobs.jobName')}</TableHead>
            <TableHead>{t('systemJobs.jobType')}</TableHead>
            <TableHead>{t('systemJobs.status')}</TableHead>
            <TableHead>{t('systemJobs.priority')}</TableHead>
            <TableHead>{t('systemJobs.lastRunAt')}</TableHead>
            <TableHead>{t('systemJobs.nextRunAt')}</TableHead>
            <TableHead className="w-[100px] text-right">{t('common.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => navigate(`/platform/system-jobs/${job.id}`)}
            >
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {job.job_name}
                  </div>
                  {job.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {job.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t(`systemJobs.jobTypes.${job.job_type}`) || job.job_type}
                </span>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(job.status)}>
                  {t(`systemJobs.statusValues.${job.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={`text-sm font-medium ${getPriorityColor(job.priority)}`}>
                  {t(`systemJobs.priorityValues.${job.priority}`)}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="text-gray-900 dark:text-gray-100">
                    {formatDateTime(job.last_run_at)}
                  </div>
                  {job.last_run_duration && (
                    <div className="text-gray-500 dark:text-gray-400">
                      {formatDuration(job.last_run_duration)}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDateTime(job.next_run_at)}
                </span>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/platform/system-jobs/${job.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t('common.viewDetails')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(`/platform/system-jobs/${job.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {job.status === 'paused' ? (
                      <DropdownMenuItem onClick={() => onResume?.(job.id)}>
                        <Play className="mr-2 h-4 w-4" />
                        {t('systemJobs.resume')}
                      </DropdownMenuItem>
                    ) : job.status === 'running' ? (
                      <DropdownMenuItem onClick={() => onPause?.(job.id)}>
                        <Pause className="mr-2 h-4 w-4" />
                        {t('systemJobs.pause')}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onExecute?.(job.id)}>
                        <Play className="mr-2 h-4 w-4" />
                        {t('systemJobs.execute')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(job.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};