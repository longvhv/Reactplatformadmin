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

// MockInvoiceRepository is a mock of InvoiceRepository
type MockInvoiceRepository struct {
	mock.Mock
}

func (m *MockInvoiceRepository) Create(ctx context.Context, invoice *models.Invoice) error {
	args := m.Called(ctx, invoice)
	return args.Error(0)
}

func (m *MockInvoiceRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Invoice, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Invoice), args.Error(1)
}

func (m *MockInvoiceRepository) Update(ctx context.Context, invoice *models.Invoice) error {
	args := m.Called(ctx, invoice)
	return args.Error(0)
}

func (m *MockInvoiceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockInvoiceRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.Invoice, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Invoice), args.Get(1).(int64), args.Error(2)
}

func (m *MockInvoiceRepository) ExistsByNumber(ctx context.Context, tenantID uuid.UUID, number string) (bool, error) {
	args := m.Called(ctx, tenantID, number)
	return args.Bool(0), args.Error(1)
}

func TestInvoiceService_CreateInvoice(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	service := NewInvoiceService(mockRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	customerID := uuid.New()
	invoiceNumber := "INV-2024-001"

	t.Run("success", func(t *testing.T) {
		orderID := uuid.New()
		dueDate := time.Now().AddDate(0, 0, 30)
		notes := "Payment terms: Net 30"

		mockRepo.On("ExistsByNumber", ctx, tenantID, invoiceNumber).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Invoice")).Return(nil).Once()

		req := CreateInvoiceRequest{
			TenantID:      tenantID,
			CustomerID:    customerID,
			OrderID:       &orderID,
			InvoiceNumber: invoiceNumber,
			Amount:        1000.00,
			Currency:      "USD",
			DueDate:       &dueDate,
			Notes:         &notes,
		}

		invoice, err := service.CreateInvoice(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, invoice)
		assert.Equal(t, tenantID, invoice.TenantID)
		assert.Equal(t, customerID, invoice.CustomerID)
		assert.Equal(t, &orderID, invoice.OrderID)
		assert.Equal(t, invoiceNumber, invoice.InvoiceNumber)
		assert.Equal(t, 1000.00, invoice.Amount)
		assert.Equal(t, "USD", invoice.Currency)
		assert.Equal(t, "pending", invoice.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty invoice number", func(t *testing.T) {
		req := CreateInvoiceRequest{
			TenantID:      tenantID,
			CustomerID:    customerID,
			InvoiceNumber: "",
			Amount:        1000.00,
			Currency:      "USD",
		}

		invoice, err := service.CreateInvoice(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "invoice number is required")
	})

	t.Run("invoice number already exists", func(t *testing.T) {
		mockRepo.On("ExistsByNumber", ctx, tenantID, invoiceNumber).Return(true, nil).Once()

		req := CreateInvoiceRequest{
			TenantID:      tenantID,
			CustomerID:    customerID,
			InvoiceNumber: invoiceNumber,
			Amount:        1000.00,
			Currency:      "USD",
		}

		invoice, err := service.CreateInvoice(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on exists check", func(t *testing.T) {
		mockRepo.On("ExistsByNumber", ctx, tenantID, invoiceNumber).Return(false, errors.New("db error")).Once()

		req := CreateInvoiceRequest{
			TenantID:      tenantID,
			CustomerID:    customerID,
			InvoiceNumber: invoiceNumber,
			Amount:        1000.00,
			Currency:      "USD",
		}

		invoice, err := service.CreateInvoice(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "failed to check invoice number")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("ExistsByNumber", ctx, tenantID, invoiceNumber).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Invoice")).Return(errors.New("db error")).Once()

		req := CreateInvoiceRequest{
			TenantID:      tenantID,
			CustomerID:    customerID,
			InvoiceNumber: invoiceNumber,
			Amount:        1000.00,
			Currency:      "USD",
		}

		invoice, err := service.CreateInvoice(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "failed to create invoice")
		mockRepo.AssertExpectations(t)
	})
}

func TestInvoiceService_GetByID(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	service := NewInvoiceService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedInvoice := &models.Invoice{
			ID:            id,
			TenantID:      uuid.New(),
			CustomerID:    uuid.New(),
			InvoiceNumber: "INV-2024-001",
			Amount:        1000.00,
			Currency:      "USD",
			Status:        "pending",
		}

		mockRepo.On("GetByID", ctx, id).Return(expectedInvoice, nil).Once()

		invoice, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, invoice)
		assert.Equal(t, id, invoice.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		invoice, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		mockRepo.AssertExpectations(t)
	})
}

func TestInvoiceService_ListByTenant(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	service := NewInvoiceService(mockRepo)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		expectedInvoices := []*models.Invoice{
			{
				ID:            uuid.New(),
				TenantID:      tenantID,
				CustomerID:    uuid.New(),
				InvoiceNumber: "INV-2024-001",
				Amount:        1000.00,
				Currency:      "USD",
				Status:        "pending",
			},
			{
				ID:            uuid.New(),
				TenantID:      tenantID,
				CustomerID:    uuid.New(),
				InvoiceNumber: "INV-2024-002",
				Amount:        2000.00,
				Currency:      "USD",
				Status:        "paid",
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(expectedInvoices, int64(2), nil).Once()

		invoices, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, invoices)
		assert.Len(t, invoices, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		invoices, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, invoices)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestInvoiceService_UpdateInvoice(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	service := NewInvoiceService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingInvoice := &models.Invoice{
			ID:            id,
			TenantID:      uuid.New(),
			CustomerID:    uuid.New(),
			InvoiceNumber: "INV-2024-001",
			Amount:        1000.00,
			Currency:      "USD",
			Status:        "pending",
		}

		newStatus := "processing"
		newNotes := "Payment in process"

		mockRepo.On("GetByID", ctx, id).Return(existingInvoice, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Invoice")).Return(nil).Once()

		req := UpdateInvoiceRequest{
			Status: &newStatus,
			Notes:  &newNotes,
		}

		invoice, err := service.UpdateInvoice(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, invoice)
		assert.Equal(t, newStatus, invoice.Status)
		assert.Equal(t, &newNotes, invoice.Notes)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invoice not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newStatus := "paid"
		req := UpdateInvoiceRequest{
			Status: &newStatus,
		}

		invoice, err := service.UpdateInvoice(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingInvoice := &models.Invoice{
			ID:     id,
			Status: "pending",
		}

		newStatus := "paid"

		mockRepo.On("GetByID", ctx, id).Return(existingInvoice, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Invoice")).Return(errors.New("db error")).Once()

		req := UpdateInvoiceRequest{
			Status: &newStatus,
		}

		invoice, err := service.UpdateInvoice(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "failed to update invoice")
		mockRepo.AssertExpectations(t)
	})
}

func TestInvoiceService_DeleteInvoice(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	service := NewInvoiceService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := service.DeleteInvoice(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("Delete", ctx, id).Return(errors.New("db error")).Once()

		err := service.DeleteInvoice(ctx, id)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestInvoiceService_PayInvoice(t *testing.T) {
	mockRepo := new(MockInvoiceRepository)
	service := NewInvoiceService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		pendingInvoice := &models.Invoice{
			ID:            id,
			TenantID:      uuid.New(),
			CustomerID:    uuid.New(),
			InvoiceNumber: "INV-2024-001",
			Amount:        1000.00,
			Currency:      "USD",
			Status:        "pending",
		}

		mockRepo.On("GetByID", ctx, id).Return(pendingInvoice, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Invoice")).Return(nil).Once()

		invoice, err := service.PayInvoice(ctx, id, "credit_card")

		assert.NoError(t, err)
		assert.NotNil(t, invoice)
		assert.Equal(t, "paid", invoice.Status)
		assert.NotNil(t, invoice.PaidAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invoice already paid", func(t *testing.T) {
		paidAt := time.Now()
		paidInvoice := &models.Invoice{
			ID:     id,
			Status: "paid",
			PaidAt: &paidAt,
		}

		mockRepo.On("GetByID", ctx, id).Return(paidInvoice, nil).Once()

		invoice, err := service.PayInvoice(ctx, id, "credit_card")

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "already paid")
		mockRepo.AssertExpectations(t)
	})

	t.Run("invoice not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		invoice, err := service.PayInvoice(ctx, id, "credit_card")

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		pendingInvoice := &models.Invoice{
			ID:     id,
			Status: "pending",
		}

		mockRepo.On("GetByID", ctx, id).Return(pendingInvoice, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Invoice")).Return(errors.New("db error")).Once()

		invoice, err := service.PayInvoice(ctx, id, "credit_card")

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "failed to pay invoice")
		mockRepo.AssertExpectations(t)
	})
}
