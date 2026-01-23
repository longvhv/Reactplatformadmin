package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type APIKeyService struct {
	apiKeyRepo repository.APIKeyRepository
}

func NewAPIKeyService(apiKeyRepo repository.APIKeyRepository) *APIKeyService {
	return &APIKeyService{
		apiKeyRepo: apiKeyRepo,
	}
}

type CreateAPIKeyRequest struct {
	TenantID    uuid.UUID `json:"tenant_id" binding:"required"`
	Name        string    `json:"name" binding:"required"`
	Description *string   `json:"description"`
	ExpiresAt   *string   `json:"expires_at"`
	Scopes      []string  `json:"scopes"`
	RateLimit   *int      `json:"rate_limit"`
	CreatedBy   uuid.UUID `json:"-"`
}

type UpdateAPIKeyRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	ExpiresAt   *string  `json:"expires_at"`
	Scopes      []string `json:"scopes"`
	RateLimit   *int     `json:"rate_limit"`
}

// GetByID gets API key by ID
func (s *APIKeyService) GetByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	return s.apiKeyRepo.GetByID(ctx, id)
}

// GetByKeyHash gets API key by key hash
func (s *APIKeyService) GetByKeyHash(ctx context.Context, keyHash string) (*models.APIKey, error) {
	return s.apiKeyRepo.GetByKeyHash(ctx, keyHash)
}

// ListByTenant lists API keys by tenant
func (s *APIKeyService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.APIKey, int64, error) {
	offset := (page - 1) * limit
	return s.apiKeyRepo.ListByTenant(ctx, tenantID, limit, offset)
}

// CreateAPIKey creates a new API key
func (s *APIKeyService) CreateAPIKey(ctx context.Context, req CreateAPIKeyRequest) (*models.APIKey, string, error) {
	// Generate random API key
	plainKey, prefix, keyHash, err := s.generateAPIKey()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate API key: %w", err)
	}

	scopes := req.Scopes
	if scopes == nil {
		scopes = []string{}
	}

	var expiresAt *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			expiresAt = &parsed
		}
	}

	apiKey := &models.APIKey{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		Name:        req.Name,
		Description: req.Description,
		KeyPrefix:   prefix,
		KeyHash:     keyHash,
		Scopes:      scopes,
		RateLimit:   req.RateLimit,
		ExpiresAt:   expiresAt,
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CreatedBy:   &req.CreatedBy,
		Version:     1,
	}

	if err := s.apiKeyRepo.Create(ctx, apiKey); err != nil {
		return nil, "", fmt.Errorf("failed to create API key: %w", err)
	}

	return apiKey, plainKey, nil
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
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			apiKey.ExpiresAt = &parsed
		}
	}
	if req.Scopes != nil {
		apiKey.Scopes = req.Scopes
	}
	if req.RateLimit != nil {
		apiKey.RateLimit = req.RateLimit
	}

	apiKey.UpdatedAt = time.Now()
	apiKey.Version++

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, fmt.Errorf("failed to update API key: %w", err)
	}

	return apiKey, nil
}

// DeleteAPIKey deletes an API key
func (s *APIKeyService) DeleteAPIKey(ctx context.Context, id uuid.UUID) error {
	return s.apiKeyRepo.Delete(ctx, id)
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
	apiKey.Version++

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, fmt.Errorf("failed to revoke API key: %w", err)
	}

	return apiKey, nil
}

// RotateAPIKey rotates an API key (generates new key)
func (s *APIKeyService) RotateAPIKey(ctx context.Context, id uuid.UUID) (*models.APIKey, string, error) {
	apiKey, err := s.apiKeyRepo.GetByID(ctx, id)
	if err != nil {
		return nil, "", fmt.Errorf("API key not found: %w", err)
	}

	// Generate new key
	plainKey, prefix, keyHash, err := s.generateAPIKey()
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate API key: %w", err)
	}

	now := time.Now()
	apiKey.KeyPrefix = prefix
	apiKey.KeyHash = keyHash
	apiKey.LastUsedAt = nil
	apiKey.UsageCount = 0
	apiKey.UpdatedAt = now
	apiKey.Version++

	if err := s.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, "", fmt.Errorf("failed to rotate API key: %w", err)
	}

	return apiKey, plainKey, nil
}

// ValidateAPIKey validates an API key
func (s *APIKeyService) ValidateAPIKey(ctx context.Context, plainKey string) (*models.APIKey, error) {
	// Extract prefix (first 8 chars)
	if len(plainKey) < 8 {
		return nil, fmt.Errorf("invalid API key format")
	}

	// Hash the key
	keyHash := s.hashKey(plainKey)

	// Get key by hash
	apiKey, err := s.apiKeyRepo.GetByKeyHash(ctx, keyHash)
	if err != nil {
		return nil, fmt.Errorf("invalid API key")
	}

	// Check if active
	if !apiKey.IsActive {
		return nil, fmt.Errorf("API key is revoked")
	}

	// Check expiration
	if apiKey.ExpiresAt != nil && apiKey.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("API key has expired")
	}

	// Update last used
	now := time.Now()
	apiKey.LastUsedAt = &now
	apiKey.UsageCount++
	_ = s.apiKeyRepo.Update(ctx, apiKey)

	return apiKey, nil
}

// Helper functions
func (s *APIKeyService) generateAPIKey() (plainKey, prefix, keyHash string, err error) {
	// Generate 32 random bytes
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", "", err
	}

	// Encode to base64
	plainKey = base64.RawURLEncoding.EncodeToString(randomBytes)

	// Add prefix for identification
	plainKey = "vhv_" + plainKey

	// Get prefix (first 8 chars)
	prefix = plainKey[:8]

	// Hash for storage
	keyHash = s.hashKey(plainKey)

	return plainKey, prefix, keyHash, nil
}

func (s *APIKeyService) hashKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return base64.RawURLEncoding.EncodeToString(hash[:])
}
