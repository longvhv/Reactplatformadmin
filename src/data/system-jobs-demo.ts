/**
 * System Jobs Demo Data
 */

export interface SystemJob {
  id: string;
  job_name: string;
  job_type: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'normal' | 'high' | 'critical';
  schedule_type?: 'manual' | 'scheduled' | 'triggered';
  cron_expression?: string;
  last_run_at?: string;
  next_run_at?: string;
  last_run_duration?: number;
  last_run_status?: string;
  last_run_error?: string;
  run_count: number;
  success_count: number;
  failure_count: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const JOB_TYPES = [
  { value: 'backup', label: 'Backup' },
  { value: 'cleanup', label: 'Cleanup' },
  { value: 'report', label: 'Report' },
  { value: 'sync', label: 'Sync' },
  { value: 'notification', label: 'Notification' },
  { value: 'archive', label: 'Archive' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'indexing', label: 'Indexing' },
  { value: 'payment', label: 'Payment' },
  { value: 'billing', label: 'Billing' },
  { value: 'security', label: 'Security' },
  { value: 'optimization', label: 'Optimization' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'validation', label: 'Validation' },
  { value: 'api', label: 'API' },
] as const;

export const JOB_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'running', label: 'Running', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800' },
  { value: 'paused', label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
] as const;

export const JOB_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' },
] as const;

export const SCHEDULE_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'triggered', label: 'Triggered' },
] as const;
