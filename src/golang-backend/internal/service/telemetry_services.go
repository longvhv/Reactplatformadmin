package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type AuthLogService interface {
	CreateLog(ctx context.Context, req *models.CreateAuthLogRequest) (*models.AuthLog, error)
	GetLog(ctx context.Context, id uuid.UUID) (*models.AuthLog, error)
	ListLogs(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, status *string) ([]*models.AuthLog, int, error)
	ListLogsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuthLog, error)
	ListLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuthLog, error)
	DeleteOldLogs(ctx context.Context, days int) (int64, error)
}

type authLogService struct {
	repo repository.AuthLogRepository
}

func NewAuthLogService(repo repository.AuthLogRepository) AuthLogService {
	return &authLogService{repo: repo}
}

func (s *authLogService) CreateLog(ctx context.Context, req *models.CreateAuthLogRequest) (*models.AuthLog, error) {
	log := &models.AuthLog{
		ID:           uuid.New(),
		UserID:       req.UserID,
		TenantID:     req.TenantID,
		Action:       req.Action,
		Status:       req.Status,
		IPAddress:    req.IPAddress,
		UserAgent:    req.UserAgent,
		Browser:      req.Browser,
		OS:           req.OS,
		DeviceType:   req.DeviceType,
		Location:     req.Location,
		CountryCode:  req.CountryCode,
		ErrorMessage: req.ErrorMessage,
		Metadata:     req.Metadata,
		CreatedAt:    time.Now(),
	}
	err := s.repo.Create(ctx, log)
	return log, err
}

func (s *authLogService) GetLog(ctx context.Context, id uuid.UUID) (*models.AuthLog, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *authLogService) ListLogs(ctx context.Context, page, pageSize int, tenantID, userID *uuid.UUID, action, status *string) ([]*models.AuthLog, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, userID, action, status)
}

func (s *authLogService) ListLogsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]*models.AuthLog, error) {
	return s.repo.ListByUser(ctx, userID, limit)
}

func (s *authLogService) ListLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.AuthLog, error) {
	return s.repo.ListByTenant(ctx, tenantID, limit)
}

func (s *authLogService) DeleteOldLogs(ctx context.Context, days int) (int64, error) {
	before := time.Now().AddDate(0, 0, -days)
	return s.repo.DeleteOldLogs(ctx, before)
}

// Security Audit Log Service
type SecurityAuditLogService interface {
	CreateLog(ctx context.Context, req *models.CreateSecurityAuditLogRequest) (*models.SecurityAuditLog, error)
	GetLog(ctx context.Context, id uuid.UUID) (*models.SecurityAuditLog, error)
	ListLogs(ctx context.Context, page, pageSize int, tenantID, actorID *uuid.UUID) ([]*models.SecurityAuditLog, int, error)
	ListLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error)
	ListLogsByActor(ctx context.Context, actorID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error)
	DeleteOldLogs(ctx context.Context, days int) (int64, error)
}

type securityAuditLogService struct {
	repo repository.SecurityAuditLogRepository
}

func NewSecurityAuditLogService(repo repository.SecurityAuditLogRepository) SecurityAuditLogService {
	return &securityAuditLogService{repo: repo}
}

func (s *securityAuditLogService) CreateLog(ctx context.Context, req *models.CreateSecurityAuditLogRequest) (*models.SecurityAuditLog, error) {
	log := &models.SecurityAuditLog{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		ActorID:        req.ActorID,
		ImpersonatorID: req.ImpersonatorID,
		EventCategory:  req.EventCategory,
		EventAction:    req.EventAction,
		TargetID:       req.TargetID,
		ResourceType:   req.ResourceType,
		IPAddress:      req.IPAddress,
		UserAgent:      req.UserAgent,
		Details:        req.Details,
		CreatedAt:      time.Now(),
	}
	err := s.repo.Create(ctx, log)
	return log, err
}

func (s *securityAuditLogService) GetLog(ctx context.Context, id uuid.UUID) (*models.SecurityAuditLog, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *securityAuditLogService) ListLogs(ctx context.Context, page, pageSize int, tenantID, actorID *uuid.UUID) ([]*models.SecurityAuditLog, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, actorID)
}

func (s *securityAuditLogService) ListLogsByTenant(ctx context.Context, tenantID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error) {
	return s.repo.ListByTenant(ctx, tenantID, limit)
}

func (s *securityAuditLogService) ListLogsByActor(ctx context.Context, actorID uuid.UUID, limit int) ([]*models.SecurityAuditLog, error) {
	return s.repo.ListByActor(ctx, actorID, limit)
}

func (s *securityAuditLogService) DeleteOldLogs(ctx context.Context, days int) (int64, error) {
	before := time.Now().AddDate(0, 0, -days)
	return s.repo.DeleteOldLogs(ctx, before)
}

// API Usage Log Service
type APIUsageLogService interface {
	CreateLog(ctx context.Context, req *models.CreateAPIUsageLogRequest) (*models.APIUsageLog, error)
	GetLog(ctx context.Context, id uuid.UUID) (*models.APIUsageLog, error)
	ListLogs(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode *string) ([]*models.APIUsageLog, int, error)
	GetStats(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (map[string]interface{}, error)
	DeleteOldLogs(ctx context.Context, days int) (int64, error)
}

type apiUsageLogService struct {
	repo repository.APIUsageLogRepository
}

func NewAPIUsageLogService(repo repository.APIUsageLogRepository) APIUsageLogService {
	return &apiUsageLogService{repo: repo}
}

func (s *apiUsageLogService) CreateLog(ctx context.Context, req *models.CreateAPIUsageLogRequest) (*models.APIUsageLog, error) {
	requestSize := int64(0)
	if req.RequestSize != nil {
		requestSize = *req.RequestSize
	}
	responseSize := int64(0)
	if req.ResponseSize != nil {
		responseSize = *req.ResponseSize
	}

	log := &models.APIUsageLog{
		ID:           uuid.New(),
		TenantID:     req.TenantID,
		AppCode:      req.AppCode,
		APIEndpoint:  req.APIEndpoint,
		APIMethod:    req.APIMethod,
		StatusCode:   req.StatusCode,
		RequestSize:  requestSize,
		ResponseSize: responseSize,
		LatencyMs:    req.LatencyMs,
		APIKeyID:     req.APIKeyID,
		CreatedAt:    time.Now(),
	}
	err := s.repo.Create(ctx, log)
	return log, err
}

func (s *apiUsageLogService) GetLog(ctx context.Context, id uuid.UUID) (*models.APIUsageLog, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *apiUsageLogService) ListLogs(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, appCode *string) ([]*models.APIUsageLog, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, appCode)
}

func (s *apiUsageLogService) GetStats(ctx context.Context, tenantID uuid.UUID, from, to time.Time) (map[string]interface{}, error) {
	return s.repo.GetStats(ctx, tenantID, from, to)
}

func (s *apiUsageLogService) DeleteOldLogs(ctx context.Context, days int) (int64, error) {
	before := time.Now().AddDate(0, 0, -days)
	return s.repo.DeleteOldLogs(ctx, before)
}

// Content View Log, Traffic Log, User Registration Log services follow same pattern...
