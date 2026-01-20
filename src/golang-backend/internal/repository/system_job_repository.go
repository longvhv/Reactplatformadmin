package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"golang-backend/internal/models"
)

type SystemJobRepository interface {
	Create(ctx context.Context, job *models.SystemJob) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SystemJob, error)
	List(ctx context.Context, page, pageSize int, status, jobType *string) ([]*models.SystemJob, int, error)
	Update(ctx context.Context, job *models.SystemJob) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string, duration *int, errorMsg *string) error
	GetPendingJobs(ctx context.Context) ([]*models.SystemJob, error)
	GetJobsByType(ctx context.Context, jobType string) ([]*models.SystemJob, error)
}

type systemJobRepository struct {
	db *sqlx.DB
}

func NewSystemJobRepository(db *sqlx.DB) SystemJobRepository {
	return &systemJobRepository{db: db}
}

func (r *systemJobRepository) Create(ctx context.Context, job *models.SystemJob) error {
	query := `
		INSERT INTO system_jobs (
			id, job_name, job_type, description, status, priority,
			schedule_type, cron_expression, next_run_at,
			run_count, success_count, failure_count, is_active,
			created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		)`

	_, err := r.db.ExecContext(ctx, query,
		job.ID, job.JobName, job.JobType, job.Description, job.Status, job.Priority,
		job.ScheduleType, job.CronExpression, job.NextRunAt,
		job.RunCount, job.SuccessCount, job.FailureCount, job.IsActive,
		job.CreatedBy, job.CreatedAt, job.UpdatedAt,
	)
	return err
}

func (r *systemJobRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemJob, error) {
	var job models.SystemJob
	query := `SELECT * FROM system_jobs WHERE id = $1`
	err := r.db.GetContext(ctx, &job, query, id)
	if err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *systemJobRepository) List(ctx context.Context, page, pageSize int, status, jobType *string) ([]*models.SystemJob, int, error) {
	offset := (page - 1) * pageSize

	whereClause := "WHERE 1=1"
	args := []interface{}{}
	argPos := 1

	if status != nil {
		whereClause += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *status)
		argPos++
	}

	if jobType != nil {
		whereClause += fmt.Sprintf(" AND job_type = $%d", argPos)
		args = append(args, *jobType)
		argPos++
	}

	// Get total count
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM system_jobs %s", whereClause)
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	query := fmt.Sprintf(`
		SELECT * FROM system_jobs %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argPos, argPos+1)

	args = append(args, pageSize, offset)

	var jobs []*models.SystemJob
	err = r.db.SelectContext(ctx, &jobs, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return jobs, total, nil
}

func (r *systemJobRepository) Update(ctx context.Context, job *models.SystemJob) error {
	query := `
		UPDATE system_jobs SET
			job_name = $1,
			description = $2,
			status = $3,
			priority = $4,
			schedule_type = $5,
			cron_expression = $6,
			next_run_at = $7,
			is_active = $8,
			updated_at = $9
		WHERE id = $10`

	job.UpdatedAt = time.Now()

	_, err := r.db.ExecContext(ctx, query,
		job.JobName, job.Description, job.Status, job.Priority,
		job.ScheduleType, job.CronExpression, job.NextRunAt,
		job.IsActive, job.UpdatedAt, job.ID,
	)
	return err
}

func (r *systemJobRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM system_jobs WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

func (r *systemJobRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, duration *int, errorMsg *string) error {
	now := time.Now()
	
	query := `
		UPDATE system_jobs SET
			status = $1,
			last_run_at = $2,
			last_run_status = $3,
			last_run_duration = $4,
			last_run_error = $5,
			run_count = run_count + 1,
			success_count = CASE WHEN $3 = 'completed' THEN success_count + 1 ELSE success_count END,
			failure_count = CASE WHEN $3 = 'failed' THEN failure_count + 1 ELSE failure_count END,
			updated_at = $6
		WHERE id = $7`

	_, err := r.db.ExecContext(ctx, query, status, now, status, duration, errorMsg, now, id)
	return err
}

func (r *systemJobRepository) GetPendingJobs(ctx context.Context) ([]*models.SystemJob, error) {
	query := `
		SELECT * FROM system_jobs
		WHERE status = 'pending'
		AND is_active = true
		AND (next_run_at IS NULL OR next_run_at <= $1)
		ORDER BY priority DESC, created_at ASC
	`

	var jobs []*models.SystemJob
	err := r.db.SelectContext(ctx, &jobs, query, time.Now())
	if err != nil {
		return nil, err
	}

	return jobs, nil
}

func (r *systemJobRepository) GetJobsByType(ctx context.Context, jobType string) ([]*models.SystemJob, error) {
	query := `SELECT * FROM system_jobs WHERE job_type = $1 ORDER BY created_at DESC`

	var jobs []*models.SystemJob
	err := r.db.SelectContext(ctx, &jobs, query, jobType)
	if err != nil {
		return nil, err
	}

	return jobs, nil
}
