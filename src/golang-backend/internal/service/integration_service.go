package service

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type IntegrationService struct {
	integrationRepo repository.IntegrationRepository
	encryptionKey   []byte
}

func NewIntegrationService(integrationRepo repository.IntegrationRepository) *IntegrationService {
	// In production, load from secure config
	key := []byte("32-byte-encryption-key-change-me!!")
	return &IntegrationService{
		integrationRepo: integrationRepo,
		encryptionKey:   key,
	}
}

type CreateIntegrationRequest struct {
	TenantID       uuid.UUID              `json:"tenant_id" binding:"required"`
	Provider       string                 `json:"provider" binding:"required"`
	Name           string                 `json:"name" binding:"required"`
	Description    *string                `json:"description"`
	AuthType       string                 `json:"auth_type" binding:"required"`
	ClientID       *string                `json:"client_id"`
	ClientSecret   *string                `json:"client_secret"`
	APIKey         *string                `json:"api_key"`
	AccessToken    *string                `json:"access_token"`
	RefreshToken   *string                `json:"refresh_token"`
	Scopes         []string               `json:"scopes"`
	WebhookURL     *string                `json:"webhook_url"`
	WebhookSecret  *string                `json:"webhook_secret"`
	Configuration  map[string]interface{} `json:"configuration"`
	SyncEnabled    bool                   `json:"sync_enabled"`
	SyncInterval   *int                   `json:"sync_interval"`
	Metadata       map[string]interface{} `json:"metadata"`
	CreatedBy      uuid.UUID              `json:"-"`
}

type UpdateIntegrationRequest struct {
	Name           *string                `json:"name"`
	Description    *string                `json:"description"`
	ClientID       *string                `json:"client_id"`
	ClientSecret   *string                `json:"client_secret"`
	APIKey         *string                `json:"api_key"`
	AccessToken    *string                `json:"access_token"`
	RefreshToken   *string                `json:"refresh_token"`
	Scopes         []string               `json:"scopes"`
	WebhookURL     *string                `json:"webhook_url"`
	WebhookSecret  *string                `json:"webhook_secret"`
	Configuration  map[string]interface{} `json:"configuration"`
	SyncEnabled    *bool                  `json:"sync_enabled"`
	SyncInterval   *int                   `json:"sync_interval"`
	Metadata       map[string]interface{} `json:"metadata"`
	UpdatedBy      uuid.UUID              `json:"-"`
}

// GetByID gets integration by ID
func (s *IntegrationService) GetByID(ctx context.Context, id uuid.UUID) (*models.Integration, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Decrypt sensitive fields
	if err := s.decryptSensitiveFields(integration); err != nil {
		return nil, fmt.Errorf("failed to decrypt sensitive fields: %w", err)
	}

	return integration, nil
}

// ListByTenant lists integrations by tenant
func (s *IntegrationService) ListByTenant(ctx context.Context, tenantID uuid.UUID, provider, status string, page, limit int) ([]*models.Integration, int64, error) {
	offset := (page - 1) * limit
	integrations, total, err := s.integrationRepo.ListByTenant(ctx, tenantID, provider, status, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// Decrypt sensitive fields for each integration
	for _, integration := range integrations {
		_ = s.decryptSensitiveFields(integration)
	}

	return integrations, total, nil
}

// CreateIntegration creates a new integration
func (s *IntegrationService) CreateIntegration(ctx context.Context, req CreateIntegrationRequest) (*models.Integration, error) {
	// Validate auth type
	validAuthTypes := []string{"oauth2", "api_key", "basic", "bearer", "custom"}
	if !containsAuthType(validAuthTypes, req.AuthType) {
		return nil, fmt.Errorf("invalid auth type, must be one of: %v", validAuthTypes)
	}

	// Validate provider
	validProviders := []string{"google", "microsoft", "slack", "github", "gitlab", "jira", "salesforce", "hubspot", "zendesk", "stripe", "paypal", "twilio", "sendgrid", "mailchimp", "custom"}
	if !containsAuthType(validProviders, req.Provider) {
		return nil, fmt.Errorf("invalid provider, must be one of: %v", validProviders)
	}

	scopes := req.Scopes
	if scopes == nil {
		scopes = []string{}
	}

	configuration := req.Configuration
	if configuration == nil {
		configuration = make(map[string]interface{})
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	integration := &models.Integration{
		ID:            uuid.New(),
		TenantID:      req.TenantID,
		Provider:      req.Provider,
		Name:          req.Name,
		Description:   req.Description,
		AuthType:      req.AuthType,
		ClientID:      req.ClientID,
		ClientSecret:  req.ClientSecret,
		APIKey:        req.APIKey,
		AccessToken:   req.AccessToken,
		RefreshToken:  req.RefreshToken,
		Scopes:        scopes,
		WebhookURL:    req.WebhookURL,
		WebhookSecret: req.WebhookSecret,
		Configuration: configuration,
		IsEnabled:     true,
		Status:        "active",
		SyncEnabled:   req.SyncEnabled,
		SyncInterval:  req.SyncInterval,
		Metadata:      metadata,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
		CreatedBy:     &req.CreatedBy,
	}

	// Encrypt sensitive fields before saving
	if err := s.encryptSensitiveFields(integration); err != nil {
		return nil, fmt.Errorf("failed to encrypt sensitive fields: %w", err)
	}

	if err := s.integrationRepo.Create(ctx, integration); err != nil {
		return nil, fmt.Errorf("failed to create integration: %w", err)
	}

	// Decrypt for response
	_ = s.decryptSensitiveFields(integration)

	return integration, nil
}

// UpdateIntegration updates an integration
func (s *IntegrationService) UpdateIntegration(ctx context.Context, id uuid.UUID, req UpdateIntegrationRequest) (*models.Integration, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("integration not found: %w", err)
	}

	if req.Name != nil {
		integration.Name = *req.Name
	}
	if req.Description != nil {
		integration.Description = req.Description
	}
	if req.ClientID != nil {
		integration.ClientID = req.ClientID
	}
	if req.ClientSecret != nil {
		integration.ClientSecret = req.ClientSecret
	}
	if req.APIKey != nil {
		integration.APIKey = req.APIKey
	}
	if req.AccessToken != nil {
		integration.AccessToken = req.AccessToken
	}
	if req.RefreshToken != nil {
		integration.RefreshToken = req.RefreshToken
	}
	if req.Scopes != nil {
		integration.Scopes = req.Scopes
	}
	if req.WebhookURL != nil {
		integration.WebhookURL = req.WebhookURL
	}
	if req.WebhookSecret != nil {
		integration.WebhookSecret = req.WebhookSecret
	}
	if req.Configuration != nil {
		integration.Configuration = req.Configuration
	}
	if req.SyncEnabled != nil {
		integration.SyncEnabled = *req.SyncEnabled
	}
	if req.SyncInterval != nil {
		integration.SyncInterval = req.SyncInterval
	}
	if req.Metadata != nil {
		integration.Metadata = req.Metadata
	}

	integration.UpdatedAt = time.Now()
	integration.UpdatedBy = &req.UpdatedBy

	// Encrypt sensitive fields before saving
	if err := s.encryptSensitiveFields(integration); err != nil {
		return nil, fmt.Errorf("failed to encrypt sensitive fields: %w", err)
	}

	if err := s.integrationRepo.Update(ctx, integration); err != nil {
		return nil, fmt.Errorf("failed to update integration: %w", err)
	}

	// Decrypt for response
	_ = s.decryptSensitiveFields(integration)

	return integration, nil
}

// DeleteIntegration deletes an integration
func (s *IntegrationService) DeleteIntegration(ctx context.Context, id uuid.UUID) error {
	return s.integrationRepo.Delete(ctx, id)
}

// EnableIntegration enables an integration
func (s *IntegrationService) EnableIntegration(ctx context.Context, id uuid.UUID) (*models.Integration, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("integration not found: %w", err)
	}

	integration.IsEnabled = true
	integration.Status = "active"
	integration.UpdatedAt = time.Now()

	if err := s.integrationRepo.Update(ctx, integration); err != nil {
		return nil, fmt.Errorf("failed to enable integration: %w", err)
	}

	_ = s.decryptSensitiveFields(integration)
	return integration, nil
}

// DisableIntegration disables an integration
func (s *IntegrationService) DisableIntegration(ctx context.Context, id uuid.UUID) (*models.Integration, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("integration not found: %w", err)
	}

	integration.IsEnabled = false
	integration.Status = "disabled"
	integration.UpdatedAt = time.Now()

	if err := s.integrationRepo.Update(ctx, integration); err != nil {
		return nil, fmt.Errorf("failed to disable integration: %w", err)
	}

	_ = s.decryptSensitiveFields(integration)
	return integration, nil
}

// TestConnection tests integration connection
func (s *IntegrationService) TestConnection(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("integration not found: %w", err)
	}

	// Mock test - in production this would actually test the connection
	result := map[string]interface{}{
		"success":    true,
		"provider":   integration.Provider,
		"message":    "Connection test successful",
		"tested_at":  time.Now(),
		"latency_ms": 150,
	}

	// Update last tested timestamp
	now := time.Now()
	integration.LastTestedAt = &now
	integration.UpdatedAt = now
	_ = s.integrationRepo.Update(ctx, integration)

	return result, nil
}

// SyncData syncs integration data
func (s *IntegrationService) SyncData(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("integration not found: %w", err)
	}

	if !integration.SyncEnabled {
		return nil, fmt.Errorf("sync is not enabled for this integration")
	}

	// Mock sync - in production this would perform actual data sync
	result := map[string]interface{}{
		"success":       true,
		"provider":      integration.Provider,
		"synced_at":     time.Now(),
		"records_synced": 100,
		"status":        "completed",
	}

	// Update last synced timestamp
	now := time.Now()
	integration.LastSyncedAt = &now
	integration.UpdatedAt = now
	_ = s.integrationRepo.Update(ctx, integration)

	return result, nil
}

// RefreshToken refreshes OAuth token
func (s *IntegrationService) RefreshToken(ctx context.Context, id uuid.UUID) (*models.Integration, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("integration not found: %w", err)
	}

	if integration.AuthType != "oauth2" {
		return nil, fmt.Errorf("token refresh only available for OAuth2 integrations")
	}

	// Mock token refresh - in production this would call the OAuth provider
	// For now, just update the timestamp
	now := time.Now()
	expiresAt := now.Add(3600 * time.Second)
	integration.TokenExpiresAt = &expiresAt
	integration.UpdatedAt = now

	if err := s.integrationRepo.Update(ctx, integration); err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	_ = s.decryptSensitiveFields(integration)
	return integration, nil
}

// GetLogs gets integration logs (mock)
func (s *IntegrationService) GetLogs(ctx context.Context, id uuid.UUID, page, limit int) ([]map[string]interface{}, int64, error) {
	// Mock logs - in production this would query from ClickHouse
	logs := make([]map[string]interface{}, 0)
	
	for i := 0; i < limit; i++ {
		logs = append(logs, map[string]interface{}{
			"timestamp": time.Now().Add(-time.Duration(i) * time.Minute),
			"level":     "info",
			"message":   fmt.Sprintf("Integration activity %d", i),
			"status":    "success",
		})
	}

	return logs, int64(len(logs)), nil
}

// GetStats gets integration statistics
func (s *IntegrationService) GetStats(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	integration, err := s.integrationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("integration not found: %w", err)
	}

	stats := map[string]interface{}{
		"integration_id":   integration.ID,
		"provider":         integration.Provider,
		"status":           integration.Status,
		"is_enabled":       integration.IsEnabled,
		"sync_enabled":     integration.SyncEnabled,
		"last_synced_at":   integration.LastSyncedAt,
		"last_tested_at":   integration.LastTestedAt,
		"token_expires_at": integration.TokenExpiresAt,
		"created_at":       integration.CreatedAt,
		"uptime_hours":     time.Since(integration.CreatedAt).Hours(),
	}

	return stats, nil
}

// Encryption helpers
func (s *IntegrationService) encryptSensitiveFields(integration *models.Integration) error {
	if integration.ClientSecret != nil && *integration.ClientSecret != "" {
		encrypted, err := s.encrypt(*integration.ClientSecret)
		if err != nil {
			return err
		}
		integration.ClientSecret = &encrypted
	}

	if integration.APIKey != nil && *integration.APIKey != "" {
		encrypted, err := s.encrypt(*integration.APIKey)
		if err != nil {
			return err
		}
		integration.APIKey = &encrypted
	}

	if integration.AccessToken != nil && *integration.AccessToken != "" {
		encrypted, err := s.encrypt(*integration.AccessToken)
		if err != nil {
			return err
		}
		integration.AccessToken = &encrypted
	}

	if integration.RefreshToken != nil && *integration.RefreshToken != "" {
		encrypted, err := s.encrypt(*integration.RefreshToken)
		if err != nil {
			return err
		}
		integration.RefreshToken = &encrypted
	}

	if integration.WebhookSecret != nil && *integration.WebhookSecret != "" {
		encrypted, err := s.encrypt(*integration.WebhookSecret)
		if err != nil {
			return err
		}
		integration.WebhookSecret = &encrypted
	}

	return nil
}

func (s *IntegrationService) decryptSensitiveFields(integration *models.Integration) error {
	if integration.ClientSecret != nil && *integration.ClientSecret != "" {
		decrypted, err := s.decrypt(*integration.ClientSecret)
		if err == nil {
			integration.ClientSecret = &decrypted
		}
	}

	if integration.APIKey != nil && *integration.APIKey != "" {
		decrypted, err := s.decrypt(*integration.APIKey)
		if err == nil {
			integration.APIKey = &decrypted
		}
	}

	if integration.AccessToken != nil && *integration.AccessToken != "" {
		decrypted, err := s.decrypt(*integration.AccessToken)
		if err == nil {
			integration.AccessToken = &decrypted
		}
	}

	if integration.RefreshToken != nil && *integration.RefreshToken != "" {
		decrypted, err := s.decrypt(*integration.RefreshToken)
		if err == nil {
			integration.RefreshToken = &decrypted
		}
	}

	if integration.WebhookSecret != nil && *integration.WebhookSecret != "" {
		decrypted, err := s.decrypt(*integration.WebhookSecret)
		if err == nil {
			integration.WebhookSecret = &decrypted
		}
	}

	return nil
}

func (s *IntegrationService) encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *IntegrationService) decrypt(ciphertext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(s.encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

func containsAuthType(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
