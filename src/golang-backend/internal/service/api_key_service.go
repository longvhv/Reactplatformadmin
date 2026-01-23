package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type APIKeyService struct {
	apiKeyRepo   repository.APIKeyRepository
	cacheService *CacheService
}

func NewAPIKeyService(apiKeyRepo repository.APIKeyRepository, cacheService *CacheService) *APIKeyService {
	return &APIKeyService{
		apiKeyRepo:   apiKeyRepo,
		cacheService: cacheService,
	}
}

type CreateAPIKeyRequest struct {
	TenantID    uuid.UUID `json:"tenant_id" binding:"required"`
	Name        string    `json:"name" binding:"required"`
	Description *string   `json:"description"`
	Scopes      []string  `json:"scopes" binding:"required"`
	ExpiresIn   *int      `json:"expires_in"` // days
	RateLimits  map[string]interface{} `json:"rate_limits"`
	IPWhitelist []string  `json:"ip_whitelist"`
	CreatedBy   uuid.UUID `json:"-"`
}

type UpdateAPIKeyRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	Scopes      []string               `json:"scopes"`
	RateLimits  map[string]interface{} `json:"rate_limits"`
	IPWhitelist []string               `json:"ip_whitelist"`
}

// GetByID gets API key by ID
func (s *APIKeyService) GetByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	return s.apiKeyRepo.GetByID(ctx, id)
}

// ListByTenant lists API keys by tenant
func (s *APIKeyService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, page, limit int) ([]*models.APIKey, int64, error) {
	offset := (page - 1) * limit
	return s.apiKeyRepo.ListByTenant(ctx, tenantID, status, limit, offset)
}

// CreateAPIKey creates a new API key
func (s *APIKeyService) CreateAPIKey(ctx context.Context, req CreateAPIKeyRequest) (*models.APIKey, error) {
	// Validate scopes
	validScopes := []string{
		"read", "write", "delete",
		"users:read", "users:write", "users:delete",
		"tenants:read", "tenants:write",
		"orders:read", "orders:write",
		"payments:read", "payments:write",
		"reports:read",
		"admin:*",
		"*",
	}

	for _, scope := range req.Scopes {
		if !s.isValidScope(scope, validScopes) {
			return nil, fmt.Errorf("invalid scope: %s", scope)
		}
	}

	// Generate API key
	keyValue, keyHash := s.generateAPIKey()

	rateLimits := req.RateLimits
	if rateLimits == nil {
		rateLimits = map[string]interface{}{
			"requests_per_minute": 60,
			"requests_per_hour":   3600,
			"requests_per_day":    100000,
		}
	}

	ipWhitelist := req.IPWhitelist
	if ipWhitelist == nil {
		ipWhitelist = []string{}
	}

	var expiresAt *time.Time
	if req.ExpiresIn != nil && *req.ExpiresIn > 0 {
		expiry := time.Now().AddDate(0, 0, *req.ExpiresIn)
		expiresAt = &expiry
	}

	apiKey := &models.APIKey{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		Name:        req.Name,
		KeyHash:     keyHash,
		Description: req.Description,
		Scopes:      req.Scopes,
		IsActive:    true,
		ExpiresAt:   expiresAt,
		RateLimits:  rateLimits,
		IPWhitelist: ipWhitelist,
		UsageCount:  0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CreatedBy:   &req.CreatedBy,
	}

	if err := s.apiKeyRepo.Create(ctx, apiKey); err != nil {
		return nil, fmt.Errorf("failed to create API key: %w", err)
	}

	// Return key with plaintext value (only time it's visible)
	apiKey.KeyHash = keyValue // Temporarily set for response
	return apiKey, nil
}

// UpdateAPIKey updates an API key
func (s *APIKeyService) UpdateAPIKey(ctx context.Context, id uuid.UUID, req UpdateAPIKeyRequest) (*models.APIKey, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("API key not found: %w", err)
	}

	if req.Name != nil {
		apiKey.Name = *req.Name
	}
	if req.Description != nil {
		apiKey.Description = req.Description
	}
	if req.Scopes != nil {
		apiKey.Scopes = req.Scopes
	}
	if req.RateLimits != nil {
		apiKey.RateLimits = req.RateLimits
	}
	if req.IPWhitelist != nil {
		apiKey.IPWhitelist = req.IPWhitelist
	}

	apiKey.UpdatedAt = time.Now()

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, fmt.Errorf("failed to update API key: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, apiKey.KeyHash)

	return apiKey, nil
}

// DeleteAPIKey deletes an API key
func (s *APIKeyService) DeleteAPIKey(ctx context.Context, id uuid.UUID) error {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := s.apiKeyRepo.Delete(ctx, id); err != nil {
		return err
	}

	// Invalidate cache
	s.invalidateCache(ctx, apiKey.KeyHash)

	return nil
}

// RevokeAPIKey revokes an API key
func (s *APIKeyService) RevokeAPIKey(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("API key not found: %w", err)
	}

	now := time.Now()
	apiKey.IsActive = false
	apiKey.RevokedAt = &now
	apiKey.UpdatedAt = now

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, fmt.Errorf("failed to revoke API key: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, apiKey.KeyHash)

	return apiKey, nil
}

// ActivateAPIKey activates an API key
func (s *APIKeyService) ActivateAPIKey(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("API key not found: %w", err)
	}

	apiKey.IsActive = true
	apiKey.RevokedAt = nil
	apiKey.UpdatedAt = time.Now()

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, fmt.Errorf("failed to activate API key: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, apiKey.KeyHash)

	return apiKey, nil
}

// RotateAPIKey rotates an API key
func (s *APIKeyService) RotateAPIKey(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("API key not found: %w", err)
	}

	// Invalidate old cache
	s.invalidateCache(ctx, apiKey.KeyHash)

	// Generate new key
	keyValue, keyHash := s.generateAPIKey()
	apiKey.KeyHash = keyHash
	apiKey.UpdatedAt = time.Now()

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, fmt.Errorf("failed to rotate API key: %w", err)
	}

	// Return key with plaintext value
	apiKey.KeyHash = keyValue
	return apiKey, nil
}

// ValidateAPIKey validates an API key
func (s *APIKeyService) ValidateAPIKey(ctx context.Context, keyValue string) (*models.APIKey, bool, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("api_key:%s", s.hashKey(keyValue))
	var cached models.APIKey
	if s.cacheService != nil && s.cacheService.Get(ctx, cacheKey, &cached) == nil {
		return &cached, s.isKeyValid(&cached), nil
	}

	// Get from database
	keyHash := s.hashKey(keyValue)
	apiKey, err := s.apiKeyRepo.GetByHash(ctx, keyHash)
	if err != nil {
		return nil, false, err
	}

	// Cache for 5 minutes
	if s.cacheService != nil {
		_ = s.cacheService.Set(ctx, cacheKey, apiKey, 5*time.Minute)
	}

	valid := s.isKeyValid(apiKey)
	if valid {
		// Update usage stats
		go s.updateUsage(ctx, apiKey.ID)
	}

	return apiKey, valid, nil
}

// GetUsageStats gets API key usage statistics
func (s *APIKeyService) GetUsageStats(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("API key not found: %w", err)
	}

	stats := map[string]interface{}{
		"key_id":       apiKey.ID,
		"name":         apiKey.Name,
		"usage_count":  apiKey.UsageCount,
		"last_used_at": apiKey.LastUsedAt,
		"created_at":   apiKey.CreatedAt,
		"is_active":    apiKey.IsActive,
		"expires_at":   apiKey.ExpiresAt,
		"scopes":       apiKey.Scopes,
		"rate_limits":  apiKey.RateLimits,
	}

	// Calculate age
	age := time.Since(apiKey.CreatedAt)
	stats["age_days"] = int(age.Hours() / 24)

	// Calculate expiry
	if apiKey.ExpiresAt != nil {
		remaining := time.Until(*apiKey.ExpiresAt)
		stats["expires_in_days"] = int(remaining.Hours() / 24)
	}

	return stats, nil
}

// Helper functions
func (s *APIKeyService) generateAPIKey() (string, string) {
	// Generate 32 random bytes
	b := make([]byte, 32)
	rand.Read(b)

	// Encode to base64
	keyValue := "vhv_" + base64.URLEncoding.EncodeToString(b)

	// Hash for storage
	keyHash := s.hashKey(keyValue)

	return keyValue, keyHash
}

func (s *APIKeyService) hashKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

func (s *APIKeyService) isKeyValid(apiKey *models.APIKey) bool {
	// Check if active
	if !apiKey.IsActive {
		return false
	}

	// Check if revoked
	if apiKey.RevokedAt != nil {
		return false
	}

	// Check expiry
	if apiKey.ExpiresAt != nil && apiKey.ExpiresAt.Before(time.Now()) {
		return false
	}

	return true
}

func (s *APIKeyService) isValidScope(scope string, validScopes []string) bool {
	for _, valid := range validScopes {
		if valid == scope {
			return true
		}
		// Check wildcard
		if strings.HasSuffix(valid, ":*") {
			prefix := strings.TrimSuffix(valid, ":*")
			if strings.HasPrefix(scope, prefix) {
				return true
			}
		}
	}
	return false
}

func (s *APIKeyService) updateUsage(ctx context.Context, id uuid.UUID) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return
	}

	now := time.Now()
	apiKey.UsageCount++
	apiKey.LastUsedAt = &now
	apiKey.UpdatedAt = now

	_ = s.apiKeyRepo.Update(ctx, apiKey)
}

func (s *APIKeyService) invalidateCache(ctx context.Context, keyHash string) {
	if s.cacheService != nil {
		cacheKey := fmt.Sprintf("api_key:%s", keyHash)
		_ = s.cacheService.Delete(ctx, cacheKey)
	}
}

// CheckRateLimit checks if API key has exceeded rate limits
func (s *APIKeyService) CheckRateLimit(ctx context.Context, apiKey *models.APIKey) (bool, error) {
	// In production, use Redis to track rate limits
	// For now, always allow
	return true, nil
}

// HasScope checks if API key has required scope
func (s *APIKeyService) HasScope(apiKey *models.APIKey, requiredScope string) bool {
	for _, scope := range apiKey.Scopes {
		if scope == "*" || scope == requiredScope {
			return true
		}
		// Check wildcard scopes
		if strings.HasSuffix(scope, ":*") {
			prefix := strings.TrimSuffix(scope, ":*")
			if strings.HasPrefix(requiredScope, prefix) {
				return true
			}
		}
	}
	return false
}

// IsIPAllowed checks if IP is whitelisted
func (s *APIKeyService) IsIPAllowed(apiKey *models.APIKey, ip string) bool {
	// If no whitelist, allow all
	if len(apiKey.IPWhitelist) == 0 {
		return true
	}

	for _, allowedIP := range apiKey.IPWhitelist {
		if allowedIP == ip {
			return true
		}
		// Could add CIDR matching here
	}

	return false
}
