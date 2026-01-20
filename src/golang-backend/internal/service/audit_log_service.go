package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type AuditLogService interface {
	CreateLog(ctx context.Context, req *models.CreateAuditLogRequest) (*models.AuditLog, error)
	GetLog(ctx context.Context, id uuid.UUID) (*models.AuditLog, error)
	ListLogs(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, resource, status *string, startTime, endTime *time.Time) ([]*models.AuditLog, int, error)
	ListLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuditLog, error)
	ListLogsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuditLog, error)
	ListLogsByResource(ctx context.Context, resource string, resourceID string) ([]*models.AuditLog, error)
	ListLogsByAction(ctx context.Context, action string) ([]*models.AuditLog, error)
	ListLogsByIPAddress(ctx context.Context, ipAddress string) ([]*models.AuditLog, error)
	DeleteOldLogs(ctx context.Context, days int) (int64, error)
	GetStatsByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error)
	GetStatsByUser(ctx context.Context, userID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error)
}

type auditLogService struct {
	repo repository.AuditLogRepository
}

func NewAuditLogService(repo repository.AuditLogRepository) AuditLogService {
	return &auditLogService{repo: repo}
}

func (s *auditLogService) CreateLog(ctx context.Context, req *models.CreateAuditLogRequest) (*models.AuditLog, error) {
	log := &models.AuditLog{
		ID:        uuid.New(),
		EventTime: time.Now(),
	}

	if req.TenantID != nil {
		log.TenantID.String = req.TenantID.String()
		log.TenantID.Valid = true
	}

	if req.UserID != nil {
		log.UserID.String = req.UserID.String()
		log.UserID.Valid = true
	}

	if req.ImpersonatorID != nil {
		log.ImpersonatorID.String = req.ImpersonatorID.String()
		log.ImpersonatorID.Valid = true
	}

	if req.Action != "" {
		log.Action.String = req.Action
		log.Action.Valid = true
	}

	if req.Resource != "" {
		log.Resource.String = req.Resource
		log.Resource.Valid = true
	}

	if req.ResourceID != "" {
		log.ResourceID.String = req.ResourceID
		log.ResourceID.Valid = true
	}

	if req.IPAddress != "" {
		log.IPAddress.String = req.IPAddress
		log.IPAddress.Valid = true
	}

	if req.UserAgent != "" {
		log.UserAgent.String = req.UserAgent
		log.UserAgent.Valid = true
	}

	if req.Status != "" {
		log.Status.String = req.Status
		log.Status.Valid = true
	} else {
		log.Status.String = "success"
		log.Status.Valid = true
	}

	// Set details
	if req.Details != nil {
		detailsJSON, err := json.Marshal(req.Details)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal details: %w", err)
		}
		log.Details = detailsJSON
	}

	if err := s.repo.Create(ctx, log); err != nil {
		return nil, fmt.Errorf("failed to create audit log: %w", err)
	}

	return log, nil
}

func (s *auditLogService) GetLog(ctx context.Context, id uuid.UUID) (*models.AuditLog, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *auditLogService) ListLogs(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, resource, status *string, startTime, endTime *time.Time) ([]*models.AuditLog, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	return s.repo.List(ctx, page, pageSize, tenantID, userID, action, resource, status, startTime, endTime)
}

func (s *auditLogService) ListLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	if limit < 1 || limit > 1000 {
		limit = 100
	}
	return s.repo.ListByTenantID(ctx, tenantID, limit)
}

func (s *auditLogService) ListLogsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuditLog, error) {
	if limit < 1 || limit > 1000 {
		limit = 100
	}
	return s.repo.ListByUserID(ctx, userID, limit)
}

func (s *auditLogService) ListLogsByResource(ctx context.Context, resource string, resourceID string) ([]*models.AuditLog, error) {
	return s.repo.ListByResource(ctx, resource, resourceID)
}

func (s *auditLogService) ListLogsByAction(ctx context.Context, action string) ([]*models.AuditLog, error) {
	return s.repo.ListByAction(ctx, action)
}

func (s *auditLogService) ListLogsByIPAddress(ctx context.Context, ipAddress string) ([]*models.AuditLog, error) {
	return s.repo.ListByIPAddress(ctx, ipAddress)
}

func (s *auditLogService) DeleteOldLogs(ctx context.Context, days int) (int64, error) {
	if days < 1 {
		return 0, fmt.Errorf("days must be at least 1")
	}
	olderThan := time.Now().AddDate(0, 0, -days)
	return s.repo.DeleteOldLogs(ctx, olderThan)
}

func (s *auditLogService) GetStatsByTenant(ctx context.Context, tenantID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error) {
	return s.repo.GetStatsByTenant(ctx, tenantID, startTime, endTime)
}

func (s *auditLogService) GetStatsByUser(ctx context.Context, userID uuid.UUID, startTime, endTime time.Time) (map[string]interface{}, error) {
	return s.repo.GetStatsByUser(ctx, userID, startTime, endTime)
}
