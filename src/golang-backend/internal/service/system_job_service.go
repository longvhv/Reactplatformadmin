package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type SystemJobService interface {
	CreateJob(ctx context.Context, req *models.CreateSystemJobRequest) (*models.SystemJob, error)
	GetJob(ctx context.Context, id uuid.UUID) (*models.SystemJob, error)
	ListJobs(ctx context.Context, page, pageSize int, status, jobType *string) ([]*models.SystemJob, int, error)
	UpdateJob(ctx context.Context, id uuid.UUID, req *models.UpdateSystemJobRequest) (*models.SystemJob, error)
	DeleteJob(ctx context.Context, id uuid.UUID) error
	UpdateJobStatus(ctx context.Context, id uuid.UUID, req *models.UpdateJobStatusRequest) error
	GetPendingJobs(ctx context.Context) ([]*models.SystemJob, error)
	GetJobsByType(ctx context.Context, jobType string) ([]*models.SystemJob, error)
}

type systemJobService struct {
	repo repository.SystemJobRepository
}

func NewSystemJobService(repo repository.SystemJobRepository) SystemJobService {
	return &systemJobService{repo: repo}
}

func (s *systemJobService) CreateJob(ctx context.Context, req *models.CreateSystemJobRequest) (*models.SystemJob, error) {
	job := &models.SystemJob{
		ID:             uuid.New(),
		JobName:        req.JobName,
		JobType:        req.JobType,
		Description:    req.Description,
		Status:         "pending",
		Priority:       req.Priority,
		ScheduleType:   req.ScheduleType,
		CronExpression: req.CronExpression,
		NextRunAt:      req.NextRunAt,
		RunCount:       0,
		SuccessCount:   0,
		FailureCount:   0,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	err := s.repo.Create(ctx, job)
	if err != nil {
		return nil, err
	}

	return job, nil
}

func (s *systemJobService) GetJob(ctx context.Context, id uuid.UUID) (*models.SystemJob, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *systemJobService) ListJobs(ctx context.Context, page, pageSize int, status, jobType *string) ([]*models.SystemJob, int, error) {
	return s.repo.List(ctx, page, pageSize, status, jobType)
}

func (s *systemJobService) UpdateJob(ctx context.Context, id uuid.UUID, req *models.UpdateSystemJobRequest) (*models.SystemJob, error) {
	job, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.JobName != nil {
		job.JobName = *req.JobName
	}
	if req.Description != nil {
		job.Description = req.Description
	}
	if req.Status != nil {
		job.Status = *req.Status
	}
	if req.Priority != nil {
		job.Priority = *req.Priority
	}
	if req.ScheduleType != nil {
		job.ScheduleType = req.ScheduleType
	}
	if req.CronExpression != nil {
		job.CronExpression = req.CronExpression
	}
	if req.NextRunAt != nil {
		job.NextRunAt = req.NextRunAt
	}
	if req.IsActive != nil {
		job.IsActive = *req.IsActive
	}

	err = s.repo.Update(ctx, job)
	if err != nil {
		return nil, err
	}

	return job, nil
}

func (s *systemJobService) DeleteJob(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *systemJobService) UpdateJobStatus(ctx context.Context, id uuid.UUID, req *models.UpdateJobStatusRequest) error {
	return s.repo.UpdateStatus(ctx, id, req.Status, req.LastRunDuration, req.LastRunError)
}

func (s *systemJobService) GetPendingJobs(ctx context.Context) ([]*models.SystemJob, error) {
	return s.repo.GetPendingJobs(ctx)
}

func (s *systemJobService) GetJobsByType(ctx context.Context, jobType string) ([]*models.SystemJob, error) {
	return s.repo.GetJobsByType(ctx, jobType)
}
