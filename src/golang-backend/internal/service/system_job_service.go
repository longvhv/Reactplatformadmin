package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type SystemJobService struct {
	jobRepo repository.SystemJobRepository
}

func NewSystemJobService(jobRepo repository.SystemJobRepository) *SystemJobService {
	return &SystemJobService{
		jobRepo: jobRepo,
	}
}

type CreateSystemJobRequest struct {
	JobName      string                 `json:"job_name" binding:"required"`
	JobType      string                 `json:"job_type" binding:"required"`
	Description  *string                `json:"description"`
	Payload      map[string]interface{} `json:"payload"`
	ScheduledAt  *string                `json:"scheduled_at"`
	Priority     int                    `json:"priority"`
	MaxRetries   int                    `json:"max_retries"`
	RetryDelay   int                    `json:"retry_delay"`
	TimeoutSec   *int                   `json:"timeout_sec"`
	Dependencies []string               `json:"dependencies"`
	Tags         []string               `json:"tags"`
	Metadata     map[string]interface{} `json:"metadata"`
	CreatedBy    *string                `json:"created_by"`
}

type UpdateSystemJobRequest struct {
	JobName     *string                `json:"job_name"`
	Description *string                `json:"description"`
	Payload     map[string]interface{} `json:"payload"`
	ScheduledAt *string                `json:"scheduled_at"`
	Priority    *int                   `json:"priority"`
	MaxRetries  *int                   `json:"max_retries"`
	RetryDelay  *int                   `json:"retry_delay"`
	TimeoutSec  *int                   `json:"timeout_sec"`
	Tags        []string               `json:"tags"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// GetByID gets job by ID
func (s *SystemJobService) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemJob, error) {
	return s.jobRepo.GetByID(ctx, id)
}

// ListJobs lists jobs
func (s *SystemJobService) ListJobs(ctx context.Context, jobType, status string, page, limit int) ([]*models.SystemJob, int64, error) {
	offset := (page - 1) * limit
	return s.jobRepo.List(ctx, jobType, status, limit, offset)
}

// CreateJob creates a new job
func (s *SystemJobService) CreateJob(ctx context.Context, req CreateSystemJobRequest) (*models.SystemJob, error) {
	// Validate job type
	validTypes := []string{"BACKUP", "IMPORT", "EXPORT", "CLEANUP", "SYNC", "NOTIFICATION", "REPORT", "ANALYTICS", "MAINTENANCE", "CUSTOM"}
	if !containsString(validTypes, req.JobType) {
		return nil, fmt.Errorf("invalid job type, must be one of: %v", validTypes)
	}

	priority := req.Priority
	if priority == 0 {
		priority = 5 // Default priority
	}

	maxRetries := req.MaxRetries
	if maxRetries == 0 {
		maxRetries = 3
	}

	retryDelay := req.RetryDelay
	if retryDelay == 0 {
		retryDelay = 60 // 60 seconds
	}

	var scheduledAt *time.Time
	if req.ScheduledAt != nil && *req.ScheduledAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ScheduledAt)
		if err == nil {
			scheduledAt = &parsed
		}
	}

	payload := req.Payload
	if payload == nil {
		payload = make(map[string]interface{})
	}

	dependencies := req.Dependencies
	if dependencies == nil {
		dependencies = []string{}
	}

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	job := &models.SystemJob{
		ID:           uuid.New(),
		JobName:      req.JobName,
		JobType:      req.JobType,
		Description:  req.Description,
		Status:       "pending",
		Payload:      payload,
		ScheduledAt:  scheduledAt,
		Priority:     priority,
		RetryCount:   0,
		MaxRetries:   maxRetries,
		RetryDelay:   retryDelay,
		TimeoutSec:   req.TimeoutSec,
		Dependencies: dependencies,
		Tags:         tags,
		Metadata:     metadata,
		CreatedBy:    req.CreatedBy,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.jobRepo.Create(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to create job: %w", err)
	}

	return job, nil
}

// UpdateJob updates a job
func (s *SystemJobService) UpdateJob(ctx context.Context, id uuid.UUID, req UpdateSystemJobRequest) (*models.SystemJob, error) {
	job, err := s.jobRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("job not found: %w", err)
	}

	// Only allow updates for pending jobs
	if job.Status != "pending" {
		return nil, fmt.Errorf("cannot update job with status: %s", job.Status)
	}

	if req.JobName != nil {
		job.JobName = *req.JobName
	}
	if req.Description != nil {
		job.Description = req.Description
	}
	if req.Payload != nil {
		job.Payload = req.Payload
	}
	if req.ScheduledAt != nil && *req.ScheduledAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ScheduledAt)
		if err == nil {
			job.ScheduledAt = &parsed
		}
	}
	if req.Priority != nil {
		job.Priority = *req.Priority
	}
	if req.MaxRetries != nil {
		job.MaxRetries = *req.MaxRetries
	}
	if req.RetryDelay != nil {
		job.RetryDelay = *req.RetryDelay
	}
	if req.TimeoutSec != nil {
		job.TimeoutSec = req.TimeoutSec
	}
	if req.Tags != nil {
		job.Tags = req.Tags
	}
	if req.Metadata != nil {
		job.Metadata = req.Metadata
	}

	job.UpdatedAt = time.Now()

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to update job: %w", err)
	}

	return job, nil
}

// DeleteJob deletes a job
func (s *SystemJobService) DeleteJob(ctx context.Context, id uuid.UUID) error {
	job, err := s.jobRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Only allow deleting pending or failed jobs
	if job.Status != "pending" && job.Status != "failed" && job.Status != "completed" {
		return fmt.Errorf("cannot delete job with status: %s", job.Status)
	}

	return s.jobRepo.Delete(ctx, id)
}

// ExecuteJob executes a job
func (s *SystemJobService) ExecuteJob(ctx context.Context, id uuid.UUID) (*models.SystemJob, error) {
	job, err := s.jobRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("job not found: %w", err)
	}

	if job.Status != "pending" {
		return nil, fmt.Errorf("job is not pending, current status: %s", job.Status)
	}

	// Update status to running
	now := time.Now()
	job.Status = "running"
	job.StartedAt = &now
	job.UpdatedAt = now

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to update job: %w", err)
	}

	// Execute job asynchronously
	go s.executeJobAsync(job)

	return job, nil
}

// CancelJob cancels a job
func (s *SystemJobService) CancelJob(ctx context.Context, id uuid.UUID) (*models.SystemJob, error) {
	job, err := s.jobRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("job not found: %w", err)
	}

	if job.Status != "pending" && job.Status != "running" {
		return nil, fmt.Errorf("cannot cancel job with status: %s", job.Status)
	}

	job.Status = "cancelled"
	job.UpdatedAt = time.Now()

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to cancel job: %w", err)
	}

	return job, nil
}

// RetryJob retries a failed job
func (s *SystemJobService) RetryJob(ctx context.Context, id uuid.UUID) (*models.SystemJob, error) {
	job, err := s.jobRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("job not found: %w", err)
	}

	if job.Status != "failed" {
		return nil, fmt.Errorf("can only retry failed jobs, current status: %s", job.Status)
	}

	if job.RetryCount >= job.MaxRetries {
		return nil, fmt.Errorf("max retries reached (%d/%d)", job.RetryCount, job.MaxRetries)
	}

	job.Status = "pending"
	job.RetryCount++
	job.ErrorMessage = nil
	job.UpdatedAt = time.Now()

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return nil, fmt.Errorf("failed to retry job: %w", err)
	}

	return job, nil
}

// GetPendingJobs gets pending jobs
func (s *SystemJobService) GetPendingJobs(ctx context.Context, limit int) ([]*models.SystemJob, error) {
	jobs, _, err := s.jobRepo.List(ctx, "", "pending", limit, 0)
	if err != nil {
		return nil, err
	}

	// Filter by scheduled time
	now := time.Now()
	ready := make([]*models.SystemJob, 0)
	for _, job := range jobs {
		if job.ScheduledAt == nil || job.ScheduledAt.Before(now) {
			ready = append(ready, job)
		}
	}

	return ready, nil
}

// GetRunningJobs gets running jobs
func (s *SystemJobService) GetRunningJobs(ctx context.Context) ([]*models.SystemJob, error) {
	jobs, _, err := s.jobRepo.List(ctx, "", "running", 1000, 0)
	return jobs, err
}

// GetJobStats gets job statistics
func (s *SystemJobService) GetJobStats(ctx context.Context) (map[string]interface{}, error) {
	// Get counts by status
	statuses := []string{"pending", "running", "completed", "failed", "cancelled"}
	counts := make(map[string]int64)

	for _, status := range statuses {
		_, total, err := s.jobRepo.List(ctx, "", status, 1, 0)
		if err == nil {
			counts[status] = total
		}
	}

	stats := map[string]interface{}{
		"total":     counts["pending"] + counts["running"] + counts["completed"] + counts["failed"] + counts["cancelled"],
		"pending":   counts["pending"],
		"running":   counts["running"],
		"completed": counts["completed"],
		"failed":    counts["failed"],
		"cancelled": counts["cancelled"],
	}

	return stats, nil
}

// executeJobAsync executes job asynchronously
func (s *SystemJobService) executeJobAsync(job *models.SystemJob) {
	ctx := context.Background()

	// Simulate job execution
	time.Sleep(2 * time.Second)

	// Mock: In production, this would execute the actual job based on job.JobType
	success := true // Simulate success

	now := time.Now()
	if success {
		job.Status = "completed"
		job.CompletedAt = &now
		job.Progress = 100
	} else {
		job.Status = "failed"
		errorMsg := "Job execution failed"
		job.ErrorMessage = &errorMsg
	}

	job.UpdatedAt = now
	_ = s.jobRepo.Update(ctx, job)
}

func containsString(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
