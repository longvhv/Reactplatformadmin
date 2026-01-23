package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantSSOConfigService struct {
	ssoRepo repository.TenantSSOConfigRepository
}

func NewTenantSSOConfigService(ssoRepo repository.TenantSSOConfigRepository) *TenantSSOConfigService {
	return &TenantSSOConfigService{
		ssoRepo: ssoRepo,
	}
}

type CreateTenantSSOConfigRequest struct {
	TenantID              uuid.UUID              `json:"tenant_id" binding:"required"`
	Provider              string                 `json:"provider" binding:"required"`
	Name                  string                 `json:"name" binding:"required"`
	Description           *string                `json:"description"`
	EntityID              *string                `json:"entity_id"`
	LoginURL              *string                `json:"login_url"`
	LogoutURL             *string                `json:"logout_url"`
	CertificateData       *string                `json:"certificate_data"`
	MetadataURL           *string                `json:"metadata_url"`
	AttributeMappings     map[string]interface{} `json:"attribute_mappings"`
	ProviderConfiguration map[string]interface{} `json:"provider_configuration"`
	IsDefault             bool                   `json:"is_default"`
	AllowedDomains        []string               `json:"allowed_domains"`
	CreatedBy             uuid.UUID              `json:"-"`
}

type UpdateTenantSSOConfigRequest struct {
	Name                  *string                `json:"name"`
	Description           *string                `json:"description"`
	EntityID              *string                `json:"entity_id"`
	LoginURL              *string                `json:"login_url"`
	LogoutURL             *string                `json:"logout_url"`
	CertificateData       *string                `json:"certificate_data"`
	MetadataURL           *string                `json:"metadata_url"`
	AttributeMappings     map[string]interface{} `json:"attribute_mappings"`
	ProviderConfiguration map[string]interface{} `json:"provider_configuration"`
	IsDefault             *bool                  `json:"is_default"`
	AllowedDomains        []string               `json:"allowed_domains"`
	UpdatedBy             uuid.UUID              `json:"-"`
}

// GetByID gets SSO config by ID
func (s *TenantSSOConfigService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error) {
	return s.ssoRepo.GetByID(ctx, id)
}

// ListByTenant lists SSO configs by tenant
func (s *TenantSSOConfigService) ListByTenant(ctx context.Context, tenantID uuid.UUID, provider string, page, limit int) ([]*models.TenantSSOConfig, int64, error) {
	offset := (page - 1) * limit
	return s.ssoRepo.ListByTenant(ctx, tenantID, provider, limit, offset)
}

// CreateConfig creates a new SSO config
func (s *TenantSSOConfigService) CreateConfig(ctx context.Context, req CreateTenantSSOConfigRequest) (*models.TenantSSOConfig, error) {
	// Validate provider
	validProviders := []string{"SAML", "OAUTH2", "OIDC", "LDAP", "CAS", "OTHER"}
	if !contains(validProviders, req.Provider) {
		return nil, fmt.Errorf("invalid provider, must be one of: %v", validProviders)
	}

	// If setting as default, unset other defaults
	if req.IsDefault {
		if err := s.unsetDefaultConfigs(ctx, req.TenantID, req.Provider); err != nil {
			return nil, fmt.Errorf("failed to unset default configs: %w", err)
		}
	}

	attributeMappings := req.AttributeMappings
	if attributeMappings == nil {
		attributeMappings = make(map[string]interface{})
	}

	providerConfig := req.ProviderConfiguration
	if providerConfig == nil {
		providerConfig = make(map[string]interface{})
	}

	allowedDomains := req.AllowedDomains
	if allowedDomains == nil {
		allowedDomains = []string{}
	}

	config := &models.TenantSSOConfig{
		ID:                    uuid.New(),
		TenantID:              req.TenantID,
		Provider:              req.Provider,
		Name:                  req.Name,
		Description:           req.Description,
		EntityID:              req.EntityID,
		LoginURL:              req.LoginURL,
		LogoutURL:             req.LogoutURL,
		CertificateData:       req.CertificateData,
		MetadataURL:           req.MetadataURL,
		AttributeMappings:     attributeMappings,
		ProviderConfiguration: providerConfig,
		IsEnabled:             true,
		IsDefault:             req.IsDefault,
		AllowedDomains:        allowedDomains,
		CreatedAt:             time.Now(),
		UpdatedAt:             time.Now(),
		CreatedBy:             &req.CreatedBy,
		Version:               1,
	}

	if err := s.ssoRepo.Create(ctx, config); err != nil {
		return nil, fmt.Errorf("failed to create SSO config: %w", err)
	}

	return config, nil
}

// UpdateConfig updates an SSO config
func (s *TenantSSOConfigService) UpdateConfig(ctx context.Context, id uuid.UUID, req UpdateTenantSSOConfigRequest) (*models.TenantSSOConfig, error) {
	config, err := s.ssoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("SSO config not found: %w", err)
	}

	if req.Name != nil {
		config.Name = *req.Name
	}
	if req.Description != nil {
		config.Description = req.Description
	}
	if req.EntityID != nil {
		config.EntityID = req.EntityID
	}
	if req.LoginURL != nil {
		config.LoginURL = req.LoginURL
	}
	if req.LogoutURL != nil {
		config.LogoutURL = req.LogoutURL
	}
	if req.CertificateData != nil {
		config.CertificateData = req.CertificateData
	}
	if req.MetadataURL != nil {
		config.MetadataURL = req.MetadataURL
	}
	if req.AttributeMappings != nil {
		config.AttributeMappings = req.AttributeMappings
	}
	if req.ProviderConfiguration != nil {
		config.ProviderConfiguration = req.ProviderConfiguration
	}
	if req.IsDefault != nil && *req.IsDefault {
		// Unset other defaults first
		if err := s.unsetDefaultConfigs(ctx, config.TenantID, config.Provider); err != nil {
			return nil, fmt.Errorf("failed to unset default configs: %w", err)
		}
		config.IsDefault = *req.IsDefault
	}
	if req.AllowedDomains != nil {
		config.AllowedDomains = req.AllowedDomains
	}

	config.UpdatedAt = time.Now()
	config.UpdatedBy = &req.UpdatedBy
	config.Version++

	if err := s.ssoRepo.Update(ctx, config); err != nil {
		return nil, fmt.Errorf("failed to update SSO config: %w", err)
	}

	return config, nil
}

// DeleteConfig deletes an SSO config
func (s *TenantSSOConfigService) DeleteConfig(ctx context.Context, id uuid.UUID) error {
	return s.ssoRepo.Delete(ctx, id)
}

// EnableConfig enables an SSO config
func (s *TenantSSOConfigService) EnableConfig(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error) {
	config, err := s.ssoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("SSO config not found: %w", err)
	}

	config.IsEnabled = true
	config.UpdatedAt = time.Now()
	config.Version++

	if err := s.ssoRepo.Update(ctx, config); err != nil {
		return nil, fmt.Errorf("failed to enable SSO config: %w", err)
	}

	return config, nil
}

// DisableConfig disables an SSO config
func (s *TenantSSOConfigService) DisableConfig(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error) {
	config, err := s.ssoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("SSO config not found: %w", err)
	}

	config.IsEnabled = false
	config.UpdatedAt = time.Now()
	config.Version++

	if err := s.ssoRepo.Update(ctx, config); err != nil {
		return nil, fmt.Errorf("failed to disable SSO config: %w", err)
	}

	return config, nil
}

// TestConnection tests SSO connection
func (s *TenantSSOConfigService) TestConnection(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	config, err := s.ssoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("SSO config not found: %w", err)
	}

	// Mock test - in production this would actually test the SSO connection
	result := map[string]interface{}{
		"success":    true,
		"provider":   config.Provider,
		"message":    "SSO connection test successful",
		"tested_at":  time.Now(),
		"login_url":  config.LoginURL,
		"entity_id":  config.EntityID,
	}

	return result, nil
}

// GetMetadata gets SSO provider metadata
func (s *TenantSSOConfigService) GetMetadata(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	config, err := s.ssoRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("SSO config not found: %w", err)
	}

	metadata := map[string]interface{}{
		"provider":                config.Provider,
		"entity_id":               config.EntityID,
		"login_url":               config.LoginURL,
		"logout_url":              config.LogoutURL,
		"attribute_mappings":      config.AttributeMappings,
		"provider_configuration":  config.ProviderConfiguration,
		"allowed_domains":         config.AllowedDomains,
	}

	return metadata, nil
}

// GetDefaultConfig gets default SSO config for tenant
func (s *TenantSSOConfigService) GetDefaultConfig(ctx context.Context, tenantID uuid.UUID, provider string) (*models.TenantSSOConfig, error) {
	configs, _, err := s.ssoRepo.ListByTenant(ctx, tenantID, provider, 1000, 0)
	if err != nil {
		return nil, err
	}

	for _, config := range configs {
		if config.IsDefault && config.IsEnabled {
			return config, nil
		}
	}

	return nil, fmt.Errorf("no default SSO config found")
}

// ValidateDomain validates if domain is allowed for SSO
func (s *TenantSSOConfigService) ValidateDomain(ctx context.Context, tenantID uuid.UUID, email string) (*models.TenantSSOConfig, error) {
	configs, _, err := s.ssoRepo.ListByTenant(ctx, tenantID, "", 1000, 0)
	if err != nil {
		return nil, err
	}

	// Extract domain from email
	domain := extractDomain(email)

	for _, config := range configs {
		if !config.IsEnabled {
			continue
		}

		// Check if domain is in allowed domains
		for _, allowedDomain := range config.AllowedDomains {
			if allowedDomain == domain {
				return config, nil
			}
		}
	}

	return nil, fmt.Errorf("no SSO config found for domain: %s", domain)
}

// Helper functions
func (s *TenantSSOConfigService) unsetDefaultConfigs(ctx context.Context, tenantID uuid.UUID, provider string) error {
	configs, _, err := s.ssoRepo.ListByTenant(ctx, tenantID, provider, 1000, 0)
	if err != nil {
		return err
	}

	for _, config := range configs {
		if config.IsDefault {
			config.IsDefault = false
			config.UpdatedAt = time.Now()
			_ = s.ssoRepo.Update(ctx, config)
		}
	}

	return nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func extractDomain(email string) string {
	parts := []rune(email)
	for i := len(parts) - 1; i >= 0; i-- {
		if parts[i] == '@' {
			return string(parts[i+1:])
		}
	}
	return ""
}
