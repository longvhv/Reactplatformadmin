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

type TenantSSOConfigService interface {
	CreateSSOConfig(ctx context.Context, req *models.CreateTenantSSOConfigRequest) (*models.TenantSSOConfig, error)
	GetSSOConfig(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error)
	ListSSOConfigs(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, provider, status *string) ([]*models.TenantSSOConfig, int, error)
	ListSSOConfigsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantSSOConfig, error)
	GetSSOConfigByTenantAndProvider(ctx context.Context, tenantID uuid.UUID, provider string) (*models.TenantSSOConfig, error)
	UpdateSSOConfig(ctx context.Context, id uuid.UUID, req *models.UpdateTenantSSOConfigRequest) (*models.TenantSSOConfig, error)
	DeleteSSOConfig(ctx context.Context, id uuid.UUID) error
	ActivateSSOConfig(ctx context.Context, id uuid.UUID) error
	DeactivateSSOConfig(ctx context.Context, id uuid.UUID) error
	TestSSOConfig(ctx context.Context, id uuid.UUID) error
}

type tenantSSOConfigService struct {
	repo repository.TenantSSOConfigRepository
}

func NewTenantSSOConfigService(repo repository.TenantSSOConfigRepository) TenantSSOConfigService {
	return &tenantSSOConfigService{repo: repo}
}

func (s *tenantSSOConfigService) CreateSSOConfig(ctx context.Context, req *models.CreateTenantSSOConfigRequest) (*models.TenantSSOConfig, error) {
	now := time.Now()
	config := &models.TenantSSOConfig{
		ID:        uuid.New(),
		TenantID:  req.TenantID,
		Provider:  req.Provider,
		Name:      req.Name,
		Status:    "INACTIVE",
		CreatedAt: now,
		UpdatedAt: now,
		Version:   1,
	}

	if req.Description != "" {
		config.Description.String = req.Description
		config.Description.Valid = true
	}

	if req.EntityID != "" {
		config.EntityID.String = req.EntityID
		config.EntityID.Valid = true
	}

	if req.SSOURL != "" {
		config.SSOURL.String = req.SSOURL
		config.SSOURL.Valid = true
	}

	if req.SLOURL != "" {
		config.SLOURL.String = req.SLOURL
		config.SLOURL.Valid = true
	}

	if req.Certificate != "" {
		config.Certificate.String = req.Certificate
		config.Certificate.Valid = true
	}

	if req.MetadataURL != "" {
		config.MetadataURL.String = req.MetadataURL
		config.MetadataURL.Valid = true
	}

	if req.ClientID != "" {
		config.ClientID.String = req.ClientID
		config.ClientID.Valid = true
	}

	if req.ClientSecret != "" {
		config.ClientSecret.String = req.ClientSecret
		config.ClientSecret.Valid = true
	}

	if req.AuthorizationEndpoint != "" {
		config.AuthorizationEndpoint.String = req.AuthorizationEndpoint
		config.AuthorizationEndpoint.Valid = true
	}

	if req.TokenEndpoint != "" {
		config.TokenEndpoint.String = req.TokenEndpoint
		config.TokenEndpoint.Valid = true
	}

	if req.UserinfoEndpoint != "" {
		config.UserinfoEndpoint.String = req.UserinfoEndpoint
		config.UserinfoEndpoint.Valid = true
	}

	if req.JWKSURI != "" {
		config.JWKSURI.String = req.JWKSURI
		config.JWKSURI.Valid = true
	}

	// Set scopes
	if req.Scopes != nil {
		scopesJSON, err := json.Marshal(req.Scopes)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal scopes: %w", err)
		}
		config.Scopes = scopesJSON
	} else {
		config.Scopes = []byte("[]")
	}

	// Set attribute mapping
	if req.AttributeMapping != nil {
		mappingJSON, err := json.Marshal(req.AttributeMapping)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal attribute mapping: %w", err)
		}
		config.AttributeMapping = mappingJSON
	} else {
		config.AttributeMapping = []byte("{}")
	}

	// Set settings
	if req.Settings != nil {
		settingsJSON, err := json.Marshal(req.Settings)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal settings: %w", err)
		}
		config.Settings = settingsJSON
	} else {
		config.Settings = []byte("{}")
	}

	if err := s.repo.Create(ctx, config); err != nil {
		return nil, fmt.Errorf("failed to create SSO config: %w", err)
	}

	return config, nil
}

func (s *tenantSSOConfigService) GetSSOConfig(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *tenantSSOConfigService) ListSSOConfigs(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, provider, status *string) ([]*models.TenantSSOConfig, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, provider, status)
}

func (s *tenantSSOConfigService) ListSSOConfigsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.TenantSSOConfig, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *tenantSSOConfigService) GetSSOConfigByTenantAndProvider(ctx context.Context, tenantID uuid.UUID, provider string) (*models.TenantSSOConfig, error) {
	return s.repo.GetByTenantAndProvider(ctx, tenantID, provider)
}

func (s *tenantSSOConfigService) UpdateSSOConfig(ctx context.Context, id uuid.UUID, req *models.UpdateTenantSSOConfigRequest) (*models.TenantSSOConfig, error) {
	config, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		config.Name = *req.Name
	}

	if req.Description != nil {
		if *req.Description == "" {
			config.Description.Valid = false
		} else {
			config.Description.String = *req.Description
			config.Description.Valid = true
		}
	}

	if req.Status != nil {
		config.Status = *req.Status
	}

	if req.EntityID != nil {
		if *req.EntityID == "" {
			config.EntityID.Valid = false
		} else {
			config.EntityID.String = *req.EntityID
			config.EntityID.Valid = true
		}
	}

	if req.SSOURL != nil {
		if *req.SSOURL == "" {
			config.SSOURL.Valid = false
		} else {
			config.SSOURL.String = *req.SSOURL
			config.SSOURL.Valid = true
		}
	}

	if req.SLOURL != nil {
		if *req.SLOURL == "" {
			config.SLOURL.Valid = false
		} else {
			config.SLOURL.String = *req.SLOURL
			config.SLOURL.Valid = true
		}
	}

	if req.Certificate != nil {
		if *req.Certificate == "" {
			config.Certificate.Valid = false
		} else {
			config.Certificate.String = *req.Certificate
			config.Certificate.Valid = true
		}
	}

	if req.MetadataURL != nil {
		if *req.MetadataURL == "" {
			config.MetadataURL.Valid = false
		} else {
			config.MetadataURL.String = *req.MetadataURL
			config.MetadataURL.Valid = true
		}
	}

	if req.ClientID != nil {
		if *req.ClientID == "" {
			config.ClientID.Valid = false
		} else {
			config.ClientID.String = *req.ClientID
			config.ClientID.Valid = true
		}
	}

	if req.ClientSecret != nil {
		if *req.ClientSecret == "" {
			config.ClientSecret.Valid = false
		} else {
			config.ClientSecret.String = *req.ClientSecret
			config.ClientSecret.Valid = true
		}
	}

	if req.Scopes != nil {
		scopesJSON, err := json.Marshal(*req.Scopes)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal scopes: %w", err)
		}
		config.Scopes = scopesJSON
	}

	if req.AttributeMapping != nil {
		mappingJSON, err := json.Marshal(*req.AttributeMapping)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal attribute mapping: %w", err)
		}
		config.AttributeMapping = mappingJSON
	}

	if req.Settings != nil {
		settingsJSON, err := json.Marshal(*req.Settings)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal settings: %w", err)
		}
		config.Settings = settingsJSON
	}

	config.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, config); err != nil {
		return nil, fmt.Errorf("failed to update SSO config: %w", err)
	}

	return config, nil
}

func (s *tenantSSOConfigService) DeleteSSOConfig(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *tenantSSOConfigService) ActivateSSOConfig(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateStatus(ctx, id, "ACTIVE")
}

func (s *tenantSSOConfigService) DeactivateSSOConfig(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateStatus(ctx, id, "INACTIVE")
}

func (s *tenantSSOConfigService) TestSSOConfig(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateStatus(ctx, id, "TESTING")
}
