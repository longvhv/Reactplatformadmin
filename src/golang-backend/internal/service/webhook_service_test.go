package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

type MockWebhookRepository struct {
	mock.Mock
}

func (m *MockWebhookRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Webhook), args.Error(1)
}

func (m *MockWebhookRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, eventType string, limit, offset int) ([]*models.Webhook, int64, error) {
	args := m.Called(ctx, tenantID, eventType, limit, offset)
	return args.Get(0).([]*models.Webhook), args.Get(1).(int64), args.Error(2)
}

func (m *MockWebhookRepository) Create(ctx context.Context, webhook *models.Webhook) error {
	args := m.Called(ctx, webhook)
	return args.Error(0)
}

func (m *MockWebhookRepository) Update(ctx context.Context, webhook *models.Webhook) error {
	args := m.Called(ctx, webhook)
	return args.Error(0)
}

func (m *MockWebhookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestCreateWebhook(t *testing.T) {
	mockRepo := new(MockWebhookRepository)
	service := NewWebhookService(mockRepo)

	tenantID := uuid.New()
	userID := uuid.New()

	req := CreateWebhookRequest{
		TenantID:  tenantID,
		Name:      "Test Webhook",
		URL:       "https://example.com/webhook",
		Events:    []string{"user.created", "user.updated"},
		CreatedBy: userID,
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.Webhook")).Return(nil)

	webhook, err := service.CreateWebhook(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, webhook)
	assert.Equal(t, "Test Webhook", webhook.Name)
	assert.True(t, webhook.IsActive)
	assert.NotEmpty(t, webhook.Secret)
	assert.Equal(t, 30, webhook.Timeout)
	mockRepo.AssertExpectations(t)
}

func TestCreateWebhook_InvalidEvent(t *testing.T) {
	mockRepo := new(MockWebhookRepository)
	service := NewWebhookService(mockRepo)

	req := CreateWebhookRequest{
		TenantID: uuid.New(),
		Name:     "Test",
		URL:      "https://example.com/webhook",
		Events:   []string{"invalid.event"},
	}

	_, err := service.CreateWebhook(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid event")
}

func TestEnableWebhook(t *testing.T) {
	mockRepo := new(MockWebhookRepository)
	service := NewWebhookService(mockRepo)

	webhookID := uuid.New()
	webhook := &models.Webhook{
		ID:       webhookID,
		Name:     "Test",
		IsActive: false,
	}

	mockRepo.On("GetByID", mock.Anything, webhookID).Return(webhook, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Webhook")).Return(nil)

	result, err := service.EnableWebhook(context.Background(), webhookID)

	assert.NoError(t, err)
	assert.True(t, result.IsActive)
	mockRepo.AssertExpectations(t)
}

func TestDisableWebhook(t *testing.T) {
	mockRepo := new(MockWebhookRepository)
	service := NewWebhookService(mockRepo)

	webhookID := uuid.New()
	webhook := &models.Webhook{
		ID:       webhookID,
		Name:     "Test",
		IsActive: true,
	}

	mockRepo.On("GetByID", mock.Anything, webhookID).Return(webhook, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Webhook")).Return(nil)

	result, err := service.DisableWebhook(context.Background(), webhookID)

	assert.NoError(t, err)
	assert.False(t, result.IsActive)
	mockRepo.AssertExpectations(t)
}

func TestRotateSecret(t *testing.T) {
	mockRepo := new(MockWebhookRepository)
	service := NewWebhookService(mockRepo)

	webhookID := uuid.New()
	oldSecret := "old-secret"
	webhook := &models.Webhook{
		ID:     webhookID,
		Name:   "Test",
		Secret: oldSecret,
	}

	mockRepo.On("GetByID", mock.Anything, webhookID).Return(webhook, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.Webhook")).Return(nil)

	result, err := service.RotateSecret(context.Background(), webhookID)

	assert.NoError(t, err)
	assert.NotEqual(t, oldSecret, result.Secret)
	assert.NotEmpty(t, result.Secret)
	mockRepo.AssertExpectations(t)
}

func TestMatchesEvent(t *testing.T) {
	service := NewWebhookService(nil)

	tests := []struct {
		name             string
		event            string
		subscribedEvents []string
		expected         bool
	}{
		{"Exact match", "user.created", []string{"user.created", "user.updated"}, true},
		{"Wildcard match", "user.created", []string{"*"}, true},
		{"Custom wildcard", "custom.event", []string{"custom.*"}, true},
		{"No match", "order.created", []string{"user.created"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.matchesEvent(tt.event, tt.subscribedEvents)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGenerateSignature(t *testing.T) {
	service := NewWebhookService(nil)

	payload := []byte(`{"test":"data"}`)
	secret := "test-secret"

	signature1 := service.generateSignature(payload, secret)
	signature2 := service.generateSignature(payload, secret)

	assert.NotEmpty(t, signature1)
	assert.Equal(t, signature1, signature2) // Same payload + secret = same signature

	signature3 := service.generateSignature(payload, "different-secret")
	assert.NotEqual(t, signature1, signature3)
}

func TestGetStats(t *testing.T) {
	mockRepo := new(MockWebhookRepository)
	service := NewWebhookService(mockRepo)

	webhookID := uuid.New()
	webhook := &models.Webhook{
		ID:           webhookID,
		Name:         "Test Webhook",
		IsActive:     true,
		SuccessCount: 100,
		FailureCount: 10,
		Events:       []string{"user.created"},
	}

	mockRepo.On("GetByID", mock.Anything, webhookID).Return(webhook, nil)

	stats, err := service.GetStats(context.Background(), webhookID)

	assert.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Equal(t, webhookID, stats["webhook_id"])
	assert.Equal(t, int64(100), stats["success_count"])
	assert.Equal(t, int64(10), stats["failure_count"])
	assert.Equal(t, int64(110), stats["total_deliveries"])
	
	successRate := stats["success_rate"].(float64)
	assert.InDelta(t, 90.909, successRate, 0.01)
	
	mockRepo.AssertExpectations(t)
}
