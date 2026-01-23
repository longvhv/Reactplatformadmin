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

type MockAPIKeyRepository struct {
	mock.Mock
}

func (m *MockAPIKeyRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.APIKey, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.APIKey), args.Error(1)
}

func (m *MockAPIKeyRepository) GetByHash(ctx context.Context, hash string) (*models.APIKey, error) {
	args := m.Called(ctx, hash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.APIKey), args.Error(1)
}

func (m *MockAPIKeyRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*models.APIKey, int64, error) {
	args := m.Called(ctx, tenantID, status, limit, offset)
	return args.Get(0).([]*models.APIKey), args.Get(1).(int64), args.Error(2)
}

func (m *MockAPIKeyRepository) Create(ctx context.Context, apiKey *models.APIKey) error {
	args := m.Called(ctx, apiKey)
	return args.Error(0)
}

func (m *MockAPIKeyRepository) Update(ctx context.Context, apiKey *models.APIKey) error {
	args := m.Called(ctx, apiKey)
	return args.Error(0)
}

func (m *MockAPIKeyRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestCreateAPIKey(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	tenantID := uuid.New()
	userID := uuid.New()

	req := CreateAPIKeyRequest{
		TenantID:  tenantID,
		Name:      "Test API Key",
		Scopes:    []string{"read", "write"},
		CreatedBy: userID,
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.APIKey")).Return(nil)

	apiKey, err := service.CreateAPIKey(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, apiKey)
	assert.Equal(t, "Test API Key", apiKey.Name)
	assert.True(t, apiKey.IsActive)
	assert.Contains(t, apiKey.KeyHash, "vhv_") // Contains prefix in plaintext response
	assert.NotNil(t, apiKey.RateLimits)
	mockRepo.AssertExpectations(t)
}

func TestCreateAPIKey_InvalidScope(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	req := CreateAPIKeyRequest{
		TenantID: uuid.New(),
		Name:     "Test",
		Scopes:   []string{"invalid-scope"},
	}

	_, err := service.CreateAPIKey(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid scope")
}

func TestRevokeAPIKey(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	keyID := uuid.New()
	apiKey := &models.APIKey{
		ID:       keyID,
		Name:     "Test Key",
		IsActive: true,
	}

	mockRepo.On("GetByID", mock.Anything, keyID).Return(apiKey, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.APIKey")).Return(nil)

	result, err := service.RevokeAPIKey(context.Background(), keyID)

	assert.NoError(t, err)
	assert.False(t, result.IsActive)
	assert.NotNil(t, result.RevokedAt)
	mockRepo.AssertExpectations(t)
}

func TestActivateAPIKey(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	keyID := uuid.New()
	revokedAt := time.Now()
	apiKey := &models.APIKey{
		ID:        keyID,
		Name:      "Test Key",
		IsActive:  false,
		RevokedAt: &revokedAt,
	}

	mockRepo.On("GetByID", mock.Anything, keyID).Return(apiKey, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.APIKey")).Return(nil)

	result, err := service.ActivateAPIKey(context.Background(), keyID)

	assert.NoError(t, err)
	assert.True(t, result.IsActive)
	assert.Nil(t, result.RevokedAt)
	mockRepo.AssertExpectations(t)
}

func TestRotateAPIKey(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	keyID := uuid.New()
	apiKey := &models.APIKey{
		ID:      keyID,
		Name:    "Test Key",
		KeyHash: "old-hash",
	}

	mockRepo.On("GetByID", mock.Anything, keyID).Return(apiKey, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.APIKey")).Return(nil)

	result, err := service.RotateAPIKey(context.Background(), keyID)

	assert.NoError(t, err)
	assert.NotEqual(t, "old-hash", result.KeyHash)
	assert.Contains(t, result.KeyHash, "vhv_")
	mockRepo.AssertExpectations(t)
}

func TestValidateAPIKey_Valid(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	keyValue := "vhv_test123"
	keyHash := service.hashKey(keyValue)

	apiKey := &models.APIKey{
		ID:       uuid.New(),
		KeyHash:  keyHash,
		IsActive: true,
	}

	mockRepo.On("GetByHash", mock.Anything, keyHash).Return(apiKey, nil)

	result, valid, err := service.ValidateAPIKey(context.Background(), keyValue)

	assert.NoError(t, err)
	assert.True(t, valid)
	assert.NotNil(t, result)
	mockRepo.AssertExpectations(t)
}

func TestValidateAPIKey_Inactive(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	keyValue := "vhv_test123"
	keyHash := service.hashKey(keyValue)

	apiKey := &models.APIKey{
		ID:       uuid.New(),
		KeyHash:  keyHash,
		IsActive: false,
	}

	mockRepo.On("GetByHash", mock.Anything, keyHash).Return(apiKey, nil)

	result, valid, err := service.ValidateAPIKey(context.Background(), keyValue)

	assert.NoError(t, err)
	assert.False(t, valid)
	assert.NotNil(t, result)
	mockRepo.AssertExpectations(t)
}

func TestValidateAPIKey_Expired(t *testing.T) {
	mockRepo := new(MockAPIKeyRepository)
	service := NewAPIKeyService(mockRepo, nil)

	keyValue := "vhv_test123"
	keyHash := service.hashKey(keyValue)
	expiredTime := time.Now().Add(-24 * time.Hour)

	apiKey := &models.APIKey{
		ID:        uuid.New(),
		KeyHash:   keyHash,
		IsActive:  true,
		ExpiresAt: &expiredTime,
	}

	mockRepo.On("GetByHash", mock.Anything, keyHash).Return(apiKey, nil)

	result, valid, err := service.ValidateAPIKey(context.Background(), keyValue)

	assert.NoError(t, err)
	assert.False(t, valid)
	assert.NotNil(t, result)
	mockRepo.AssertExpectations(t)
}

func TestHasScope(t *testing.T) {
	service := NewAPIKeyService(nil, nil)

	tests := []struct {
		name          string
		scopes        []string
		requiredScope string
		expected      bool
	}{
		{"Wildcard scope", []string{"*"}, "users:read", true},
		{"Exact match", []string{"users:read"}, "users:read", true},
		{"Prefix match", []string{"users:*"}, "users:read", true},
		{"No match", []string{"users:read"}, "orders:read", false},
		{"Multiple scopes", []string{"users:read", "orders:read"}, "orders:read", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			apiKey := &models.APIKey{Scopes: tt.scopes}
			result := service.HasScope(apiKey, tt.requiredScope)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsIPAllowed(t *testing.T) {
	service := NewAPIKeyService(nil, nil)

	tests := []struct {
		name        string
		whitelist   []string
		ip          string
		expected    bool
	}{
		{"Empty whitelist", []string{}, "192.168.1.1", true},
		{"IP in whitelist", []string{"192.168.1.1", "10.0.0.1"}, "192.168.1.1", true},
		{"IP not in whitelist", []string{"192.168.1.1"}, "10.0.0.1", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			apiKey := &models.APIKey{IPWhitelist: tt.whitelist}
			result := service.IsIPAllowed(apiKey, tt.ip)
			assert.Equal(t, tt.expected, result)
		})
	}
}
