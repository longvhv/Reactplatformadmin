package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type APIKeyService struct {
	repo *repository.APIKeyRepository
}

func NewAPIKeyService(repo *repository.APIKeyRepository) *APIKeyService {
	return &APIKeyService{repo: repo}
}

// CreateAPIKey creates a new API key
func (s *APIKeyService) CreateAPIKey(req *models.CreateAPIKeyRequest) (*models.APIKeyResponse, error) {
	apiKey := &models.APIKey{
		TenantID:   req.TenantID,
		Name:       req.Name,
		Scopes:     pq.StringArray(req.Scopes),
		AllowedIPs: pq.StringArray(req.AllowedIPs),
		ExpiresAt:  req.ExpiresAt,
		CreatedBy:  req.CreatedBy,
	}

	if apiKey.Scopes == nil {
		apiKey.Scopes = pq.StringArray{}
	}
	if apiKey.AllowedIPs == nil {
		apiKey.AllowedIPs = pq.StringArray{}
	}

	plainKey, err := s.repo.Create(apiKey)
	if err != nil {
		return nil, err
	}

	return &models.APIKeyResponse{
		APIKey:   *apiKey,
		PlainKey: plainKey,
	}, nil
}

// GetAPIKey retrieves an API key by ID
func (s *APIKeyService) GetAPIKey(id uuid.UUID) (*models.APIKey, error) {
	return s.repo.GetByID(id)
}

// ListAPIKeys retrieves API keys with pagination and filters
func (s *APIKeyService) ListAPIKeys(page, pageSize int, filters map[string]interface{}) ([]models.APIKey, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	return s.repo.List(page, pageSize, filters)
}

// ListAPIKeysByTenant retrieves all API keys for a specific tenant
func (s *APIKeyService) ListAPIKeysByTenant(tenantID uuid.UUID, page, pageSize int) ([]models.APIKey, int, error) {
	return s.repo.ListByTenantID(tenantID, page, pageSize)
}

// UpdateAPIKey updates an API key
func (s *APIKeyService) UpdateAPIKey(id uuid.UUID, req *models.UpdateAPIKeyRequest) (*models.APIKey, error) {
	updates := make(map[string]interface{})

	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Scopes != nil {
		updates["scopes"] = pq.StringArray(req.Scopes)
	}
	if req.AllowedIPs != nil {
		updates["allowed_ips"] = pq.StringArray(req.AllowedIPs)
	}
	if req.ExpiresAt != nil {
		updates["expires_at"] = *req.ExpiresAt
	}

	return s.repo.Update(id, updates)
}

// DeleteAPIKey deletes an API key
func (s *APIKeyService) DeleteAPIKey(id uuid.UUID) error {
	return s.repo.Delete(id)
}

// ValidateAPIKey validates an API key
func (s *APIKeyService) ValidateAPIKey(plainKey string, ipAddress string) (*models.APIKey, error) {
	apiKey, err := s.repo.ValidateKey(plainKey)
	if err != nil {
		return nil, err
	}

	// Check IP address if allowed IPs are configured
	if len(apiKey.AllowedIPs) > 0 && ipAddress != "" {
		allowed := false
		for _, allowedIP := range apiKey.AllowedIPs {
			if allowedIP == ipAddress {
				allowed = true
				break
			}
		}
		if !allowed {
			return nil, fmt.Errorf("IP address not allowed")
		}
	}

	return apiKey, nil
}

// RevokeAPIKey revokes an API key by setting expiration to now
func (s *APIKeyService) RevokeAPIKey(id uuid.UUID) error {
	now := time.Now()
	updates := map[string]interface{}{
		"expires_at": now,
	}
	_, err := s.repo.Update(id, updates)
	return err
}
