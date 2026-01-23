package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockSubscriptionOrderRepository is a mock of SubscriptionOrderRepository
type MockSubscriptionOrderRepository struct {
	mock.Mock
}

func (m *MockSubscriptionOrderRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionOrder, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SubscriptionOrder), args.Error(1)
}

func (m *MockSubscriptionOrderRepository) GetByOrderNumber(ctx context.Context, orderNumber string) (*models.SubscriptionOrder, error) {
	args := m.Called(ctx, orderNumber)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SubscriptionOrder), args.Error(1)
}

func (m *MockSubscriptionOrderRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status, orderType string, limit, offset int) ([]*models.SubscriptionOrder, int64, error) {
	args := m.Called(ctx, tenantID, status, orderType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.SubscriptionOrder), args.Get(1).(int64), args.Error(2)
}

func (m *MockSubscriptionOrderRepository) Create(ctx context.Context, order *models.SubscriptionOrder) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockSubscriptionOrderRepository) Update(ctx context.Context, order *models.SubscriptionOrder) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func TestSubscriptionOrderService_CreateOrder(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		req := CreateSubscriptionOrderRequest{
			TenantID:    uuid.New(),
			Type:        "NEW",
			TotalAmount: 1000.0,
			CreatedBy:   uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SubscriptionOrder")).Return(nil).Once()

		order, err := service.CreateOrder(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, "PENDING", order.Status) // Default
		assert.Equal(t, "VND", order.CurrencyCode) // Default
		assert.NotEmpty(t, order.OrderNumber)
		assert.Equal(t, 1, order.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full details", func(t *testing.T) {
		poNumber := "PO-12345"
		paymentMethod := "CARD"
		paymentRefID := "ref-12345"
		req := CreateSubscriptionOrderRequest{
			TenantID:       uuid.New(),
			PONumber:       &poNumber,
			Type:           "RENEWAL",
			CurrencyCode:   "USD",
			SubtotalAmount: 900.0,
			TaxAmount:      90.0,
			DiscountAmount: 50.0,
			CreditApplied:  10.0,
			TotalAmount:    930.0,
			ItemsSnapshot: []interface{}{
				map[string]interface{}{"name": "Item 1", "price": 500.0},
				map[string]interface{}{"name": "Item 2", "price": 400.0},
			},
			BillingInfo: map[string]interface{}{
				"name":    "John Doe",
				"address": "123 Main St",
			},
			PaymentMethod: &paymentMethod,
			PaymentRefID:  &paymentRefID,
			CreatedBy:     uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SubscriptionOrder")).Return(nil).Once()

		order, err := service.CreateOrder(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "USD", order.CurrencyCode)
		assert.Equal(t, "RENEWAL", order.Type)
		assert.Equal(t, 900.0, order.SubtotalAmount)
		assert.Equal(t, 90.0, order.TaxAmount)
		assert.Equal(t, 50.0, order.DiscountAmount)
		assert.Equal(t, 10.0, order.CreditApplied)
		assert.Equal(t, 930.0, order.TotalAmount)
		assert.NotNil(t, order.ItemsSnapshot)
		assert.NotNil(t, order.BillingInfo)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateSubscriptionOrderRequest{
			TenantID:    uuid.New(),
			Type:        "NEW",
			TotalAmount: 1000.0,
			CreatedBy:   uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SubscriptionOrder")).Return(errors.New("db error")).Once()

		order, err := service.CreateOrder(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionOrderService_UpdateOrder(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success - pending order", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:          orderID,
			Status:      "PENDING",
			TotalAmount: 1000.0,
			Version:     1,
		}

		newStatus := "PROCESSING"
		newSubtotal := 950.0
		newTotalAmount := 1045.0
		req := UpdateSubscriptionOrderRequest{
			Status:      &newStatus,
			SubtotalAmount: &newSubtotal,
			TotalAmount: &newTotalAmount,
		}

		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionOrder")).Return(nil).Once()

		order, err := service.UpdateOrder(ctx, orderID, req)

		assert.NoError(t, err)
		assert.Equal(t, "PROCESSING", order.Status)
		assert.Equal(t, 950.0, order.SubtotalAmount)
		assert.Equal(t, 1045.0, order.TotalAmount)
		assert.Equal(t, 2, order.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot update paid order", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:     orderID,
			Status: "PAID",
		}

		req := UpdateSubscriptionOrderRequest{}

		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()

		order, err := service.UpdateOrder(ctx, orderID, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "cannot update order with status")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionOrderService_MarkAsPaid(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:      orderID,
			Status:  "PENDING",
			Version: 1,
		}

		paymentRefID := "ref-12345"
		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionOrder")).Return(nil).Once()

		order, err := service.MarkAsPaid(ctx, orderID, "CARD", &paymentRefID)

		assert.NoError(t, err)
		assert.Equal(t, "PAID", order.Status)
		assert.Equal(t, "CARD", *order.PaymentMethod)
		assert.Equal(t, &paymentRefID, order.PaymentRefID)
		assert.Equal(t, 2, order.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("already paid", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:     orderID,
			Status: "PAID",
		}

		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()

		order, err := service.MarkAsPaid(ctx, orderID, "CARD", nil)

		assert.NoError(t, err)
		assert.Equal(t, existing, order) // Returns unchanged
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot mark draft as paid", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:     orderID,
			Status: "DRAFT",
		}

		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()

		order, err := service.MarkAsPaid(ctx, orderID, "CARD", nil)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "can only mark pending orders as paid")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionOrderService_CancelOrder(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:      orderID,
			Status:  "PENDING",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionOrder")).Return(nil).Once()

		order, err := service.CancelOrder(ctx, orderID)

		assert.NoError(t, err)
		assert.Equal(t, "CANCELLED", order.Status)
		assert.Equal(t, 2, order.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot cancel paid order", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:     orderID,
			Status: "PAID",
		}

		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()

		order, err := service.CancelOrder(ctx, orderID)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "cannot cancel paid order, use refund instead")
		mockRepo.AssertExpectations(t)
	})

	t.Run("already cancelled", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:     orderID,
			Status: "CANCELLED",
		}

		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()

		order, err := service.CancelOrder(ctx, orderID)

		assert.NoError(t, err)
		assert.Equal(t, existing, order) // Returns unchanged
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionOrderService_RefundOrder(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:      orderID,
			Status:  "PAID",
			Version: 1,
			BillingInfo: map[string]interface{}{
				"name": "John Doe",
			},
		}

		refundAmount := 1000.0
		refundReason := "Customer request"
		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionOrder")).Return(nil).Once()

		order, err := service.RefundOrder(ctx, orderID, &refundAmount, &refundReason)

		assert.NoError(t, err)
		assert.Equal(t, "REFUNDED", order.Status)
		assert.Equal(t, 2, order.Version)
		assert.NotNil(t, order.BillingInfo["refund_amount"])
		assert.NotNil(t, order.BillingInfo["refund_reason"])
		assert.NotNil(t, order.BillingInfo["refunded_at"])
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot refund unpaid order", func(t *testing.T) {
		orderID := uuid.New()
		existing := &models.SubscriptionOrder{
			ID:     orderID,
			Status: "PENDING",
		}

		refundAmount := 1000.0
		mockRepo.On("GetByID", ctx, orderID).Return(existing, nil).Once()

		order, err := service.RefundOrder(ctx, orderID, &refundAmount, nil)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "can only refund paid orders")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionOrderService_GetByID(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		orderID := uuid.New()
		expected := &models.SubscriptionOrder{
			ID:          orderID,
			OrderNumber: "ORD-12345",
		}

		mockRepo.On("GetByID", ctx, orderID).Return(expected, nil).Once()

		order, err := service.GetByID(ctx, orderID)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, orderID, order.ID)
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionOrderService_GetByOrderNumber(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := &models.SubscriptionOrder{
			ID:          uuid.New(),
			OrderNumber: "ORD-12345",
		}

		mockRepo.On("GetByOrderNumber", ctx, "ORD-12345").Return(expected, nil).Once()

		order, err := service.GetByOrderNumber(ctx, "ORD-12345")

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, "ORD-12345", order.OrderNumber)
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionOrderService_ListByTenant(t *testing.T) {
	mockRepo := new(MockSubscriptionOrderRepository)
	service := NewSubscriptionOrderService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.SubscriptionOrder{
			{ID: uuid.New(), Status: "PENDING", Type: "NEW"},
			{ID: uuid.New(), Status: "PAID", Type: "RENEWAL"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", "", 10, 0).Return(expected, int64(2), nil).Once()

		orders, total, err := service.ListByTenant(ctx, tenantID, "", "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, orders, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})
}
