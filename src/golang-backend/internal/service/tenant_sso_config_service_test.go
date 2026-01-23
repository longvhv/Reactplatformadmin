package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockTenantSSOConfigRepository is a mock of TenantSSOConfigRepository
type MockTenantSSOConfigRepository struct {
	mock.Mock
}

func (m *MockTenantSSOConfigRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantSSOConfig, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantSSOConfig), args.Error(1)
}

func (m *MockTenantSSOConfigRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, provider string, limit, offset int) ([]*models.TenantSSOConfig, int64, error) {
	args := m.Called(ctx, tenantID, provider, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantSSOConfig), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantSSOConfigRepository) Create(ctx context.Context, config *models.TenantSSOConfig) error {
	args := m.Called(ctx, config)
	return args.Error(0)
}

func (m *MockTenantSSOConfigRepository) Update(ctx context.Context, config *models.TenantSSOConfig) error {
	args := m.Called(ctx, config)
	return args.Error(0)
}

func (m *MockTenantSSOConfigRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestTenantSSOConfigService_CreateConfig(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success with SAML", func(t *testing.T) {
		tenantID := uuid.New()
		entityID := "https://example.com/saml"
		loginURL := "https://example.com/login"
		req := CreateTenantSSOConfigRequest{
			TenantID:  tenantID,
			Provider:  "SAML",
			Name:      "Corporate SAML",
			EntityID:  &entityID,
			LoginURL:  &loginURL,
			IsDefault: false,
			CreatedBy: uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(nil).Once()

		config, err := service.CreateConfig(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, config)
		assert.Equal(t, "SAML", config.Provider)
		assert.Equal(t, "Corporate SAML", config.Name)
		assert.True(t, config.IsEnabled)
		assert.False(t, config.IsDefault)
		assert.Equal(t, 1, config.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full details", func(t *testing.T) {
		tenantID := uuid.New()
		description := "Enterprise SSO"
		entityID := "https://example.com/saml"
		loginURL := "https://example.com/login"
		logoutURL := "https://example.com/logout"
		metadataURL := "https://example.com/metadata"
		certData := "CERT_DATA"

		req := CreateTenantSSOConfigRequest{
			TenantID:        tenantID,
			Provider:        "SAML",
			Name:            "Enterprise SAML",
			Description:     &description,
			EntityID:        &entityID,
			LoginURL:        &loginURL,
			LogoutURL:       &logoutURL,
			MetadataURL:     &metadataURL,
			CertificateData: &certData,
			AttributeMappings: map[string]interface{}{
				"email":     "emailAddress",
				"firstName": "givenName",
			},
			ProviderConfiguration: map[string]interface{}{
				"signing_algorithm": "SHA256",
			},
			IsDefault:      false,
			AllowedDomains: []string{"example.com", "corp.example.com"},
			CreatedBy:      uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(nil).Once()

		config, err := service.CreateConfig(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, &description, config.Description)
		assert.NotNil(t, config.AttributeMappings)
		assert.NotNil(t, config.ProviderConfiguration)
		assert.Len(t, config.AllowedDomains, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with default flag", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantSSOConfigRequest{
			TenantID:  tenantID,
			Provider:  "OIDC",
			Name:      "Default OIDC",
			IsDefault: true,
			CreatedBy: uuid.New(),
		}

		// Should unset other defaults first
		mockRepo.On("ListByTenant", ctx, tenantID, "OIDC", 1000, 0).Return([]*models.TenantSSOConfig{}, int64(0), nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(nil).Once()

		config, err := service.CreateConfig(ctx, req)

		assert.NoError(t, err)
		assert.True(t, config.IsDefault)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid provider", func(t *testing.T) {
		req := CreateTenantSSOConfigRequest{
			TenantID:  uuid.New(),
			Provider:  "INVALID",
			Name:      "Test",
			CreatedBy: uuid.New(),
		}

		config, err := service.CreateConfig(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, config)
		assert.Contains(t, err.Error(), "invalid provider")
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateTenantSSOConfigRequest{
			TenantID:  uuid.New(),
			Provider:  "SAML",
			Name:      "Test",
			CreatedBy: uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(errors.New("db error")).Once()

		config, err := service.CreateConfig(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, config)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_UpdateConfig(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		configID := uuid.New()
		existing := &models.TenantSSOConfig{
			ID:        configID,
			TenantID:  uuid.New(),
			Provider:  "SAML",
			Name:      "Old Name",
			IsDefault: false,
			Version:   1,
		}

		newName := "Updated SAML"
		newLoginURL := "https://new.example.com/login"
		req := UpdateTenantSSOConfigRequest{
			Name:      &newName,
			LoginURL:  &newLoginURL,
			UpdatedBy: uuid.New(),
		}

		mockRepo.On("GetByID", ctx, configID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(nil).Once()

		config, err := service.UpdateConfig(ctx, configID, req)

		assert.NoError(t, err)
		assert.Equal(t, "Updated SAML", config.Name)
		assert.Equal(t, &newLoginURL, config.LoginURL)
		assert.Equal(t, 2, config.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("set as default", func(t *testing.T) {
		configID := uuid.New()
		tenantID := uuid.New()
		existing := &models.TenantSSOConfig{
			ID:        configID,
			TenantID:  tenantID,
			Provider:  "OIDC",
			IsDefault: false,
		}

		isDefault := true
		req := UpdateTenantSSOConfigRequest{
			IsDefault: &isDefault,
			UpdatedBy: uuid.New(),
		}

		// Should unset other defaults
		mockRepo.On("GetByID", ctx, configID).Return(existing, nil).Once()
		mockRepo.On("ListByTenant", ctx, tenantID, "OIDC", 1000, 0).Return([]*models.TenantSSOConfig{}, int64(0), nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(nil).Once()

		config, err := service.UpdateConfig(ctx, configID, req)

		assert.NoError(t, err)
		assert.True(t, config.IsDefault)
		mockRepo.AssertExpectations(t)
	})

	t.Run("config not found", func(t *testing.T) {
		configID := uuid.New()
		req := UpdateTenantSSOConfigRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, configID).Return(nil, errors.New("not found")).Once()

		config, err := service.UpdateConfig(ctx, configID, req)

		assert.Error(t, err)
		assert.Nil(t, config)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_EnableDisableConfig(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("enable config", func(t *testing.T) {
		configID := uuid.New()
		existing := &models.TenantSSOConfig{
			ID:        configID,
			IsEnabled: false,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, configID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(nil).Once()

		config, err := service.EnableConfig(ctx, configID)

		assert.NoError(t, err)
		assert.True(t, config.IsEnabled)
		assert.Equal(t, 2, config.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("disable config", func(t *testing.T) {
		configID := uuid.New()
		existing := &models.TenantSSOConfig{
			ID:        configID,
			IsEnabled: true,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, configID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSSOConfig")).Return(nil).Once()

		config, err := service.DisableConfig(ctx, configID)

		assert.NoError(t, err)
		assert.False(t, config.IsEnabled)
		assert.Equal(t, 2, config.Version)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_TestConnection(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		configID := uuid.New()
		loginURL := "https://example.com/login"
		entityID := "entity123"
		config := &models.TenantSSOConfig{
			ID:       configID,
			Provider: "SAML",
			LoginURL: &loginURL,
			EntityID: &entityID,
		}

		mockRepo.On("GetByID", ctx, configID).Return(config, nil).Once()

		result, err := service.TestConnection(ctx, configID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.True(t, result["success"].(bool))
		assert.Equal(t, "SAML", result["provider"])
		assert.NotNil(t, result["tested_at"])
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_GetMetadata(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		configID := uuid.New()
		loginURL := "https://example.com/login"
		logoutURL := "https://example.com/logout"
		entityID := "entity123"
		config := &models.TenantSSOConfig{
			ID:                    configID,
			Provider:              "SAML",
			EntityID:              &entityID,
			LoginURL:              &loginURL,
			LogoutURL:             &logoutURL,
			AttributeMappings:     map[string]interface{}{"email": "emailAddress"},
			ProviderConfiguration: map[string]interface{}{"algo": "SHA256"},
			AllowedDomains:        []string{"example.com"},
		}

		mockRepo.On("GetByID", ctx, configID).Return(config, nil).Once()

		metadata, err := service.GetMetadata(ctx, configID)

		assert.NoError(t, err)
		assert.NotNil(t, metadata)
		assert.Equal(t, "SAML", metadata["provider"])
		assert.Equal(t, &entityID, metadata["entity_id"])
		assert.NotNil(t, metadata["attribute_mappings"])
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_GetDefaultConfig(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		configs := []*models.TenantSSOConfig{
			{ID: uuid.New(), Provider: "SAML", IsDefault: false, IsEnabled: true},
			{ID: uuid.New(), Provider: "SAML", IsDefault: true, IsEnabled: true},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "SAML", 1000, 0).Return(configs, int64(2), nil).Once()

		config, err := service.GetDefaultConfig(ctx, tenantID, "SAML")

		assert.NoError(t, err)
		assert.NotNil(t, config)
		assert.True(t, config.IsDefault)
		mockRepo.AssertExpectations(t)
	})

	t.Run("no default found", func(t *testing.T) {
		tenantID := uuid.New()
		configs := []*models.TenantSSOConfig{
			{ID: uuid.New(), IsDefault: false, IsEnabled: true},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "SAML", 1000, 0).Return(configs, int64(1), nil).Once()

		config, err := service.GetDefaultConfig(ctx, tenantID, "SAML")

		assert.Error(t, err)
		assert.Nil(t, config)
		assert.Contains(t, err.Error(), "no default")
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_ValidateDomain(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success - domain allowed", func(t *testing.T) {
		tenantID := uuid.New()
		configs := []*models.TenantSSOConfig{
			{
				ID:             uuid.New(),
				IsEnabled:      true,
				AllowedDomains: []string{"example.com", "corp.example.com"},
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", 1000, 0).Return(configs, int64(1), nil).Once()

		config, err := service.ValidateDomain(ctx, tenantID, "user@example.com")

		assert.NoError(t, err)
		assert.NotNil(t, config)
		mockRepo.AssertExpectations(t)
	})

	t.Run("domain not allowed", func(t *testing.T) {
		tenantID := uuid.New()
		configs := []*models.TenantSSOConfig{
			{
				ID:             uuid.New(),
				IsEnabled:      true,
				AllowedDomains: []string{"other.com"},
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", 1000, 0).Return(configs, int64(1), nil).Once()

		config, err := service.ValidateDomain(ctx, tenantID, "user@example.com")

		assert.Error(t, err)
		assert.Nil(t, config)
		assert.Contains(t, err.Error(), "no SSO config found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("skip disabled configs", func(t *testing.T) {
		tenantID := uuid.New()
		configs := []*models.TenantSSOConfig{
			{
				ID:             uuid.New(),
				IsEnabled:      false,
				AllowedDomains: []string{"example.com"},
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", 1000, 0).Return(configs, int64(1), nil).Once()

		config, err := service.ValidateDomain(ctx, tenantID, "user@example.com")

		assert.Error(t, err)
		assert.Nil(t, config)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_ListByTenant(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantSSOConfig{
			{ID: uuid.New(), Provider: "SAML"},
			{ID: uuid.New(), Provider: "OIDC"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", 10, 0).Return(expected, int64(2), nil).Once()

		configs, total, err := service.ListByTenant(ctx, tenantID, "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, configs, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with provider filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantSSOConfig{
			{ID: uuid.New(), Provider: "SAML"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "SAML", 10, 0).Return(expected, int64(1), nil).Once()

		configs, total, err := service.ListByTenant(ctx, tenantID, "SAML", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, configs, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_DeleteConfig(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		configID := uuid.New()

		mockRepo.On("Delete", ctx, configID).Return(nil).Once()

		err := service.DeleteConfig(ctx, configID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		configID := uuid.New()

		mockRepo.On("Delete", ctx, configID).Return(errors.New("db error")).Once()

		err := service.DeleteConfig(ctx, configID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSSOConfigService_GetByID(t *testing.T) {
	mockRepo := new(MockTenantSSOConfigRepository)
	service := NewTenantSSOConfigService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		configID := uuid.New()
		expected := &models.TenantSSOConfig{
			ID:       configID,
			Provider: "SAML",
		}

		mockRepo.On("GetByID", ctx, configID).Return(expected, nil).Once()

		config, err := service.GetByID(ctx, configID)

		assert.NoError(t, err)
		assert.NotNil(t, config)
		assert.Equal(t, configID, config.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		configID := uuid.New()
		mockRepo.On("GetByID", ctx, configID).Return(nil, errors.New("not found")).Once()

		config, err := service.GetByID(ctx, configID)

		assert.Error(t, err)
		assert.Nil(t, config)
		mockRepo.AssertExpectations(t)
	})
}
