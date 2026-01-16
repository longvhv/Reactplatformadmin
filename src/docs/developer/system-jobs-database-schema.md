# System Jobs Database Schema

## Table: `system_jobs`

Complete database schema documentation for the System Jobs table.

---

## Table Definition

```sql
CREATE TABLE public.system_jobs (
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
```

---

## Column Specifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key, unique identifier |
| `job_name` | varchar(255) | NO | - | Name of the job |
| `job_type` | varchar(100) | NO | - | Type of job (backup, cleanup, etc.) |
| `description` | text | YES | NULL | Detailed description of the job |
| `status` | varchar(50) | NO | 'pending' | Current status of the job |
| `priority` | varchar(20) | NO | 'normal' | Priority level |
| `schedule_type` | varchar(50) | YES | NULL | Type of scheduling (manual, scheduled, triggered) |
| `cron_expression` | varchar(100) | YES | NULL | Cron expression for scheduled jobs |
| `last_run_at` | timestamptz | YES | NULL | Timestamp of last execution |
| `next_run_at` | timestamptz | YES | NULL | Timestamp of next scheduled execution |
| `last_run_duration` | integer | YES | NULL | Duration of last run in seconds |
| `last_run_status` | varchar(50) | YES | NULL | Status of last execution |
| `last_run_error` | text | YES | NULL | Error message from last failed run |
| `run_count` | integer | YES | 0 | Total number of executions |
| `success_count` | integer | YES | 0 | Number of successful executions |
| `failure_count` | integer | YES | 0 | Number of failed executions |
| `is_active` | boolean | YES | true | Whether the job is active |
| `created_by` | varchar(100) | YES | NULL | User who created the job |
| `created_at` | timestamptz | YES | now() | Timestamp when job was created |
| `updated_at` | timestamptz | YES | now() | Timestamp when job was last updated |

---

## Constraints

### Primary Key
```sql
CONSTRAINT system_jobs_pkey PRIMARY KEY (id)
```

### Check Constraints

```sql
-- Status values constraint
ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_status_check 
CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused'));

-- Priority values constraint
ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_priority_check 
CHECK (priority IN ('low', 'normal', 'high', 'critical'));

-- Schedule type constraint
ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_schedule_type_check 
CHECK (schedule_type IS NULL OR schedule_type IN ('manual', 'scheduled', 'triggered'));

-- Counters must be non-negative
ALTER TABLE public.system_jobs
ADD CONSTRAINT system_jobs_counters_check 
CHECK (run_count >= 0 AND success_count >= 0 AND failure_count >= 0);
```

---

## Indexes

### Recommended Indexes

```sql
-- Index on status for filtering
CREATE INDEX idx_system_jobs_status 
ON public.system_jobs(status) 
WHERE is_active = true;

-- Index on priority for filtering
CREATE INDEX idx_system_jobs_priority 
ON public.system_jobs(priority) 
WHERE is_active = true;

-- Index on job_type for filtering
CREATE INDEX idx_system_jobs_job_type 
ON public.system_jobs(job_type);

-- Index on next_run_at for scheduler
CREATE INDEX idx_system_jobs_next_run_at 
ON public.system_jobs(next_run_at) 
WHERE is_active = true AND status != 'running';

-- Composite index for common queries
CREATE INDEX idx_system_jobs_active_status 
ON public.system_jobs(is_active, status, next_run_at);

-- Full-text search index
CREATE INDEX idx_system_jobs_search 
ON public.system_jobs USING gin(to_tsvector('english', job_name || ' ' || COALESCE(description, '')));
```

---

## Triggers

### Auto-update timestamp trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_system_jobs_updated_at
  BEFORE UPDATE ON public.system_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_system_jobs_updated_at();
```

### Increment run counters trigger

```sql
-- Function to increment run counters
CREATE OR REPLACE FUNCTION increment_system_jobs_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment run_count when job starts
  IF NEW.status = 'running' AND OLD.status != 'running' THEN
    NEW.run_count = COALESCE(OLD.run_count, 0) + 1;
  END IF;
  
  -- Increment success_count when job completes successfully
  IF NEW.status = 'completed' AND OLD.status = 'running' THEN
    NEW.success_count = COALESCE(OLD.success_count, 0) + 1;
  END IF;
  
  -- Increment failure_count when job fails
  IF NEW.status = 'failed' AND OLD.status = 'running' THEN
    NEW.failure_count = COALESCE(OLD.failure_count, 0) + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_increment_system_jobs_counters
  BEFORE UPDATE ON public.system_jobs
  FOR EACH ROW
  EXECUTE FUNCTION increment_system_jobs_counters();
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all jobs
CREATE POLICY "Allow authenticated users to read jobs"
ON public.system_jobs
FOR SELECT
TO authenticated
USING (true);

-- Policy for admins to manage jobs
CREATE POLICY "Allow admins to manage jobs"
ON public.system_jobs
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Policy for operators to execute jobs
CREATE POLICY "Allow operators to execute jobs"
ON public.system_jobs
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'operator')
)
WITH CHECK (
  status IN ('running', 'paused', 'pending')
);
```

---

## Enum Types

While the schema uses varchar with check constraints, you can optionally create enum types:

```sql
-- Job Status Enum
CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'paused'
);

-- Job Priority Enum
CREATE TYPE job_priority AS ENUM (
  'low',
  'normal',
  'high',
  'critical'
);

-- Schedule Type Enum
CREATE TYPE schedule_type AS ENUM (
  'manual',
  'scheduled',
  'triggered'
);
```

---

## Sample Data

```sql
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
  '2026-01-16T02:00:00Z',
  true
),
(
  'Weekly Report Generation',
  'report',
  'Generate weekly analytics report every Monday',
  'pending',
  'normal',
  'scheduled',
  '0 9 * * 1',
  '2026-01-20T09:00:00Z',
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
  '2026-01-15T14:00:00Z',
  true
),
(
  'Monthly Cleanup',
  'cleanup',
  'Clean up old logs and temporary files',
  'pending',
  'low',
  'scheduled',
  '0 3 1 * *',
  '2026-02-01T03:00:00Z',
  true
);
```

---

## Query Examples

### Find jobs due to run in next hour
```sql
SELECT *
FROM public.system_jobs
WHERE is_active = true
  AND status NOT IN ('running', 'paused')
  AND next_run_at <= now() + interval '1 hour'
ORDER BY priority DESC, next_run_at ASC;
```

### Get job statistics
```sql
SELECT
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'running') as running,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(CASE WHEN run_count > 0 THEN success_count::float / run_count * 100 END) as avg_success_rate
FROM public.system_jobs
WHERE is_active = true;
```

### Find failing jobs
```sql
SELECT
  job_name,
  job_type,
  failure_count,
  last_run_error,
  last_run_at
FROM public.system_jobs
WHERE failure_count > 0
  AND is_active = true
ORDER BY failure_count DESC, last_run_at DESC
LIMIT 10;
```

### Search jobs
```sql
SELECT *
FROM public.system_jobs
WHERE to_tsvector('english', job_name || ' ' || COALESCE(description, ''))
  @@ plainto_tsquery('english', 'backup database')
ORDER BY ts_rank(
  to_tsvector('english', job_name || ' ' || COALESCE(description, '')),
  plainto_tsquery('english', 'backup database')
) DESC;
```

---

## Migration Script

```sql
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
);

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

-- Create indexes
CREATE INDEX idx_system_jobs_status ON public.system_jobs(status) WHERE is_active = true;
CREATE INDEX idx_system_jobs_priority ON public.system_jobs(priority) WHERE is_active = true;
CREATE INDEX idx_system_jobs_job_type ON public.system_jobs(job_type);
CREATE INDEX idx_system_jobs_next_run_at ON public.system_jobs(next_run_at) WHERE is_active = true AND status != 'running';

-- Create triggers
CREATE OR REPLACE FUNCTION update_system_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_jobs_updated_at
  BEFORE UPDATE ON public.system_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_system_jobs_updated_at();

-- Enable RLS
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE public.system_jobs IS 'System jobs for automated tasks and scheduling';
COMMENT ON COLUMN public.system_jobs.id IS 'Unique identifier for the job';
COMMENT ON COLUMN public.system_jobs.job_name IS 'Name of the job';
COMMENT ON COLUMN public.system_jobs.job_type IS 'Type of job (backup, cleanup, report, etc.)';
COMMENT ON COLUMN public.system_jobs.cron_expression IS 'Cron expression for scheduled jobs (minute hour day month weekday)';
COMMENT ON COLUMN public.system_jobs.run_count IS 'Total number of times the job has been executed';
COMMENT ON COLUMN public.system_jobs.success_count IS 'Number of successful executions';
COMMENT ON COLUMN public.system_jobs.failure_count IS 'Number of failed executions';
```

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────┐
│              system_jobs                         │
├─────────────────────────────────────────────────┤
│ id (PK)                   uuid                   │
│ job_name                  varchar(255)           │
│ job_type                  varchar(100)           │
│ description               text                   │
│ status                    varchar(50)            │
│ priority                  varchar(20)            │
│ schedule_type             varchar(50)            │
│ cron_expression           varchar(100)           │
│ last_run_at               timestamptz            │
│ next_run_at               timestamptz            │
│ last_run_duration         integer                │
│ last_run_status           varchar(50)            │
│ last_run_error            text                   │
│ run_count                 integer                │
│ success_count             integer                │
│ failure_count             integer                │
│ is_active                 boolean                │
│ created_by                varchar(100)           │
│ created_at                timestamptz            │
│ updated_at                timestamptz            │
└─────────────────────────────────────────────────┘
```

---

## Compliance Checklist

- [x] Primary key using `id` (uuid)
- [x] Timestamps: `created_at`, `updated_at`
- [x] Auto-update trigger for `updated_at`
- [x] Appropriate indexes for common queries
- [x] Check constraints for enum values
- [x] Row Level Security policies
- [x] Table and column comments
- [x] Default values for required fields
- [x] Non-negative constraints on counters

---

**Last Updated:** 2026-01-15  
**Database Version:** PostgreSQL 14+  
**Maintainer:** Platform Team  
**Related Docs:**
- [API Reference](./system-jobs-api-reference.md)
- [Use Cases](./system-jobs-use-cases.md)
