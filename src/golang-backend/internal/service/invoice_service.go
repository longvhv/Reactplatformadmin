package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type InvoiceService struct {
	invoiceRepo repository.InvoiceRepository
}

func NewInvoiceService(invoiceRepo repository.InvoiceRepository) *InvoiceService {
	return &InvoiceService{
		invoiceRepo: invoiceRepo,
	}
}

type CreateInvoiceRequest struct {
	TenantID      uuid.UUID              `json:"tenant_id" binding:"required"`
	CustomerID    uuid.UUID              `json:"customer_id" binding:"required"`
	OrderID       *uuid.UUID             `json:"order_id"`
	InvoiceNumber string                 `json:"invoice_number" binding:"required"`
	Amount        float64                `json:"amount" binding:"required,min=0"`
	Currency      string                 `json:"currency" binding:"required"`
	DueDate       *time.Time             `json:"due_date"`
	Items         []InvoiceItem          `json:"items"`
	Notes         *string                `json:"notes"`
	Metadata      map[string]interface{} `json:"metadata"`
}

type UpdateInvoiceRequest struct {
	Status   *string                `json:"status"`
	PaidAt   *time.Time             `json:"paid_at"`
	Notes    *string                `json:"notes"`
	Metadata map[string]interface{} `json:"metadata"`
}

type InvoiceItem struct {
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Amount      float64 `json:"amount"`
}

// GetByID gets invoice by ID
func (s *InvoiceService) GetByID(ctx context.Context, id uuid.UUID) (*models.Invoice, error) {
	return s.invoiceRepo.GetByID(ctx, id)
}

// ListByTenant lists invoices by tenant
func (s *InvoiceService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Invoice, int64, error) {
	offset := (page - 1) * limit
	return s.invoiceRepo.ListByTenant(ctx, tenantID, limit, offset)
}

// CreateInvoice creates a new invoice
func (s *InvoiceService) CreateInvoice(ctx context.Context, req CreateInvoiceRequest) (*models.Invoice, error) {
	if req.InvoiceNumber == "" {
		return nil, fmt.Errorf("invoice number is required")
	}

	// Check if invoice number exists
	exists, err := s.invoiceRepo.ExistsByNumber(ctx, req.TenantID, req.InvoiceNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to check invoice number: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("invoice number already exists")
	}

	invoice := &models.Invoice{
		ID:            uuid.New(),
		TenantID:      req.TenantID,
		CustomerID:    req.CustomerID,
		OrderID:       req.OrderID,
		InvoiceNumber: req.InvoiceNumber,
		Amount:        req.Amount,
		Currency:      req.Currency,
		Status:        "pending",
		DueDate:       req.DueDate,
		Notes:         req.Notes,
		Metadata:      req.Metadata,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.invoiceRepo.Create(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	return invoice, nil
}

// UpdateInvoice updates an invoice
func (s *InvoiceService) UpdateInvoice(ctx context.Context, id uuid.UUID, req UpdateInvoiceRequest) (*models.Invoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if req.Status != nil {
		invoice.Status = *req.Status
	}
	if req.PaidAt != nil {
		invoice.PaidAt = req.PaidAt
	}
	if req.Notes != nil {
		invoice.Notes = req.Notes
	}
	if req.Metadata != nil {
		invoice.Metadata = req.Metadata
	}

	invoice.UpdatedAt = time.Now()

	if err := s.invoiceRepo.Update(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	return invoice, nil
}

// DeleteInvoice deletes an invoice
func (s *InvoiceService) DeleteInvoice(ctx context.Context, id uuid.UUID) error {
	return s.invoiceRepo.Delete(ctx, id)
}

// PayInvoice marks invoice as paid
func (s *InvoiceService) PayInvoice(ctx context.Context, id uuid.UUID, paymentMethod string) (*models.Invoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if invoice.Status == "paid" {
		return nil, fmt.Errorf("invoice already paid")
	}

	now := time.Now()
	invoice.Status = "paid"
	invoice.PaidAt = &now
	invoice.UpdatedAt = now

	if err := s.invoiceRepo.Update(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to pay invoice: %w", err)
	}

	return invoice, nil
}
