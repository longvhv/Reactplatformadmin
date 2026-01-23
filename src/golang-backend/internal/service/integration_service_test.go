package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// Mock repository
type MockIntegrationRepository struct {
	mock.Mock
}

func (m *MockIntegrationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Integration, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Integration), args.Error(1)
}

func (m *MockIntegrationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, provider, status string, limit, offset int) ([]*models.Integration, int64, error) {
	args := m.Called(ctx, tenantID, provider, status, limit, offset)
	return args.Get(0).([]*models.Integration), args.Get(1).(int64), args.Error(2)
}

func (m *MockIntegrationRepository) Create(ctx context.Context, integration *models.Integration) error {
	args := m.Called(ctx, integration)
	return args.Error(0)
}

func (m *MockIntegrationRepository) Update(ctx context.Context, integration *models.Integration) error {
	args := m.Called(ctx, integration)
	return args.Error(0)
}

func (m *MockIntegrationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestCreateIntegration(t *testing.T) {
	mockRepo := new(MockIntegrationRepository)
	service := NewIntegrationService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()

	req := CreateIntegrationRequest{
		TenantID:     tenantID,
		Provider:     "slack",
		Name:         "Test Slack Integration",
		AuthType:     "oauth2",
		AccessToken:  stringPtr("test-token"),
		RefreshToken: stringPtr("test-refresh"),
		SyncEnabled:  true,
		CreatedBy:    userID,
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Integration")).Return(nil)

	integration, err := service.CreateIntegration(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, integration)
	assert.Equal(t, "slack", integration.Provider)
	assert.Equal(t, "Test Slack Integration", integration.Name)
	assert.True(t, integration.IsEnabled)
	mockRepo.AssertExpectations(t)
}

func TestCreateIntegration_InvalidProvider(t *testing.T) {
	mockRepo := new(MockIntegrationRepository)
	service := NewIntegrationService(mockRepo)

	req := CreateIntegrationRequest{
		TenantID: uuid.New(),
		Provider: "invalid-provider",
		Name:     "Test",
		AuthType: "oauth2",
	}

	_, err := service.CreateIntegration(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid provider")
}

func TestEnableIntegration(t *testing.T) {
	mockRepo := new(MockIntegrationRepository)
	service := NewIntegrationService(mockRepo)

	integrationID := uuid.New()
	integration := &models.Integration{
		ID:        integrationID,
		Provider:  "slack",
		IsEnabled: false,
		Status:    "disabled",
	}

	mockRepo.On("GetByID", mock.Anything, integrationID).Return(integration, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Integration")).Return(nil)

	result, err := service.EnableIntegration(context.Background(), integrationID)

	assert.NoError(t, err)
	assert.True(t, result.IsEnabled)
	assert.Equal(t, "active", result.Status)
	mockRepo.AssertExpectations(t)
}

func TestDisableIntegration(t *testing.T) {
	mockRepo := new(MockIntegrationRepository)
	service := NewIntegrationService(mockRepo)

	integrationID := uuid.New()
	integration := &models.Integration{
		ID:        integrationID,
		Provider:  "slack",
		IsEnabled: true,
		Status:    "active",
	}

	mockRepo.On("GetByID", mock.Anything, integrationID).Return(integration, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Integration")).Return(nil)

	result, err := service.DisableIntegration(context.Background(), integrationID)

	assert.NoError(t, err)
	assert.False(t, result.IsEnabled)
	assert.Equal(t, "disabled", result.Status)
	mockRepo.AssertExpectations(t)
}

func TestRefreshToken(t *testing.T) {
	mockRepo := new(MockIntegrationRepository)
	service := NewIntegrationService(mockRepo)

	integrationID := uuid.New()
	integration := &models.Integration{
		ID:       integrationID,
		Provider: "slack",
		AuthType: "oauth2",
	}

	mockRepo.On("GetByID", mock.Anything, integrationID).Return(integration, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Integration")).Return(nil)

	result, err := service.RefreshToken(context.Background(), integrationID)

	assert.NoError(t, err)
	assert.NotNil(t, result.TokenExpiresAt)
	mockRepo.AssertExpectations(t)
}

func TestRefreshToken_NonOAuth2(t *testing.T) {
	mockRepo := new(MockIntegrationRepository)
	service := NewIntegrationService(mockRepo)

	integrationID := uuid.New()
	integration := &models.Integration{
		ID:       integrationID,
		Provider: "slack",
		AuthType: "api_key",
	}

	mockRepo.On("GetByID", mock.Anything, integrationID).Return(integration, nil)

	_, err := service.RefreshToken(context.Background(), integrationID)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "OAuth2")
	mockRepo.AssertExpectations(t)
}

func stringPtr(s string) *string {
	return &s
}
