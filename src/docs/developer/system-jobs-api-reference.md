# System Jobs API Reference

## Overview
Complete API documentation for System Jobs management module.

**Module ID:** `system-jobs`  
**Base Route:** `/core/system-jobs`  
**Version:** 1.0.0

---

## API Endpoints

### GET /system-jobs
Fetch all system jobs with optional filters.

**Query Parameters:**
- `search` (string, optional) - Search by job name or description
- `status` (string, optional) - Filter by status: pending, running, completed, failed, paused
- `priority` (string, optional) - Filter by priority: low, normal, high, critical
- `job_type` (string, optional) - Filter by job type
- `is_active` (boolean, optional) - Filter by active status
- `limit` (number, optional) - Limit number of results
- `offset` (number, optional) - Offset for pagination

**Response:**
```json
[
  {
    "id": "uuid",
    "job_name": "Daily Database Backup",
    "job_type": "backup",
    "description": "Automated daily backup of production database",
    "status": "completed",
    "priority": "high",
    "schedule_type": "scheduled",
    "cron_expression": "0 2 * * *",
    "last_run_at": "2026-01-15T02:00:00Z",
    "next_run_at": "2026-01-16T02:00:00Z",
    "last_run_duration": 180,
    "last_run_status": "success",
    "last_run_error": null,
    "run_count": 365,
    "success_count": 362,
    "failure_count": 3,
    "is_active": true,
    "created_by": "admin@example.com",
    "created_at": "2025-01-15T00:00:00Z",
    "updated_at": "2026-01-15T02:03:00Z"
  }
]
```

---

### GET /system-jobs/:id
Fetch a single system job by ID.

**URL Parameters:**
- `id` (uuid, required) - Job ID

**Response:**
```json
{
  "id": "uuid",
  "job_name": "Daily Database Backup",
  "job_type": "backup",
  ...
}
```

**Error Responses:**
- `404` - Job not found

---

### POST /system-jobs
Create a new system job.

**Request Body:**
```json
{
  "job_name": "Weekly Report Generation",
  "job_type": "report",
  "description": "Generate weekly analytics report",
  "status": "pending",
  "priority": "normal",
  "schedule_type": "scheduled",
  "cron_expression": "0 9 * * 1",
  "next_run_at": "2026-01-20T09:00:00Z",
  "is_active": true
}
```

**Response:**
```json
{
  "id": "newly-created-uuid",
  "job_name": "Weekly Report Generation",
  ...
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

**Validation:**
- `job_name` - Required, max 255 characters
- `job_type` - Required, max 100 characters
- `status` - Default: "pending"
- `priority` - Default: "normal"
- `cron_expression` - Required if schedule_type is "scheduled"

---

### PUT /system-jobs/:id
Update an existing system job.

**URL Parameters:**
- `id` (uuid, required) - Job ID

**Request Body:**
```json
{
  "job_name": "Updated Job Name",
  "description": "Updated description",
  "priority": "high",
  "is_active": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "job_name": "Updated Job Name",
  ...
  "updated_at": "2026-01-15T10:30:00Z"
}
```

---

### DELETE /system-jobs/:id
Delete a system job.

**URL Parameters:**
- `id` (uuid, required) - Job ID

**Response:**
- `200` - Job deleted successfully
- `404` - Job not found

---

### POST /system-jobs/:id/execute
Execute a job manually.

**URL Parameters:**
- `id` (uuid, required) - Job ID

**Response:**
```json
{
  "message": "Job execution started",
  "job_id": "uuid",
  "status": "running"
}
```

---

### POST /system-jobs/:id/pause
Pause a running job.

**URL Parameters:**
- `id` (uuid, required) - Job ID

**Response:**
```json
{
  "message": "Job paused",
  "job_id": "uuid",
  "status": "paused"
}
```

---

### POST /system-jobs/:id/resume
Resume a paused job.

**URL Parameters:**
- `id` (uuid, required) - Job ID

**Response:**
```json
{
  "message": "Job resumed",
  "job_id": "uuid",
  "status": "pending"
}
```

---

### GET /system-jobs/stats
Get job statistics.

**Response:**
```json
{
  "total": 50,
  "byStatus": {
    "pending": 10,
    "running": 5,
    "completed": 30,
    "failed": 3,
    "paused": 2
  },
  "byPriority": {
    "low": 15,
    "normal": 25,
    "high": 8,
    "critical": 2
  },
  "byType": {
    "backup": 10,
    "cleanup": 8,
    "report": 12,
    ...
  }
}
```

---

## Data Models

### SystemJob
```typescript
interface SystemJob {
  id: string;                          // UUID primary key
  job_name: string;                    // Job name (max 255 chars)
  job_type: string;                    // Job type (max 100 chars)
  description?: string;                // Job description
  status: JobStatus;                   // Current status
  priority: JobPriority;               // Priority level
  schedule_type?: ScheduleType;        // Schedule type
  cron_expression?: string;            // Cron expression (max 100 chars)
  last_run_at?: string;                // Last execution timestamp
  next_run_at?: string;                // Next scheduled execution
  last_run_duration?: number;          // Duration in seconds
  last_run_status?: string;            // Last run status (max 50 chars)
  last_run_error?: string;             // Last error message
  run_count: number;                   // Total run count
  success_count: number;               // Successful runs
  failure_count: number;               // Failed runs
  is_active: boolean;                  // Active status
  created_by?: string;                 // Creator identifier (max 100 chars)
  created_at: string;                  // Creation timestamp
  updated_at: string;                  // Update timestamp
}

type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
type JobPriority = 'low' | 'normal' | 'high' | 'critical';
type ScheduleType = 'manual' | 'scheduled' | 'triggered';
```

---

## Job Types
- `backup` - Backup operations
- `cleanup` - Data cleanup tasks
- `report` - Report generation
- `sync` - Data synchronization
- `notification` - Notification delivery
- `archive` - Data archiving
- `monitoring` - System monitoring
- `indexing` - Search indexing
- `payment` - Payment processing
- `billing` - Billing operations
- `security` - Security scans
- `optimization` - Performance optimization
- `maintenance` - System maintenance
- `validation` - Data validation
- `api` - API operations

---

## Cron Expression Format
Standard 5-field cron format:
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 2 * * *` - Daily at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1` - Every Monday at 9:00 AM
- `*/15 * * * *` - Every 15 minutes
- `0 0 1 * *` - First day of every month at midnight

---

## Error Handling

### Common Error Codes
- `400` - Bad Request (validation error)
- `404` - Resource not found
- `500` - Internal server error

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Job name is required",
    "details": {
      "field": "job_name",
      "rule": "required"
    }
  }
}
```

---

## Migration to Golang Backend

### API Endpoint Mapping
All endpoints will be migrated to Golang microservice:

**Current:** `https://{supabase-url}/rest/v1/system_jobs`  
**Future:** `https://{golang-api}/v1/system-jobs`

### Breaking Changes
None expected. The API contract will remain the same.

### Migration Checklist
- [ ] Create Golang handlers for all endpoints
- [ ] Implement authentication middleware
- [ ] Add rate limiting
- [ ] Set up monitoring and logging
- [ ] Update frontend API client configuration
- [ ] Run integration tests
- [ ] Deploy and switch traffic

---

## Performance Considerations

### Pagination
- Default limit: 50
- Maximum limit: 1000
- Use offset-based pagination for small datasets
- Consider cursor-based pagination for large datasets

### Caching Strategy
- Cache job list for 30 seconds
- Cache individual jobs for 5 minutes
- Invalidate cache on job updates

### Indexing Recommendations
```sql
CREATE INDEX idx_system_jobs_status ON system_jobs(status);
CREATE INDEX idx_system_jobs_priority ON system_jobs(priority);
CREATE INDEX idx_system_jobs_job_type ON system_jobs(job_type);
CREATE INDEX idx_system_jobs_next_run_at ON system_jobs(next_run_at) WHERE is_active = true;
```

---

## Security

### Authorization
- All endpoints require authentication
- Create/Update/Delete require admin role
- Execute/Pause/Resume require operator role
- Read operations available to all authenticated users

### Data Validation
- Input sanitization for all text fields
- Cron expression validation
- Date/time validation
- Enum validation for status, priority, types

---

## Monitoring & Logging

### Metrics to Track
- Total jobs count
- Jobs by status
- Execution success rate
- Average execution duration
- Failed jobs in last 24 hours

### Logging
- Log all job executions
- Log all state changes
- Log all errors with stack traces
- Include correlation IDs for tracing

---

**Last Updated:** 2026-01-15  
**Maintainer:** Platform Team  
**Related Docs:** 
- [Database Schema](./system-jobs-database-schema.md)
- [Use Cases](./system-jobs-use-cases.md)
