-- Migration: Create system_jobs table
-- Created: 2026-01-15
-- Description: Create table for managing system jobs and automated tasks

-- Create system_jobs table
CREATE TABLE IF NOT EXISTS public.system_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_name character varying(255) NOT NULL,
  job_type character varying(100) NOT NULL,
  description text NULL,
  status character varying(50) NOT NULL DEFAULT 'pending'::character varying,
  priority character varying(20) NOT NULL DEFAULT 'normal'::character varying,
  schedule_type character varying(50) NULL,
  cron_expression character varying(100) NULL,
  last_run_at timestamp with time zone NULL,
  next_run_at timestamp with time zone NULL,
  last_run_duration integer NULL,
  last_run_status character varying(50) NULL,
  last_run_error text NULL,
  run_count integer NULL DEFAULT 0,
  success_count integer NULL DEFAULT 0,
  failure_count integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_by character varying(100) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT system_jobs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add check constraints
ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_status_check 
CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused'));

ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_priority_check 
CHECK (priority IN ('low', 'normal', 'high', 'critical'));

ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_schedule_type_check 
CHECK (schedule_type IS NULL OR schedule_type IN ('manual', 'scheduled', 'triggered'));

ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_counters_check 
CHECK (run_count >= 0 AND success_count >= 0 AND failure_count >= 0);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_jobs_status 
ON public.system_jobs(status) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_system_jobs_priority 
ON public.system_jobs(priority) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_system_jobs_job_type 
ON public.system_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_system_jobs_next_run_at 
ON public.system_jobs(next_run_at) 
WHERE is_active = true AND status != 'running';

CREATE INDEX IF NOT EXISTS idx_system_jobs_active_status 
ON public.system_jobs(is_active, status, next_run_at);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_system_jobs_updated_at ON public.system_jobs;
CREATE TRIGGER trigger_update_system_jobs_updated_at
  BEFORE UPDATE ON public.system_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_system_jobs_updated_at();

-- Enable Row Level Security
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read all jobs
CREATE POLICY "Allow authenticated users to read jobs"
ON public.system_jobs
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow admins to manage jobs
CREATE POLICY "Allow admins to manage jobs"
ON public.system_jobs
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role')::text = 'admin'
);

-- Add table and column comments
COMMENT ON TABLE public.system_jobs IS 'System jobs for automated tasks and scheduling';
COMMENT ON COLUMN public.system_jobs.id IS 'Unique identifier for the job';
COMMENT ON COLUMN public.system_jobs.job_name IS 'Name of the job';
COMMENT ON COLUMN public.system_jobs.job_type IS 'Type of job (backup, cleanup, report, etc.)';
COMMENT ON COLUMN public.system_jobs.description IS 'Detailed description of the job';
COMMENT ON COLUMN public.system_jobs.status IS 'Current status: pending, running, completed, failed, paused';
COMMENT ON COLUMN public.system_jobs.priority IS 'Priority level: low, normal, high, critical';
COMMENT ON COLUMN public.system_jobs.schedule_type IS 'Type of scheduling: manual, scheduled, triggered';
COMMENT ON COLUMN public.system_jobs.cron_expression IS 'Cron expression for scheduled jobs (minute hour day month weekday)';
COMMENT ON COLUMN public.system_jobs.last_run_at IS 'Timestamp of last execution';
COMMENT ON COLUMN public.system_jobs.next_run_at IS 'Timestamp of next scheduled execution';
COMMENT ON COLUMN public.system_jobs.last_run_duration IS 'Duration of last run in seconds';
COMMENT ON COLUMN public.system_jobs.last_run_status IS 'Status of last execution';
COMMENT ON COLUMN public.system_jobs.last_run_error IS 'Error message from last failed run';
COMMENT ON COLUMN public.system_jobs.run_count IS 'Total number of times the job has been executed';
COMMENT ON COLUMN public.system_jobs.success_count IS 'Number of successful executions';
COMMENT ON COLUMN public.system_jobs.failure_count IS 'Number of failed executions';
COMMENT ON COLUMN public.system_jobs.is_active IS 'Whether the job is active and can be scheduled';
COMMENT ON COLUMN public.system_jobs.created_by IS 'User who created the job';
COMMENT ON COLUMN public.system_jobs.created_at IS 'Timestamp when job was created';
COMMENT ON COLUMN public.system_jobs.updated_at IS 'Timestamp when job was last updated';

-- Insert sample data for testing
INSERT INTO public.system_jobs (
  job_name,
  job_type,
  description,
  status,
  priority,
  schedule_type,
  cron_expression,
  next_run_at,
  is_active
) VALUES
(
  'Daily Database Backup',
  'backup',
  'Automated daily backup of production database at 2:00 AM',
  'pending',
  'high',
  'scheduled',
  '0 2 * * *',
  (CURRENT_DATE + INTERVAL '1 day' + TIME '02:00:00')::timestamptz,
  true
),
(
  'Weekly Report Generation',
  'report',
  'Generate weekly analytics report every Monday at 9:00 AM',
  'pending',
  'normal',
  'scheduled',
  '0 9 * * 1',
  (CURRENT_DATE + ((1 - EXTRACT(DOW FROM CURRENT_DATE)::integer + 7) % 7 + 1) + TIME '09:00:00')::timestamptz,
  true
),
(
  'Hourly Data Sync',
  'sync',
  'Synchronize data with external systems every hour',
  'pending',
  'normal',
  'scheduled',
  '0 * * * *',
  (DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour')::timestamptz,
  true
),
(
  'Monthly Cleanup',
  'cleanup',
  'Clean up old logs and temporary files on the first day of each month',
  'pending',
  'low',
  'scheduled',
  '0 3 1 * *',
  (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' + TIME '03:00:00')::timestamptz,
  true
),
(
  'Security Scan',
  'security',
  'Run security vulnerability scan',
  'completed',
  'critical',
  'scheduled',
  '0 0 * * 0',
  (CURRENT_DATE + ((7 - EXTRACT(DOW FROM CURRENT_DATE)::integer) % 7 + 1) + TIME '00:00:00')::timestamptz,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_jobs TO authenticated;
GRANT USAGE ON SEQUENCE IF EXISTS system_jobs_id_seq TO authenticated;
