package service

import (
	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type TenantRateLimitService struct {
	repo *repository.TenantRateLimitRepository
}

func NewTenantRateLimitService(repo *repository.TenantRateLimitRepository) *TenantRateLimitService {
	return &TenantRateLimitService{repo: repo}
}

func (s *TenantRateLimitService) CreateRateLimit(req *models.CreateTenantRateLimitRequest) (*models.TenantRateLimit, error) {
	limit := &models.TenantRateLimit{
		ID:                 uuid.New().String(),
		TenantID:           req.TenantID,
		ServicePackageID:   req.ServicePackageID,
		LimitName:          req.LimitName,
		LimitKey:           req.LimitKey,
		ResourceType:       req.ResourceType,
		EndpointPattern:    req.EndpointPattern,
		MaxRequests:        req.MaxRequests,
		TimeWindow:         req.TimeWindow,
		WindowUnit:         req.WindowUnit,
		BurstLimit:         req.BurstLimit,
		ConcurrentLimit:    req.ConcurrentLimit,
		LimitType:          req.LimitType,
		LimitScope:         req.LimitScope,
		IsEnabled:          req.IsEnabled,
		IsStrict:           req.IsStrict,
		BlockDuration:      req.BlockDuration,
		RetryAfter:         req.RetryAfter,
		CustomErrorMessage: req.CustomErrorMessage,
		CustomErrorCode:    req.CustomErrorCode,
		CurrentUsage:       0,
		PeakUsage:          0,
		ExceededCount:      0,
		AlertThreshold:     req.AlertThreshold,
		AlertEnabled:       req.AlertEnabled,
		Priority:           req.Priority,
		CanOverride:        req.CanOverride,
		Description:        req.Description,
		Tags:               models.StringArray(req.Tags),
		Metadata:           req.Metadata,
		CreatedBy:          req.CreatedBy,
	}

	err := s.repo.Create(limit)
	if err != nil {
		return nil, err
	}

	return limit, nil
}

func (s *TenantRateLimitService) GetRateLimit(id string) (*models.TenantRateLimit, error) {
	return s.repo.GetByID(id)
}

func (s *TenantRateLimitService) ListRateLimits(tenantID *string, resourceType *string, isEnabled *bool, page, pageSize int) ([]models.TenantRateLimit, int, error) {
	return s.repo.List(tenantID, resourceType, isEnabled, page, pageSize)
}

func (s *TenantRateLimitService) ListRateLimitsByTenant(tenantID string) ([]models.TenantRateLimit, error) {
	return s.repo.ListByTenantID(tenantID)
}

func (s *TenantRateLimitService) UpdateRateLimit(id string, req *models.UpdateTenantRateLimitRequest) error {
	return s.repo.Update(id, req)
}

func (s *TenantRateLimitService) DeleteRateLimit(id string) error {
	return s.repo.Delete(id)
}

func (s *TenantRateLimitService) IncrementUsage(id string) error {
	return s.repo.IncrementUsage(id)
}

func (s *TenantRateLimitService) ResetUsage(id string) error {
	return s.repo.ResetUsage(id)
}
