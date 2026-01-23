package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/cache"
)

type TenantRateLimitService struct {
	rateLimitRepo repository.TenantRateLimitRepository
	cache         cache.Cache
}

func NewTenantRateLimitService(rateLimitRepo repository.TenantRateLimitRepository, cache cache.Cache) *TenantRateLimitService {
	return &TenantRateLimitService{
		rateLimitRepo: rateLimitRepo,
		cache:         cache,
	}
}

type CreateTenantRateLimitRequest struct {
	TenantID          uuid.UUID  `json:"tenant_id" binding:"required"`
	ServicePackageID  *uuid.UUID `json:"service_package_id"`
	LimitName         string     `json:"limit_name" binding:"required"`
	LimitKey          string     `json:"limit_key" binding:"required"`
	ResourceType      *string    `json:"resource_type"`
	EndpointPattern   *string    `json:"endpoint_pattern"`
	MaxRequests       int        `json:"max_requests" binding:"required,gt=0"`
	TimeWindow        int        `json:"time_window" binding:"required,gt=0"`
	WindowUnit        string     `json:"window_unit"`
	BurstLimit        *int       `json:"burst_limit"`
	ConcurrentLimit   *int       `json:"concurrent_limit"`
	LimitType         string     `json:"limit_type"`
	LimitScope        string     `json:"limit_scope"`
	IsEnabled         bool       `json:"is_enabled"`
	IsStrict          bool       `json:"is_strict"`
	BlockDuration     *int       `json:"block_duration"`
	RetryAfter        *int       `json:"retry_after"`
	CustomErrorMsg    *string    `json:"custom_error_message"`
	CustomErrorCode   *string    `json:"custom_error_code"`
	AlertThreshold    *int       `json:"alert_threshold"`
	CreatedBy         uuid.UUID  `json:"-"`
}

type UpdateTenantRateLimitRequest struct {
	LimitName       *string `json:"limit_name"`
	MaxRequests     *int    `json:"max_requests"`
	TimeWindow      *int    `json:"time_window"`
	WindowUnit      *string `json:"window_unit"`
	BurstLimit      *int    `json:"burst_limit"`
	ConcurrentLimit *int    `json:"concurrent_limit"`
	IsEnabled       *bool   `json:"is_enabled"`
	IsStrict        *bool   `json:"is_strict"`
	BlockDuration   *int    `json:"block_duration"`
	RetryAfter      *int    `json:"retry_after"`
	CustomErrorMsg  *string `json:"custom_error_message"`
	CustomErrorCode *string `json:"custom_error_code"`
	AlertThreshold  *int    `json:"alert_threshold"`
	UpdatedBy       uuid.UUID `json:"-"`
}

// GetByID gets rate limit by ID
func (s *TenantRateLimitService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantRateLimit, error) {
	return s.rateLimitRepo.GetByID(ctx, id)
}

// GetByKey gets rate limit by key
func (s *TenantRateLimitService) GetByKey(ctx context.Context, tenantID uuid.UUID, limitKey string) (*models.TenantRateLimit, error) {
	cacheKey := cache.RateLimitCacheKey(tenantID.String(), limitKey)
	var rateLimit models.TenantRateLimit
	err := s.cache.GetJSON(ctx, cacheKey, &rateLimit)
	if err == nil {
		return &rateLimit, nil
	}

	dbRateLimit, err := s.rateLimitRepo.GetByKey(ctx, tenantID, limitKey)
	if err != nil {
		return nil, err
	}

	_ = s.cache.SetJSON(ctx, cacheKey, dbRateLimit, cache.RateLimitTTL)
	return dbRateLimit, nil
}

// ListByTenant lists rate limits by tenant
func (s *TenantRateLimitService) ListByTenant(ctx context.Context, tenantID uuid.UUID, resourceType string, page, limit int) ([]*models.TenantRateLimit, int64, error) {
	offset := (page - 1) * limit
	return s.rateLimitRepo.ListByTenant(ctx, tenantID, resourceType, limit, offset)
}

// CreateRateLimit creates a new rate limit
func (s *TenantRateLimitService) CreateRateLimit(ctx context.Context, req CreateTenantRateLimitRequest) (*models.TenantRateLimit, error) {
	// Check if limit key exists
	exists, err := s.rateLimitRepo.ExistsByKey(ctx, req.TenantID, req.LimitKey)
	if err != nil {
		return nil, fmt.Errorf("failed to check limit key: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("rate limit key already exists")
	}

	windowUnit := req.WindowUnit
	if windowUnit == "" {
		windowUnit = "second"
	}

	limitType := req.LimitType
	if limitType == "" {
		limitType = "sliding_window"
	}

	limitScope := req.LimitScope
	if limitScope == "" {
		limitScope = "tenant"
	}

	rateLimit := &models.TenantRateLimit{
		ID:               uuid.New(),
		TenantID:         req.TenantID,
		ServicePackageID: req.ServicePackageID,
		LimitName:        req.LimitName,
		LimitKey:         req.LimitKey,
		ResourceType:     req.ResourceType,
		EndpointPattern:  req.EndpointPattern,
		MaxRequests:      req.MaxRequests,
		TimeWindow:       req.TimeWindow,
		WindowUnit:       windowUnit,
		BurstLimit:       req.BurstLimit,
		ConcurrentLimit:  req.ConcurrentLimit,
		LimitType:        limitType,
		LimitScope:       limitScope,
		IsEnabled:        req.IsEnabled,
		IsStrict:         req.IsStrict,
		BlockDuration:    req.BlockDuration,
		RetryAfter:       req.RetryAfter,
		CustomErrorMsg:   req.CustomErrorMsg,
		CustomErrorCode:  req.CustomErrorCode,
		CurrentUsage:     0,
		PeakUsage:        0,
		ExceededCount:    0,
		AlertThreshold:   req.AlertThreshold,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		CreatedBy:        &req.CreatedBy,
	}

	if err := s.rateLimitRepo.Create(ctx, rateLimit); err != nil {
		return nil, fmt.Errorf("failed to create rate limit: %w", err)
	}

	return rateLimit, nil
}

// UpdateRateLimit updates a rate limit
func (s *TenantRateLimitService) UpdateRateLimit(ctx context.Context, id uuid.UUID, req UpdateTenantRateLimitRequest) (*models.TenantRateLimit, error) {
	rateLimit, err := s.rateLimitRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("rate limit not found: %w", err)
	}

	if req.LimitName != nil {
		rateLimit.LimitName = *req.LimitName
	}
	if req.MaxRequests != nil {
		rateLimit.MaxRequests = *req.MaxRequests
	}
	if req.TimeWindow != nil {
		rateLimit.TimeWindow = *req.TimeWindow
	}
	if req.WindowUnit != nil {
		rateLimit.WindowUnit = *req.WindowUnit
	}
	if req.BurstLimit != nil {
		rateLimit.BurstLimit = req.BurstLimit
	}
	if req.ConcurrentLimit != nil {
		rateLimit.ConcurrentLimit = req.ConcurrentLimit
	}
	if req.IsEnabled != nil {
		rateLimit.IsEnabled = *req.IsEnabled
	}
	if req.IsStrict != nil {
		rateLimit.IsStrict = *req.IsStrict
	}
	if req.BlockDuration != nil {
		rateLimit.BlockDuration = req.BlockDuration
	}
	if req.RetryAfter != nil {
		rateLimit.RetryAfter = req.RetryAfter
	}
	if req.CustomErrorMsg != nil {
		rateLimit.CustomErrorMsg = req.CustomErrorMsg
	}
	if req.CustomErrorCode != nil {
		rateLimit.CustomErrorCode = req.CustomErrorCode
	}
	if req.AlertThreshold != nil {
		rateLimit.AlertThreshold = req.AlertThreshold
	}

	rateLimit.UpdatedAt = time.Now()
	rateLimit.UpdatedBy = &req.UpdatedBy

	if err := s.rateLimitRepo.Update(ctx, rateLimit); err != nil {
		return nil, fmt.Errorf("failed to update rate limit: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.RateLimitCacheKey(rateLimit.TenantID.String(), rateLimit.LimitKey)
	_ = s.cache.Delete(ctx, cacheKey)

	return rateLimit, nil
}

// DeleteRateLimit deletes a rate limit
func (s *TenantRateLimitService) DeleteRateLimit(ctx context.Context, id uuid.UUID) error {
	rateLimit, err := s.rateLimitRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("rate limit not found: %w", err)
	}

	if err := s.rateLimitRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete rate limit: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.RateLimitCacheKey(rateLimit.TenantID.String(), rateLimit.LimitKey)
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}

// CheckLimit checks if request is within rate limit
func (s *TenantRateLimitService) CheckLimit(ctx context.Context, tenantID uuid.UUID, limitKey string, userID *uuid.UUID) (bool, int, time.Time, error) {
	rateLimit, err := s.GetByKey(ctx, tenantID, limitKey)
	if err != nil {
		return false, 0, time.Time{}, err
	}

	if !rateLimit.IsEnabled {
		return true, rateLimit.MaxRequests, time.Time{}, nil
	}

	// Build cache key based on scope
	rateLimitKey := s.buildRateLimitKey(rateLimit, tenantID, userID)

	// Get current count from Redis
	count, err := s.cache.Increment(ctx, rateLimitKey, 1)
	if err != nil {
		return false, 0, time.Time{}, fmt.Errorf("failed to increment counter: %w", err)
	}

	// Set expiration on first increment
	if count == 1 {
		windowDuration := s.getWindowDuration(rateLimit.TimeWindow, rateLimit.WindowUnit)
		_ = s.cache.SetExpiration(ctx, rateLimitKey, windowDuration)
	}

	// Check if exceeded
	allowed := int(count) <= rateLimit.MaxRequests
	remaining := rateLimit.MaxRequests - int(count)
	if remaining < 0 {
		remaining = 0
	}

	// Calculate reset time
	ttl, _ := s.cache.GetTTL(ctx, rateLimitKey)
	resetAt := time.Now().Add(ttl)

	// Update usage stats if exceeded
	if !allowed {
		s.recordExceeded(ctx, rateLimit.ID, int(count))
	}

	return allowed, remaining, resetAt, nil
}

// ResetUsage resets rate limit usage
func (s *TenantRateLimitService) ResetUsage(ctx context.Context, id uuid.UUID) error {
	rateLimit, err := s.rateLimitRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("rate limit not found: %w", err)
	}

	rateLimit.CurrentUsage = 0
	rateLimit.UpdatedAt = time.Now()

	return s.rateLimitRepo.Update(ctx, rateLimit)
}

// GetStats gets rate limit statistics
func (s *TenantRateLimitService) GetStats(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	rateLimit, err := s.rateLimitRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("rate limit not found: %w", err)
	}

	stats := map[string]interface{}{
		"limit_key":         rateLimit.LimitKey,
		"max_requests":      rateLimit.MaxRequests,
		"current_usage":     rateLimit.CurrentUsage,
		"peak_usage":        rateLimit.PeakUsage,
		"exceeded_count":    rateLimit.ExceededCount,
		"last_exceeded_at":  rateLimit.LastExceededAt,
		"usage_percentage":  float64(rateLimit.CurrentUsage) / float64(rateLimit.MaxRequests) * 100,
	}

	return stats, nil
}

// Helper functions
func (s *TenantRateLimitService) buildRateLimitKey(rateLimit *models.TenantRateLimit, tenantID uuid.UUID, userID *uuid.UUID) string {
	switch rateLimit.LimitScope {
	case "user":
		if userID != nil {
			return fmt.Sprintf("ratelimit:%s:%s:user:%s", tenantID.String(), rateLimit.LimitKey, userID.String())
		}
		return fmt.Sprintf("ratelimit:%s:%s:tenant", tenantID.String(), rateLimit.LimitKey)
	case "tenant":
		return fmt.Sprintf("ratelimit:%s:%s:tenant", tenantID.String(), rateLimit.LimitKey)
	default:
		return fmt.Sprintf("ratelimit:%s:%s", tenantID.String(), rateLimit.LimitKey)
	}
}

func (s *TenantRateLimitService) getWindowDuration(window int, unit string) time.Duration {
	switch unit {
	case "second":
		return time.Duration(window) * time.Second
	case "minute":
		return time.Duration(window) * time.Minute
	case "hour":
		return time.Duration(window) * time.Hour
	case "day":
		return time.Duration(window) * 24 * time.Hour
	case "month":
		return time.Duration(window) * 30 * 24 * time.Hour
	default:
		return time.Duration(window) * time.Second
	}
}

func (s *TenantRateLimitService) recordExceeded(ctx context.Context, id uuid.UUID, currentCount int) {
	rateLimit, err := s.rateLimitRepo.GetByID(ctx, id)
	if err != nil {
		return
	}

	now := time.Now()
	rateLimit.ExceededCount++
	rateLimit.LastExceededAt = &now
	rateLimit.CurrentUsage = currentCount

	if currentCount > rateLimit.PeakUsage {
		rateLimit.PeakUsage = currentCount
	}

	_ = s.rateLimitRepo.Update(ctx, rateLimit)
}
