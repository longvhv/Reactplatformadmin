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

// MockTenantSubscriptionRepository is a mock of TenantSubscriptionRepository
type MockTenantSubscriptionRepository struct {
	mock.Mock
}

func (m *MockTenantSubscriptionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantSubscription, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantSubscription), args.Error(1)
}

func (m *MockTenantSubscriptionRepository) GetActive(ctx context.Context, tenantID uuid.UUID) (*models.TenantSubscription, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantSubscription), args.Error(1)
}

func (m *MockTenantSubscriptionRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*models.TenantSubscription, int64, error) {
	args := m.Called(ctx, tenantID, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantSubscription), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantSubscriptionRepository) Create(ctx context.Context, subscription *models.TenantSubscription) error {
	args := m.Called(ctx, subscription)
	return args.Error(0)
}

func (m *MockTenantSubscriptionRepository) Update(ctx context.Context, subscription *models.TenantSubscription) error {
	args := m.Called(ctx, subscription)
	return args.Error(0)
}

func TestTenantSubscriptionService_CreateSubscription(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		tenantID := uuid.New()
		userID := uuid.New()
		req := CreateTenantSubscriptionRequest{
			TenantID:         tenantID,
			SubscriptionName: "Premium Plan",
			StartDate:        "2024-01-01",
			EndDate:          "2024-12-31",
			BasePrice:        1000000,
			TotalAmount:      1000000,
			CreatedBy:        userID,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.CreateSubscription(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, "Premium Plan", subscription.SubscriptionName)
		assert.Equal(t, "monthly", subscription.BillingCycle)
		assert.Equal(t, "USD", subscription.Currency)
		assert.Equal(t, "pending", subscription.Status)
		assert.True(t, subscription.AutoRenew)
		assert.Equal(t, "unpaid", subscription.PaymentStatus)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with trial", func(t *testing.T) {
		trialEnd := "2024-02-01"
		req := CreateTenantSubscriptionRequest{
			TenantID:         uuid.New(),
			SubscriptionName: "Trial Plan",
			StartDate:        "2024-01-01",
			EndDate:          "2024-12-31",
			TrialEndDate:     &trialEnd,
			IsTrial:          true,
			BasePrice:        0,
			TotalAmount:      0,
			CreatedBy:        uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.CreateSubscription(ctx, req)

		assert.NoError(t, err)
		assert.True(t, subscription.IsTrial)
		assert.Equal(t, "trial", subscription.Status)
		assert.NotNil(t, subscription.TrialEndDate)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full details", func(t *testing.T) {
		planID := uuid.New()
		orderID := uuid.New()
		planName := "Enterprise Plan"
		paymentMethod := "credit_card"
		contactName := "John Doe"
		contactEmail := "john@company.com"
		contactPhone := "+84901234567"
		notes := "Annual subscription"

		req := CreateTenantSubscriptionRequest{
			TenantID:            uuid.New(),
			PlanID:              &planID,
			OrderID:             &orderID,
			SubscriptionName:    "Enterprise Subscription",
			StartDate:           "2024-01-01",
			EndDate:             "2024-12-31",
			PlanName:            &planName,
			BillingCycle:        "yearly",
			BasePrice:           10000000,
			DiscountAmount:      1000000,
			TaxAmount:           900000,
			TotalAmount:         9900000,
			Currency:            "VND",
			MaxUsers:            100,
			MaxStorageGB:        500,
			Features:            []interface{}{"api_access", "priority_support", "custom_domain"},
			Limits:              map[string]interface{}{"api_calls": 1000000},
			PaymentMethod:       &paymentMethod,
			BillingContactName:  &contactName,
			BillingContactEmail: &contactEmail,
			BillingContactPhone: &contactPhone,
			Notes:               &notes,
			Tags:                []string{"enterprise", "annual"},
			CreatedBy:           uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.CreateSubscription(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "yearly", subscription.BillingCycle)
		assert.Equal(t, "VND", subscription.Currency)
		assert.Equal(t, 100, subscription.MaxUsers)
		assert.Equal(t, 500, subscription.MaxStorageGB)
		assert.Equal(t, 0, subscription.CurrentUsers)
		assert.Equal(t, float64(0), subscription.CurrentStorageGB)
		assert.Len(t, subscription.Features, 3)
		assert.Len(t, subscription.Tags, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid start date", func(t *testing.T) {
		req := CreateTenantSubscriptionRequest{
			TenantID:         uuid.New(),
			SubscriptionName: "Test",
			StartDate:        "invalid-date",
			EndDate:          "2024-12-31",
			BasePrice:        1000,
			TotalAmount:      1000,
			CreatedBy:        uuid.New(),
		}

		subscription, err := service.CreateSubscription(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		assert.Contains(t, err.Error(), "invalid start_date")
	})

	t.Run("invalid end date", func(t *testing.T) {
		req := CreateTenantSubscriptionRequest{
			TenantID:         uuid.New(),
			SubscriptionName: "Test",
			StartDate:        "2024-01-01",
			EndDate:          "invalid-date",
			BasePrice:        1000,
			TotalAmount:      1000,
			CreatedBy:        uuid.New(),
		}

		subscription, err := service.CreateSubscription(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		assert.Contains(t, err.Error(), "invalid end_date")
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateTenantSubscriptionRequest{
			TenantID:         uuid.New(),
			SubscriptionName: "Test",
			StartDate:        "2024-01-01",
			EndDate:          "2024-12-31",
			BasePrice:        1000,
			TotalAmount:      1000,
			CreatedBy:        uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(errors.New("db error")).Once()

		subscription, err := service.CreateSubscription(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_UpdateSubscription(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:               subscriptionID,
			SubscriptionName: "Old Name",
			Status:           "pending",
			AutoRenew:        true,
			MaxUsers:         10,
			Version:          1,
		}

		newName := "Updated Plan"
		newStatus := "active"
		autoRenew := false
		maxUsers := 50

		req := UpdateTenantSubscriptionRequest{
			SubscriptionName: &newName,
			Status:           &newStatus,
			AutoRenew:        &autoRenew,
			MaxUsers:         &maxUsers,
			UpdatedBy:        uuid.New(),
		}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.UpdateSubscription(ctx, subscriptionID, req)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, "Updated Plan", subscription.SubscriptionName)
		assert.Equal(t, "active", subscription.Status)
		assert.False(t, subscription.AutoRenew)
		assert.Equal(t, 50, subscription.MaxUsers)
		assert.Equal(t, 2, subscription.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("subscription not found", func(t *testing.T) {
		subscriptionID := uuid.New()
		req := UpdateTenantSubscriptionRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(nil, errors.New("not found")).Once()

		subscription, err := service.UpdateSubscription(ctx, subscriptionID, req)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_CancelSubscription(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:        subscriptionID,
			Status:    "active",
			AutoRenew: true,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.CancelSubscription(ctx, subscriptionID)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, "cancelled", subscription.Status)
		assert.False(t, subscription.AutoRenew)
		assert.Equal(t, 2, subscription.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("subscription not found", func(t *testing.T) {
		subscriptionID := uuid.New()
		mockRepo.On("GetByID", ctx, subscriptionID).Return(nil, errors.New("not found")).Once()

		subscription, err := service.CancelSubscription(ctx, subscriptionID)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_RenewSubscription(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success - monthly", func(t *testing.T) {
		subscriptionID := uuid.New()
		endDate := time.Now().Add(24 * time.Hour)
		existing := &models.TenantSubscription{
			ID:           subscriptionID,
			Status:       "active",
			BillingCycle: "monthly",
			EndDate:      endDate,
			IsTrial:      true,
			Version:      1,
		}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.RenewSubscription(ctx, subscriptionID)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, "active", subscription.Status)
		assert.False(t, subscription.IsTrial)
		assert.NotNil(t, subscription.RenewalDate)
		assert.Equal(t, 2, subscription.Version)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_SuspendSubscription(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:      subscriptionID,
			Status:  "active",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.SuspendSubscription(ctx, subscriptionID)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, "suspended", subscription.Status)
		assert.Equal(t, 2, subscription.Version)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_ReactivateSubscription(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:      subscriptionID,
			Status:  "suspended",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.ReactivateSubscription(ctx, subscriptionID)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, "active", subscription.Status)
		assert.Equal(t, 2, subscription.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not suspended", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:     subscriptionID,
			Status: "active",
		}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()

		subscription, err := service.ReactivateSubscription(ctx, subscriptionID)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		assert.Contains(t, err.Error(), "can only reactivate suspended")
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_UpdateUsage(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success - users only", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:               subscriptionID,
			CurrentUsers:     10,
			CurrentStorageGB: 50.5,
		}

		newUsers := 25
		req := newUsers

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.UpdateUsage(ctx, subscriptionID, &req, nil)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, 25, subscription.CurrentUsers)
		assert.Equal(t, 50.5, subscription.CurrentStorageGB)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - storage only", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:               subscriptionID,
			CurrentUsers:     10,
			CurrentStorageGB: 50.5,
		}

		newStorage := 75.8

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.UpdateUsage(ctx, subscriptionID, nil, &newStorage)

		assert.NoError(t, err)
		assert.Equal(t, 10, subscription.CurrentUsers)
		assert.Equal(t, 75.8, subscription.CurrentStorageGB)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - both", func(t *testing.T) {
		subscriptionID := uuid.New()
		existing := &models.TenantSubscription{
			ID:               subscriptionID,
			CurrentUsers:     10,
			CurrentStorageGB: 50.5,
		}

		newUsers := 30
		newStorage := 100.0

		mockRepo.On("GetByID", ctx, subscriptionID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantSubscription")).Return(nil).Once()

		subscription, err := service.UpdateUsage(ctx, subscriptionID, &newUsers, &newStorage)

		assert.NoError(t, err)
		assert.Equal(t, 30, subscription.CurrentUsers)
		assert.Equal(t, 100.0, subscription.CurrentStorageGB)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_GetByID(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		subscriptionID := uuid.New()
		expected := &models.TenantSubscription{
			ID:               subscriptionID,
			SubscriptionName: "Test Subscription",
		}

		mockRepo.On("GetByID", ctx, subscriptionID).Return(expected, nil).Once()

		subscription, err := service.GetByID(ctx, subscriptionID)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, subscriptionID, subscription.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		subscriptionID := uuid.New()
		mockRepo.On("GetByID", ctx, subscriptionID).Return(nil, errors.New("not found")).Once()

		subscription, err := service.GetByID(ctx, subscriptionID)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_GetActiveSubscription(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := &models.TenantSubscription{
			ID:       uuid.New(),
			TenantID: tenantID,
			Status:   "active",
		}

		mockRepo.On("GetActive", ctx, tenantID).Return(expected, nil).Once()

		subscription, err := service.GetActiveSubscription(ctx, tenantID)

		assert.NoError(t, err)
		assert.NotNil(t, subscription)
		assert.Equal(t, "active", subscription.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("no active subscription", func(t *testing.T) {
		tenantID := uuid.New()
		mockRepo.On("GetActive", ctx, tenantID).Return(nil, errors.New("not found")).Once()

		subscription, err := service.GetActiveSubscription(ctx, tenantID)

		assert.Error(t, err)
		assert.Nil(t, subscription)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantSubscriptionService_ListByTenant(t *testing.T) {
	mockRepo := new(MockTenantSubscriptionRepository)
	service := NewTenantSubscriptionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantSubscription{
			{ID: uuid.New(), TenantID: tenantID, Status: "active"},
			{ID: uuid.New(), TenantID: tenantID, Status: "cancelled"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", 10, 0).Return(expected, int64(2), nil).Once()

		subscriptions, total, err := service.ListByTenant(ctx, tenantID, "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, subscriptions, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with status filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantSubscription{
			{ID: uuid.New(), Status: "active"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "active", 10, 0).Return(expected, int64(1), nil).Once()

		subscriptions, total, err := service.ListByTenant(ctx, tenantID, "active", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, subscriptions, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})
}
