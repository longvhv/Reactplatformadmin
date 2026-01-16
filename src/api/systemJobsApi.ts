/**
 * System Jobs API Client
 * Uses Adapter pattern - Ready for Golang migration
 * Manages background jobs, scheduled tasks, and job execution
 */

import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPES ====================

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';
export type ScheduleType = 'manual' | 'scheduled' | 'triggered' | 'recurring';

export const JobStatusHelper = {
  PENDING: 'pending' as JobStatus,
  RUNNING: 'running' as JobStatus,
  COMPLETED: 'completed' as JobStatus,
  FAILED: 'failed' as JobStatus,
  PAUSED: 'paused' as JobStatus,
  CANCELLED: 'cancelled' as JobStatus,
  
  isPending: (status: JobStatus) => status === 'pending',
  isRunning: (status: JobStatus) => status === 'running',
  isCompleted: (status: JobStatus) => status === 'completed',
  isFailed: (status: JobStatus) => status === 'failed',
  isPaused: (status: JobStatus) => status === 'paused',
  isCancelled: (status: JobStatus) => status === 'cancelled',
  isFinished: (status: JobStatus) => status === 'completed' || status === 'failed' || status === 'cancelled',
};

export const JobPriorityHelper = {
  LOW: 'low' as JobPriority,
  NORMAL: 'normal' as JobPriority,
  HIGH: 'high' as JobPriority,
  CRITICAL: 'critical' as JobPriority,
  
  getValue: (priority: JobPriority): number => {
    const values: Record<JobPriority, number> = {
      low: 1,
      normal: 2,
      high: 3,
      critical: 4,
    };
    return values[priority];
  },
};

// ==================== MAIN INTERFACE ====================

export interface SystemJob {
  // I. IDENTITY
  id: string;
  job_name: string;
  job_type: string;
  description: string | null;

  // II. STATUS & PRIORITY
  status: JobStatus;
  priority: JobPriority;

  // III. SCHEDULING
  schedule_type: ScheduleType | null;
  cron_expression: string | null;
  next_run_at: string | null;

  // IV. EXECUTION TRACKING
  last_run_at: string | null;
  last_run_duration: number | null; // in milliseconds
  last_run_status: string | null;
  last_run_error: string | null;

  // V. STATISTICS
  run_count: number;
  success_count: number;
  failure_count: number;

  // VI. CONTROL
  is_active: boolean;

  // VII. AUDIT TRAIL
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== REQUEST INTERFACES ====================

export interface CreateJobRequest {
  // Required
  job_name: string;
  job_type: string;

  // Optional with defaults
  status?: JobStatus; // default: 'pending'
  priority?: JobPriority; // default: 'normal'
  is_active?: boolean; // default: true
  run_count?: number; // default: 0
  success_count?: number; // default: 0
  failure_count?: number; // default: 0

  // Optional
  description?: string;
  schedule_type?: ScheduleType;
  cron_expression?: string;
  next_run_at?: string;
  created_by?: string;
}

export interface UpdateJobRequest {
  job_name?: string;
  job_type?: string;
  description?: string | null;
  status?: JobStatus;
  priority?: JobPriority;
  schedule_type?: ScheduleType | null;
  cron_expression?: string | null;
  next_run_at?: string | null;
  last_run_at?: string | null;
  last_run_duration?: number | null;
  last_run_status?: string | null;
  last_run_error?: string | null;
  run_count?: number;
  success_count?: number;
  failure_count?: number;
  is_active?: boolean;
}

export interface JobFilters extends BaseFilters {
  search?: string;
  status?: JobStatus;
  priority?: JobPriority;
  job_type?: string;
  schedule_type?: ScheduleType;
  is_active?: boolean;
  has_errors?: boolean;
  overdue?: boolean;
}

// ==================== EXECUTION RESULT ====================

export interface JobExecutionResult {
  success: boolean;
  duration: number; // milliseconds
  error?: string;
  output?: any;
}

// ==================== STATISTICS ====================

export interface JobStatistics {
  total_jobs: number;
  active_jobs: number;
  inactive_jobs: number;
  by_status: Record<JobStatus, number>;
  by_priority: Record<JobPriority, number>;
  by_type: Record<string, number>;
  by_schedule_type: Record<string, number>;
  total_runs: number;
  total_successes: number;
  total_failures: number;
  success_rate: number; // percentage
  avg_duration: number; // milliseconds
  jobs_with_errors: number;
  overdue_jobs: number;
  upcoming_jobs: number;
}

// ==================== ADAPTER ====================

const adapter = createAdapter<SystemJob, CreateJobRequest, UpdateJobRequest>(
  'system_jobs',
  '/system-jobs',
  false // No soft delete
);

// ==================== API CLIENT ====================

export const systemJobsApi = {
  /**
   * GET /system-jobs
   * Fetch jobs with filters
   */
  getAll: async (filters?: JobFilters): Promise<SystemJob[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    let query = supabase
      .from('system_jobs')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.search) {
      query = query.or(`job_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.job_type) {
      query = query.eq('job_type', filters.job_type);
    }
    if (filters?.schedule_type) {
      query = query.eq('schedule_type', filters.schedule_type);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.has_errors) {
      query = query.not('last_run_error', 'is', null);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch system jobs: ${error.message}`);
    }

    let jobs = data || [];

    // Client-side overdue filter
    if (filters?.overdue) {
      const now = new Date();
      jobs = jobs.filter((job) => {
        if (!job.next_run_at) return false;
        return new Date(job.next_run_at) < now && job.status === 'pending';
      });
    }

    return jobs;
  },

  /**
   * GET /system-jobs/:id
   */
  getById: async (id: string): Promise<SystemJob> => {
    return adapter.getById(id);
  },

  /**
   * POST /system-jobs
   * Create new job with defaults
   */
  create: async (data: CreateJobRequest): Promise<SystemJob> => {
    // Apply defaults
    const requestData = {
      status: 'pending' as JobStatus, // default
      priority: 'normal' as JobPriority, // default
      is_active: true, // default
      run_count: 0, // default
      success_count: 0, // default
      failure_count: 0, // default
      ...data,
    };

    return adapter.create(requestData);
  },

  /**
   * PUT /system-jobs/:id
   * Update job
   */
  update: async (id: string, data: UpdateJobRequest): Promise<SystemJob> => {
    return adapter.update(id, data);
  },

  /**
   * DELETE /system-jobs/:id
   * Hard delete job
   */
  delete: async (id: string): Promise<void> => {
    return adapter.delete(id);
  },

  /**
   * POST /system-jobs/:id/execute
   * Execute job manually
   */
  execute: async (id: string): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current job
    const job = await systemJobsApi.getById(id);

    if (!job.is_active) {
      throw new Error('Cannot execute inactive job');
    }

    if (job.status === 'running') {
      throw new Error('Job is already running');
    }

    // Update status to running
    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        status: 'running',
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to execute job: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-jobs/:id/pause
   * Pause job
   */
  pause: async (id: string): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to pause job: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-jobs/:id/resume
   * Resume paused job
   */
  resume: async (id: string): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to resume job: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-jobs/:id/cancel
   * Cancel job
   */
  cancel: async (id: string): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to cancel job: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-jobs/:id/activate
   * Activate job
   */
  activate: async (id: string): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to activate job: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-jobs/:id/deactivate
   * Deactivate job
   */
  deactivate: async (id: string): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to deactivate job: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-jobs/:id/record-success
   * Record successful execution
   */
  recordSuccess: async (id: string, duration: number, output?: any): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current job
    const job = await systemJobsApi.getById(id);

    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        status: 'completed',
        last_run_status: 'success',
        last_run_duration: duration,
        last_run_error: null,
        run_count: job.run_count + 1,
        success_count: job.success_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to record success: ${error?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * POST /system-jobs/:id/record-failure
   * Record failed execution
   */
  recordFailure: async (id: string, duration: number, error: string): Promise<SystemJob> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    // Get current job
    const job = await systemJobsApi.getById(id);

    const { data, updateError } = await supabase
      .from('system_jobs')
      .update({
        status: 'failed',
        last_run_status: 'failure',
        last_run_duration: duration,
        last_run_error: error,
        run_count: job.run_count + 1,
        failure_count: job.failure_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !data) {
      throw new Error(`Failed to record failure: ${updateError?.message || 'Unknown error'}`);
    }

    return data;
  },

  /**
   * GET /system-jobs/overdue
   * Get overdue jobs
   */
  getOverdue: async (): Promise<SystemJob[]> => {
    return systemJobsApi.getAll({
      status: 'pending',
      is_active: true,
      overdue: true,
    });
  },

  /**
   * GET /system-jobs/upcoming
   * Get upcoming jobs (next 24 hours)
   */
  getUpcoming: async (): Promise<SystemJob[]> => {
    const { getSupabaseClient } = await import('../lib/supabase');
    const supabase = getSupabaseClient();

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('system_jobs')
      .select('*')
      .eq('status', 'pending')
      .eq('is_active', true)
      .not('next_run_at', 'is', null)
      .gte('next_run_at', now.toISOString())
      .lte('next_run_at', tomorrow.toISOString())
      .order('next_run_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch upcoming jobs: ${error.message}`);
    }

    return data || [];
  },

  /**
   * GET /system-jobs/by-type/:type
   * Get jobs by type
   */
  getByType: async (jobType: string): Promise<SystemJob[]> => {
    return systemJobsApi.getAll({ job_type: jobType });
  },

  /**
   * GET /system-jobs/running
   * Get currently running jobs
   */
  getRunning: async (): Promise<SystemJob[]> => {
    return systemJobsApi.getAll({ status: 'running' });
  },

  /**
   * GET /system-jobs/failed
   * Get failed jobs
   */
  getFailed: async (): Promise<SystemJob[]> => {
    return systemJobsApi.getAll({ status: 'failed' });
  },

  /**
   * GET /system-jobs/statistics
   * Get job statistics
   */
  getStatistics: async (): Promise<JobStatistics> => {
    const jobs = await systemJobsApi.getAll({});
    return calculateStatistics(jobs);
  },

  /**
   * Client-side validation
   */
  validate: (data: CreateJobRequest | UpdateJobRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate job_name
    if ('job_name' in data && data.job_name !== undefined) {
      if (!data.job_name.trim()) {
        errors.push('Tên job không được để trống');
      }
      if (data.job_name.length > 255) {
        errors.push('Tên job không được vượt quá 255 ký tự');
      }
    }

    // Validate job_type
    if ('job_type' in data && data.job_type !== undefined) {
      if (!data.job_type.trim()) {
        errors.push('Loại job không được để trống');
      }
      if (data.job_type.length > 100) {
        errors.push('Loại job không được vượt quá 100 ký tự');
      }
    }

    // Validate cron_expression
    if ('cron_expression' in data && data.cron_expression !== undefined && data.cron_expression !== null) {
      if (data.cron_expression.length > 100) {
        errors.push('Cron expression không được vượt quá 100 ký tự');
      }
      // Basic cron validation (5 or 6 parts)
      const parts = data.cron_expression.trim().split(/\s+/);
      if (parts.length < 5 || parts.length > 6) {
        errors.push('Cron expression không hợp lệ (cần 5 hoặc 6 phần)');
      }
    }

    // Validate duration
    if ('last_run_duration' in data && data.last_run_duration !== undefined && data.last_run_duration !== null) {
      if (data.last_run_duration < 0) {
        errors.push('Thời gian chạy phải >= 0');
      }
    }

    // Validate counts
    if ('run_count' in data && data.run_count !== undefined && data.run_count !== null) {
      if (data.run_count < 0) {
        errors.push('Số lần chạy phải >= 0');
      }
    }
    if ('success_count' in data && data.success_count !== undefined && data.success_count !== null) {
      if (data.success_count < 0) {
        errors.push('Số lần thành công phải >= 0');
      }
    }
    if ('failure_count' in data && data.failure_count !== undefined && data.failure_count !== null) {
      if (data.failure_count < 0) {
        errors.push('Số lần thất bại phải >= 0');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate statistics from jobs array
 */
export function calculateStatistics(jobs: SystemJob[]): JobStatistics {
  const byStatus: Record<JobStatus, number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    paused: 0,
    cancelled: 0,
  };

  const byPriority: Record<JobPriority, number> = {
    low: 0,
    normal: 0,
    high: 0,
    critical: 0,
  };

  const byType: Record<string, number> = {};
  const byScheduleType: Record<string, number> = {};

  let activeCount = 0;
  let inactiveCount = 0;
  let totalRuns = 0;
  let totalSuccesses = 0;
  let totalFailures = 0;
  let totalDuration = 0;
  let durationCount = 0;
  let errorsCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  jobs.forEach((job) => {
    // Count by status
    byStatus[job.status]++;

    // Count by priority
    byPriority[job.priority]++;

    // Count by type
    byType[job.job_type] = (byType[job.job_type] || 0) + 1;

    // Count by schedule type
    if (job.schedule_type) {
      byScheduleType[job.schedule_type] = (byScheduleType[job.schedule_type] || 0) + 1;
    }

    // Count active/inactive
    if (job.is_active) {
      activeCount++;
    } else {
      inactiveCount++;
    }

    // Sum statistics
    totalRuns += job.run_count;
    totalSuccesses += job.success_count;
    totalFailures += job.failure_count;

    // Average duration
    if (job.last_run_duration) {
      totalDuration += job.last_run_duration;
      durationCount++;
    }

    // Count errors
    if (job.last_run_error) {
      errorsCount++;
    }

    // Count overdue
    if (job.next_run_at && new Date(job.next_run_at) < now && job.status === 'pending' && job.is_active) {
      overdueCount++;
    }

    // Count upcoming
    if (
      job.next_run_at &&
      new Date(job.next_run_at) >= now &&
      new Date(job.next_run_at) <= tomorrow &&
      job.status === 'pending' &&
      job.is_active
    ) {
      upcomingCount++;
    }
  });

  const successRate = totalRuns > 0 ? (totalSuccesses / totalRuns) * 100 : 0;
  const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

  return {
    total_jobs: jobs.length,
    active_jobs: activeCount,
    inactive_jobs: inactiveCount,
    by_status: byStatus,
    by_priority: byPriority,
    by_type: byType,
    by_schedule_type: byScheduleType,
    total_runs: totalRuns,
    total_successes: totalSuccesses,
    total_failures: totalFailures,
    success_rate: Math.round(successRate * 100) / 100,
    avg_duration: Math.round(avgDuration),
    jobs_with_errors: errorsCount,
    overdue_jobs: overdueCount,
    upcoming_jobs: upcomingCount,
  };
}

/**
 * Get status label
 */
export function getStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    pending: 'Chờ xử lý',
    running: 'Đang chạy',
    completed: 'Hoàn thành',
    failed: 'Thất bại',
    paused: 'Tạm dừng',
    cancelled: 'Đã hủy',
  };
  return labels[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[status];
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: JobPriority): string {
  const labels: Record<JobPriority, string> = {
    low: 'Thấp',
    normal: 'Bình thường',
    high: 'Cao',
    critical: 'Nghiêm trọng',
  };
  return labels[priority];
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: JobPriority): string {
  const colors: Record<JobPriority, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[priority];
}

/**
 * Format duration
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }
  if (milliseconds < 3600000) {
    return `${(milliseconds / 60000).toFixed(1)}m`;
  }
  return `${(milliseconds / 3600000).toFixed(1)}h`;
}

/**
 * Calculate success rate
 */
export function calculateSuccessRate(job: SystemJob): number {
  if (job.run_count === 0) return 0;
  return Math.round((job.success_count / job.run_count) * 100);
}

/**
 * Check if job is overdue
 */
export function isOverdue(job: SystemJob): boolean {
  if (!job.next_run_at || job.status !== 'pending' || !job.is_active) return false;
  return new Date(job.next_run_at) < new Date();
}

/**
 * Check if job is upcoming (within 24 hours)
 */
export function isUpcoming(job: SystemJob): boolean {
  if (!job.next_run_at || job.status !== 'pending' || !job.is_active) return false;
  const nextRun = new Date(job.next_run_at);
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return nextRun >= now && nextRun <= tomorrow;
}

/**
 * Get time until next run
 */
export function getTimeUntilNextRun(job: SystemJob): string | null {
  if (!job.next_run_at) return null;

  const now = new Date();
  const nextRun = new Date(job.next_run_at);
  const diff = nextRun.getTime() - now.getTime();

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    if (absDiff < 60000) return 'Quá hạn vài giây';
    if (absDiff < 3600000) return `Quá hạn ${Math.floor(absDiff / 60000)} phút`;
    if (absDiff < 86400000) return `Quá hạn ${Math.floor(absDiff / 3600000)} giờ`;
    return `Quá hạn ${Math.floor(absDiff / 86400000)} ngày`;
  }

  if (diff < 60000) return 'Vài giây nữa';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút nữa`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ nữa`;
  return `${Math.floor(diff / 86400000)} ngày nữa`;
}

/**
 * Parse cron expression to human readable
 */
export function parseCronExpression(cron: string): string {
  // Simplified cron parser - in production, use a library like cronstrue
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (cron === '* * * * *') return 'Mỗi phút';
  if (cron === '0 * * * *') return 'Mỗi giờ';
  if (cron === '0 0 * * *') return 'Mỗi ngày lúc 00:00';
  if (cron === '0 0 * * 0') return 'Mỗi Chủ nhật lúc 00:00';
  if (cron === '0 0 1 * *') return 'Ngày đầu tháng lúc 00:00';

  return cron;
}

/**
 * Validate cron expression
 */
export function validateCronExpression(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) return false;

  // Basic validation - each part should contain valid characters
  const validPattern = /^[\d\*\-\/,]+$/;
  return parts.every((part) => validPattern.test(part));
}

export default systemJobsApi;
