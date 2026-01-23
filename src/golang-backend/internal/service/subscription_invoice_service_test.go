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

// MockSubscriptionInvoiceRepository is a mock of SubscriptionInvoiceRepository
type MockSubscriptionInvoiceRepository struct {
	mock.Mock
}

func (m *MockSubscriptionInvoiceRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionInvoice, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SubscriptionInvoice), args.Error(1)
}

func (m *MockSubscriptionInvoiceRepository) GetByInvoiceNumber(ctx context.Context, invoiceNumber string) (*models.SubscriptionInvoice, error) {
	args := m.Called(ctx, invoiceNumber)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SubscriptionInvoice), args.Error(1)
}

func (m *MockSubscriptionInvoiceRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*models.SubscriptionInvoice, int64, error) {
	args := m.Called(ctx, tenantID, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.SubscriptionInvoice), args.Get(1).(int64), args.Error(2)
}

func (m *MockSubscriptionInvoiceRepository) Create(ctx context.Context, invoice *models.SubscriptionInvoice) error {
	args := m.Called(ctx, invoice)
	return args.Error(0)
}

func (m *MockSubscriptionInvoiceRepository) Update(ctx context.Context, invoice *models.SubscriptionInvoice) error {
	args := m.Called(ctx, invoice)
	return args.Error(0)
}

func TestSubscriptionInvoiceService_CreateInvoice(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		now := time.Now()
		req := CreateSubscriptionInvoiceRequest{
			TenantID:           uuid.New(),
			TotalAmount:        1000.0,
			BillingPeriodStart: now.Format(time.RFC3339),
			BillingPeriodEnd:   now.AddDate(0, 1, 0).Format(time.RFC3339),
			DueDate:            now.AddDate(0, 0, 7).Format(time.RFC3339),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		invoice, err := service.CreateInvoice(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, invoice)
		assert.Equal(t, "DRAFT", invoice.Status) // Default
		assert.Equal(t, "VND", invoice.CurrencyCode) // Default
		assert.Equal(t, 0.0, invoice.AmountPaid)
		assert.Equal(t, 1000.0, invoice.AmountDue)
		assert.NotEmpty(t, invoice.InvoiceNumber)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full details", func(t *testing.T) {
		now := time.Now()
		subscriptionID := uuid.New()
		orderID := uuid.New()
		req := CreateSubscriptionInvoiceRequest{
			TenantID:       uuid.New(),
			SubscriptionID: &subscriptionID,
			OrderID:        &orderID,
			CurrencyCode:   "USD",
			Subtotal:       900.0,
			TaxAmount:      90.0,
			DiscountAmount: 50.0,
			TotalAmount:    940.0,
			BillingInfo: map[string]interface{}{
				"name":    "John Doe",
				"address": "123 Main St",
			},
			ItemsSnapshot: []interface{}{
				map[string]interface{}{"name": "Item 1", "price": 500.0},
				map[string]interface{}{"name": "Item 2", "price": 400.0},
			},
			TaxBreakdown: []interface{}{
				map[string]interface{}{"type": "VAT", "rate": 0.1, "amount": 90.0},
			},
			BillingPeriodStart: now.Format(time.RFC3339),
			BillingPeriodEnd:   now.AddDate(0, 1, 0).Format(time.RFC3339),
			DueDate:            now.AddDate(0, 0, 7).Format(time.RFC3339),
			Metadata: map[string]interface{}{
				"campaign": "spring2024",
			},
			PriceAdjustments: []interface{}{
				map[string]interface{}{"reason": "loyalty", "amount": -50.0},
			},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		invoice, err := service.CreateInvoice(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "USD", invoice.CurrencyCode)
		assert.Equal(t, 900.0, invoice.Subtotal)
		assert.Equal(t, 90.0, invoice.TaxAmount)
		assert.Equal(t, 50.0, invoice.DiscountAmount)
		assert.Equal(t, 940.0, invoice.TotalAmount)
		assert.NotNil(t, invoice.BillingInfo)
		assert.NotNil(t, invoice.ItemsSnapshot)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid billing_period_start", func(t *testing.T) {
		req := CreateSubscriptionInvoiceRequest{
			TenantID:           uuid.New(),
			TotalAmount:        1000.0,
			BillingPeriodStart: "invalid-date",
			BillingPeriodEnd:   time.Now().Format(time.RFC3339),
			DueDate:            time.Now().Format(time.RFC3339),
		}

		invoice, err := service.CreateInvoice(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "invalid billing_period_start format")
	})
}

func TestSubscriptionInvoiceService_UpdateInvoice(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:          invoiceID,
			Status:      "DRAFT",
			TotalAmount: 1000.0,
			AmountPaid:  0,
			Version:     1,
		}

		newSubtotal := 950.0
		newTaxAmount := 95.0
		newTotalAmount := 1045.0
		req := UpdateSubscriptionInvoiceRequest{
			Subtotal:    &newSubtotal,
			TaxAmount:   &newTaxAmount,
			TotalAmount: &newTotalAmount,
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		invoice, err := service.UpdateInvoice(ctx, invoiceID, req)

		assert.NoError(t, err)
		assert.Equal(t, 950.0, invoice.Subtotal)
		assert.Equal(t, 95.0, invoice.TaxAmount)
		assert.Equal(t, 1045.0, invoice.TotalAmount)
		assert.Equal(t, 1045.0, invoice.AmountDue) // Recalculated
		assert.Equal(t, 2, invoice.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot update non-draft invoice", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:     invoiceID,
			Status: "OPEN",
		}

		req := UpdateSubscriptionInvoiceRequest{}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()

		invoice, err := service.UpdateInvoice(ctx, invoiceID, req)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "can only update draft invoices")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionInvoiceService_FinalizeInvoice(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:      invoiceID,
			Status:  "DRAFT",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		invoice, err := service.FinalizeInvoice(ctx, invoiceID)

		assert.NoError(t, err)
		assert.Equal(t, "OPEN", invoice.Status)
		assert.Equal(t, 2, invoice.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot finalize non-draft invoice", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:     invoiceID,
			Status: "PAID",
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()

		invoice, err := service.FinalizeInvoice(ctx, invoiceID)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "can only finalize draft invoices")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionInvoiceService_MarkAsPaid(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success - full payment", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:          invoiceID,
			Status:      "OPEN",
			TotalAmount: 1000.0,
			AmountPaid:  0,
			Version:     1,
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		invoice, err := service.MarkAsPaid(ctx, invoiceID, 1000.0, nil)

		assert.NoError(t, err)
		assert.Equal(t, "PAID", invoice.Status)
		assert.Equal(t, 1000.0, invoice.AmountPaid)
		assert.Equal(t, 0.0, invoice.AmountDue)
		assert.NotNil(t, invoice.PaidAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - partial payment", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:          invoiceID,
			Status:      "OPEN",
			TotalAmount: 1000.0,
			AmountPaid:  0,
			Version:     1,
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		invoice, err := service.MarkAsPaid(ctx, invoiceID, 500.0, nil)

		assert.NoError(t, err)
		assert.Equal(t, "OPEN", invoice.Status) // Still open
		assert.Equal(t, 500.0, invoice.AmountPaid)
		assert.Equal(t, 500.0, invoice.AmountDue)
		mockRepo.AssertExpectations(t)
	})

	t.Run("already paid", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:     invoiceID,
			Status: "PAID",
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()

		invoice, err := service.MarkAsPaid(ctx, invoiceID, 1000.0, nil)

		assert.NoError(t, err)
		assert.Equal(t, existing, invoice) // Returns unchanged
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot mark draft as paid", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:     invoiceID,
			Status: "DRAFT",
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()

		invoice, err := service.MarkAsPaid(ctx, invoiceID, 1000.0, nil)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "can only mark open invoices as paid")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionInvoiceService_VoidInvoice(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:      invoiceID,
			Status:  "OPEN",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		invoice, err := service.VoidInvoice(ctx, invoiceID)

		assert.NoError(t, err)
		assert.Equal(t, "VOID", invoice.Status)
		assert.Equal(t, 2, invoice.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot void paid invoice", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:     invoiceID,
			Status: "PAID",
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()

		invoice, err := service.VoidInvoice(ctx, invoiceID)

		assert.Error(t, err)
		assert.Nil(t, invoice)
		assert.Contains(t, err.Error(), "cannot void paid invoice")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionInvoiceService_GeneratePDF(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invoiceID := uuid.New()
		existing := &models.SubscriptionInvoice{
			ID:            invoiceID,
			InvoiceNumber: "INV-12345",
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SubscriptionInvoice")).Return(nil).Once()

		pdfURL, err := service.GeneratePDF(ctx, invoiceID)

		assert.NoError(t, err)
		assert.NotEmpty(t, pdfURL)
		assert.Contains(t, pdfURL, "INV-12345")
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionInvoiceService_GetByID(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invoiceID := uuid.New()
		expected := &models.SubscriptionInvoice{
			ID:            invoiceID,
			InvoiceNumber: "INV-12345",
		}

		mockRepo.On("GetByID", ctx, invoiceID).Return(expected, nil).Once()

		invoice, err := service.GetByID(ctx, invoiceID)

		assert.NoError(t, err)
		assert.NotNil(t, invoice)
		assert.Equal(t, invoiceID, invoice.ID)
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionInvoiceService_GetByInvoiceNumber(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expected := &models.SubscriptionInvoice{
			ID:            uuid.New(),
			InvoiceNumber: "INV-12345",
		}

		mockRepo.On("GetByInvoiceNumber", ctx, "INV-12345").Return(expected, nil).Once()

		invoice, err := service.GetByInvoiceNumber(ctx, "INV-12345")

		assert.NoError(t, err)
		assert.NotNil(t, invoice)
		assert.Equal(t, "INV-12345", invoice.InvoiceNumber)
		mockRepo.AssertExpectations(t)
	})
}

func TestSubscriptionInvoiceService_ListByTenant(t *testing.T) {
	mockRepo := new(MockSubscriptionInvoiceRepository)
	service := NewSubscriptionInvoiceService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.SubscriptionInvoice{
			{ID: uuid.New(), Status: "OPEN"},
			{ID: uuid.New(), Status: "PAID"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", 10, 0).Return(expected, int64(2), nil).Once()

		invoices, total, err := service.ListByTenant(ctx, tenantID, "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, invoices, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})
}
