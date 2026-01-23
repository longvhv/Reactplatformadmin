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

// MockOrderRepository is a mock of OrderRepository
type MockOrderRepository struct {
	mock.Mock
}

func (m *MockOrderRepository) Create(ctx context.Context, order *models.Order) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockOrderRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Order), args.Error(1)
}

func (m *MockOrderRepository) Update(ctx context.Context, order *models.Order) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockOrderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockOrderRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.Order, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Order), args.Get(1).(int64), args.Error(2)
}

func TestOrderService_CreateOrder(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockCache := new(MockCache)
	service := NewOrderService(mockRepo, mockCache)

	ctx := context.Background()
	tenantID := uuid.New()
	customerID := uuid.New()
	productID := uuid.New()

	t.Run("success", func(t *testing.T) {
		billingCycle := "monthly"
		notes := "Test order"

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Order")).Return(nil).Once()

		req := CreateOrderRequest{
			TenantID:     tenantID,
			CustomerID:   customerID,
			ProductID:    productID,
			Quantity:     2,
			UnitPrice:    50.00,
			TotalAmount:  100.00,
			Currency:     "USD",
			BillingCycle: &billingCycle,
			Status:       "pending",
			Notes:        &notes,
		}

		order, err := service.CreateOrder(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, tenantID, order.TenantID)
		assert.Equal(t, customerID, order.CustomerID)
		assert.Equal(t, productID, order.ProductID)
		assert.Equal(t, 2, order.Quantity)
		assert.Equal(t, 50.00, order.UnitPrice)
		assert.Equal(t, 100.00, order.TotalAmount)
		assert.Equal(t, "USD", order.Currency)
		assert.Equal(t, "pending", order.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - default status", func(t *testing.T) {
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Order")).Return(nil).Once()

		req := CreateOrderRequest{
			TenantID:    tenantID,
			CustomerID:  customerID,
			ProductID:   productID,
			Quantity:    1,
			UnitPrice:   99.99,
			TotalAmount: 99.99,
			Currency:    "USD",
			Status:      "", // Should default to "pending"
		}

		order, err := service.CreateOrder(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, "pending", order.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid quantity - zero", func(t *testing.T) {
		req := CreateOrderRequest{
			TenantID:    tenantID,
			CustomerID:  customerID,
			ProductID:   productID,
			Quantity:    0,
			UnitPrice:   99.99,
			TotalAmount: 0,
			Currency:    "USD",
		}

		order, err := service.CreateOrder(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "quantity must be greater than 0")
	})

	t.Run("invalid quantity - negative", func(t *testing.T) {
		req := CreateOrderRequest{
			TenantID:    tenantID,
			CustomerID:  customerID,
			ProductID:   productID,
			Quantity:    -5,
			UnitPrice:   99.99,
			TotalAmount: -499.95,
			Currency:    "USD",
		}

		order, err := service.CreateOrder(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "quantity must be greater than 0")
	})

	t.Run("invalid total amount - negative", func(t *testing.T) {
		req := CreateOrderRequest{
			TenantID:    tenantID,
			CustomerID:  customerID,
			ProductID:   productID,
			Quantity:    1,
			UnitPrice:   99.99,
			TotalAmount: -99.99,
			Currency:    "USD",
		}

		order, err := service.CreateOrder(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "total amount must be non-negative")
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Order")).Return(errors.New("db error")).Once()

		req := CreateOrderRequest{
			TenantID:    tenantID,
			CustomerID:  customerID,
			ProductID:   productID,
			Quantity:    1,
			UnitPrice:   99.99,
			TotalAmount: 99.99,
			Currency:    "USD",
		}

		order, err := service.CreateOrder(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "failed to create order")
		mockRepo.AssertExpectations(t)
	})
}

func TestOrderService_GetByID(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockCache := new(MockCache)
	service := NewOrderService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success - from cache", func(t *testing.T) {
		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(nil).Once()

		order, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		mockCache.AssertExpectations(t)
	})

	t.Run("success - from database", func(t *testing.T) {
		expectedOrder := &models.Order{
			ID:          id,
			TenantID:    uuid.New(),
			CustomerID:  uuid.New(),
			ProductID:   uuid.New(),
			Quantity:    1,
			UnitPrice:   99.99,
			TotalAmount: 99.99,
			Currency:    "USD",
			Status:      "pending",
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, id).Return(expectedOrder, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, expectedOrder, mock.Anything).Return(nil).Once()

		order, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, id, order.ID)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		order, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, order)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

func TestOrderService_ListByTenant(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockCache := new(MockCache)
	service := NewOrderService(mockRepo, mockCache)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		expectedOrders := []*models.Order{
			{
				ID:          uuid.New(),
				TenantID:    tenantID,
				CustomerID:  uuid.New(),
				ProductID:   uuid.New(),
				Quantity:    1,
				UnitPrice:   49.99,
				TotalAmount: 49.99,
				Currency:    "USD",
				Status:      "pending",
			},
			{
				ID:          uuid.New(),
				TenantID:    tenantID,
				CustomerID:  uuid.New(),
				ProductID:   uuid.New(),
				Quantity:    2,
				UnitPrice:   99.99,
				TotalAmount: 199.98,
				Currency:    "USD",
				Status:      "completed",
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(expectedOrders, int64(2), nil).Once()

		orders, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, orders)
		assert.Len(t, orders, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		orders, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, orders)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestOrderService_UpdateOrder(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockCache := new(MockCache)
	service := NewOrderService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingOrder := &models.Order{
			ID:          id,
			TenantID:    uuid.New(),
			CustomerID:  uuid.New(),
			ProductID:   uuid.New(),
			Quantity:    1,
			UnitPrice:   99.99,
			TotalAmount: 99.99,
			Currency:    "USD",
			Status:      "pending",
		}

		newStatus := "processing"
		newNotes := "Order being processed"

		mockRepo.On("GetByID", ctx, id).Return(existingOrder, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Order")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		req := UpdateOrderRequest{
			Status: &newStatus,
			Notes:  &newNotes,
		}

		order, err := service.UpdateOrder(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, newStatus, order.Status)
		assert.Equal(t, &newNotes, order.Notes)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("order not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newStatus := "processing"
		req := UpdateOrderRequest{
			Status: &newStatus,
		}

		order, err := service.UpdateOrder(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingOrder := &models.Order{
			ID:          id,
			TenantID:    uuid.New(),
			CustomerID:  uuid.New(),
			ProductID:   uuid.New(),
			Status:      "pending",
		}

		newStatus := "processing"

		mockRepo.On("GetByID", ctx, id).Return(existingOrder, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Order")).Return(errors.New("db error")).Once()

		req := UpdateOrderRequest{
			Status: &newStatus,
		}

		order, err := service.UpdateOrder(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "failed to update order")
		mockRepo.AssertExpectations(t)
	})
}

func TestOrderService_DeleteOrder(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockCache := new(MockCache)
	service := NewOrderService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		err := service.DeleteOrder(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(errors.New("db error")).Once()

		err := service.DeleteOrder(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to delete order")
		mockRepo.AssertExpectations(t)
	})
}

func TestOrderService_CancelOrder(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockCache := new(MockCache)
	service := NewOrderService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		pendingOrder := &models.Order{
			ID:          id,
			TenantID:    uuid.New(),
			CustomerID:  uuid.New(),
			ProductID:   uuid.New(),
			Status:      "pending",
		}

		mockRepo.On("GetByID", ctx, id).Return(pendingOrder, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Order")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		order, err := service.CancelOrder(ctx, id, "Customer request")

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, "cancelled", order.Status)
		assert.NotNil(t, order.CancelledAt)
		assert.NotNil(t, order.Notes)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("cannot cancel completed order", func(t *testing.T) {
		completedOrder := &models.Order{
			ID:     id,
			Status: "completed",
		}

		mockRepo.On("GetByID", ctx, id).Return(completedOrder, nil).Once()

		order, err := service.CancelOrder(ctx, id, "Test reason")

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "cannot cancel completed order")
		mockRepo.AssertExpectations(t)
	})

	t.Run("order already cancelled", func(t *testing.T) {
		cancelledOrder := &models.Order{
			ID:     id,
			Status: "cancelled",
		}

		mockRepo.On("GetByID", ctx, id).Return(cancelledOrder, nil).Once()

		order, err := service.CancelOrder(ctx, id, "Test reason")

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "already cancelled")
		mockRepo.AssertExpectations(t)
	})

	t.Run("order not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		order, err := service.CancelOrder(ctx, id, "Test reason")

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})
}

func TestOrderService_CompleteOrder(t *testing.T) {
	mockRepo := new(MockOrderRepository)
	mockCache := new(MockCache)
	service := NewOrderService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		processingOrder := &models.Order{
			ID:          id,
			TenantID:    uuid.New(),
			CustomerID:  uuid.New(),
			ProductID:   uuid.New(),
			Status:      "processing",
		}

		mockRepo.On("GetByID", ctx, id).Return(processingOrder, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Order")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		order, err := service.CompleteOrder(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, order)
		assert.Equal(t, "completed", order.Status)
		assert.NotNil(t, order.CompletedAt)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("cannot complete cancelled order", func(t *testing.T) {
		cancelledOrder := &models.Order{
			ID:     id,
			Status: "cancelled",
		}

		mockRepo.On("GetByID", ctx, id).Return(cancelledOrder, nil).Once()

		order, err := service.CompleteOrder(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "cannot complete cancelled order")
		mockRepo.AssertExpectations(t)
	})

	t.Run("order already completed", func(t *testing.T) {
		completedOrder := &models.Order{
			ID:     id,
			Status: "completed",
		}

		mockRepo.On("GetByID", ctx, id).Return(completedOrder, nil).Once()

		order, err := service.CompleteOrder(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "already completed")
		mockRepo.AssertExpectations(t)
	})

	t.Run("order not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		order, err := service.CompleteOrder(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		processingOrder := &models.Order{
			ID:     id,
			Status: "processing",
		}

		mockRepo.On("GetByID", ctx, id).Return(processingOrder, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Order")).Return(errors.New("db error")).Once()

		order, err := service.CompleteOrder(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, order)
		assert.Contains(t, err.Error(), "failed to complete order")
		mockRepo.AssertExpectations(t)
	})
}
