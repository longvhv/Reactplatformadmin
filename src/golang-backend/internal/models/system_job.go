package models

import (
	"time"

	"github.com/google/uuid"
)

type SystemJob struct {
	ID               uuid.UUID  `json:"id" db:"id"`
	JobName          string     `json:"job_name" db:"job_name"`
	JobType          string     `json:"job_type" db:"job_type"`
	Description      *string    `json:"description,omitempty" db:"description"`
	Status           string     `json:"status" db:"status"` // pending, running, completed, failed
	Priority         string     `json:"priority" db:"priority"` // low, normal, high, urgent
	ScheduleType     *string    `json:"schedule_type,omitempty" db:"schedule_type"` // once, recurring, cron
	CronExpression   *string    `json:"cron_expression,omitempty" db:"cron_expression"`
	LastRunAt        *time.Time `json:"last_run_at,omitempty" db:"last_run_at"`
	NextRunAt        *time.Time `json:"next_run_at,omitempty" db:"next_run_at"`
	LastRunDuration  *int       `json:"last_run_duration,omitempty" db:"last_run_duration"` // in seconds
	LastRunStatus    *string    `json:"last_run_status,omitempty" db:"last_run_status"`
	LastRunError     *string    `json:"last_run_error,omitempty" db:"last_run_error"`
	RunCount         int        `json:"run_count" db:"run_count"`
	SuccessCount     int        `json:"success_count" db:"success_count"`
	FailureCount     int        `json:"failure_count" db:"failure_count"`
	IsActive         bool       `json:"is_active" db:"is_active"`
	CreatedBy        *string    `json:"created_by,omitempty" db:"created_by"`
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateSystemJobRequest struct {
	JobName        string  `json:"job_name" binding:"required"`
	JobType        string  `json:"job_type" binding:"required"`
	Description    *string `json:"description"`
	Priority       string  `json:"priority" binding:"required,oneof=low normal high urgent"`
	ScheduleType   *string `json:"schedule_type"`
	CronExpression *string `json:"cron_expression"`
	NextRunAt      *time.Time `json:"next_run_at"`
}

type UpdateSystemJobRequest struct {
	JobName        *string `json:"job_name"`
	Description    *string `json:"description"`
	Status         *string `json:"status"`
	Priority       *string `json:"priority"`
	ScheduleType   *string `json:"schedule_type"`
	CronExpression *string `json:"cron_expression"`
	NextRunAt      *time.Time `json:"next_run_at"`
	IsActive       *bool   `json:"is_active"`
}

type UpdateJobStatusRequest struct {
	Status          string  `json:"status" binding:"required"`
	LastRunDuration *int    `json:"last_run_duration"`
	LastRunError    *string `json:"last_run_error"`
}
