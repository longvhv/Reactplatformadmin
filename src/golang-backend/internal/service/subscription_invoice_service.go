package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type SubscriptionInvoiceService struct {
	invoiceRepo repository.SubscriptionInvoiceRepository
}

func NewSubscriptionInvoiceService(invoiceRepo repository.SubscriptionInvoiceRepository) *SubscriptionInvoiceService {
	return &SubscriptionInvoiceService{
		invoiceRepo: invoiceRepo,
	}
}

type CreateSubscriptionInvoiceRequest struct {
	TenantID            uuid.UUID              `json:"tenant_id" binding:"required"`
	SubscriptionID      *uuid.UUID             `json:"subscription_id"`
	OrderID             *uuid.UUID             `json:"order_id"`
	CurrencyCode        string                 `json:"currency_code"`
	Subtotal            float64                `json:"subtotal"`
	TaxAmount           float64                `json:"tax_amount"`
	DiscountAmount      float64                `json:"discount_amount"`
	TotalAmount         float64                `json:"total_amount" binding:"required"`
	BillingInfo         map[string]interface{} `json:"billing_info"`
	ItemsSnapshot       []interface{}          `json:"items_snapshot"`
	TaxBreakdown        []interface{}          `json:"tax_breakdown"`
	BillingPeriodStart  string                 `json:"billing_period_start" binding:"required"`
	BillingPeriodEnd    string                 `json:"billing_period_end" binding:"required"`
	DueDate             string                 `json:"due_date" binding:"required"`
	Metadata            map[string]interface{} `json:"metadata"`
	PriceAdjustments    []interface{}          `json:"price_adjustments"`
}

type UpdateSubscriptionInvoiceRequest struct {
	Subtotal         *float64               `json:"subtotal"`
	TaxAmount        *float64               `json:"tax_amount"`
	DiscountAmount   *float64               `json:"discount_amount"`
	TotalAmount      *float64               `json:"total_amount"`
	BillingInfo      map[string]interface{} `json:"billing_info"`
	ItemsSnapshot    []interface{}          `json:"items_snapshot"`
	TaxBreakdown     []interface{}          `json:"tax_breakdown"`
	DueDate          *string                `json:"due_date"`
	Metadata         map[string]interface{} `json:"metadata"`
	PriceAdjustments []interface{}          `json:"price_adjustments"`
}

// GetByID gets invoice by ID
func (s *SubscriptionInvoiceService) GetByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionInvoice, error) {
	return s.invoiceRepo.GetByID(ctx, id)
}

// GetByInvoiceNumber gets invoice by invoice number
func (s *SubscriptionInvoiceService) GetByInvoiceNumber(ctx context.Context, invoiceNumber string) (*models.SubscriptionInvoice, error) {
	return s.invoiceRepo.GetByInvoiceNumber(ctx, invoiceNumber)
}

// ListByTenant lists invoices by tenant
func (s *SubscriptionInvoiceService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, page, limit int) ([]*models.SubscriptionInvoice, int64, error) {
	offset := (page - 1) * limit
	return s.invoiceRepo.ListByTenant(ctx, tenantID, status, limit, offset)
}

// CreateInvoice creates a new invoice
func (s *SubscriptionInvoiceService) CreateInvoice(ctx context.Context, req CreateSubscriptionInvoiceRequest) (*models.SubscriptionInvoice, error) {
	// Parse dates
	billingPeriodStart, err := time.Parse(time.RFC3339, req.BillingPeriodStart)
	if err != nil {
		return nil, fmt.Errorf("invalid billing_period_start format: %w", err)
	}

	billingPeriodEnd, err := time.Parse(time.RFC3339, req.BillingPeriodEnd)
	if err != nil {
		return nil, fmt.Errorf("invalid billing_period_end format: %w", err)
	}

	dueDate, err := time.Parse(time.RFC3339, req.DueDate)
	if err != nil {
		return nil, fmt.Errorf("invalid due_date format: %w", err)
	}

	// Generate invoice number
	invoiceNumber := s.generateInvoiceNumber()

	currencyCode := req.CurrencyCode
	if currencyCode == "" {
		currencyCode = "VND"
	}

	billingInfo := req.BillingInfo
	if billingInfo == nil {
		billingInfo = make(map[string]interface{})
	}

	itemsSnapshot := req.ItemsSnapshot
	if itemsSnapshot == nil {
		itemsSnapshot = []interface{}{}
	}

	taxBreakdown := req.TaxBreakdown
	if taxBreakdown == nil {
		taxBreakdown = []interface{}{}
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	priceAdjustments := req.PriceAdjustments
	if priceAdjustments == nil {
		priceAdjustments = []interface{}{}
	}

	amountDue := req.TotalAmount

	invoice := &models.SubscriptionInvoice{
		ID:                 uuid.New(),
		TenantID:           req.TenantID,
		SubscriptionID:     req.SubscriptionID,
		OrderID:            req.OrderID,
		InvoiceNumber:      invoiceNumber,
		Status:             "DRAFT",
		CurrencyCode:       currencyCode,
		Subtotal:           req.Subtotal,
		TaxAmount:          req.TaxAmount,
		DiscountAmount:     req.DiscountAmount,
		TotalAmount:        req.TotalAmount,
		AmountPaid:         0,
		AmountDue:          amountDue,
		BillingInfo:        billingInfo,
		ItemsSnapshot:      itemsSnapshot,
		TaxBreakdown:       taxBreakdown,
		BillingPeriodStart: billingPeriodStart,
		BillingPeriodEnd:   billingPeriodEnd,
		DueDate:            dueDate,
		Metadata:           metadata,
		PriceAdjustments:   priceAdjustments,
		Version:            1,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.invoiceRepo.Create(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to create invoice: %w", err)
	}

	return invoice, nil
}

// UpdateInvoice updates an invoice
func (s *SubscriptionInvoiceService) UpdateInvoice(ctx context.Context, id uuid.UUID, req UpdateSubscriptionInvoiceRequest) (*models.SubscriptionInvoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	// Can only update draft invoices
	if invoice.Status != "DRAFT" {
		return nil, fmt.Errorf("can only update draft invoices")
	}

	if req.Subtotal != nil {
		invoice.Subtotal = *req.Subtotal
	}
	if req.TaxAmount != nil {
		invoice.TaxAmount = *req.TaxAmount
	}
	if req.DiscountAmount != nil {
		invoice.DiscountAmount = *req.DiscountAmount
	}
	if req.TotalAmount != nil {
		invoice.TotalAmount = *req.TotalAmount
		invoice.AmountDue = *req.TotalAmount - invoice.AmountPaid
	}
	if req.BillingInfo != nil {
		invoice.BillingInfo = req.BillingInfo
	}
	if req.ItemsSnapshot != nil {
		invoice.ItemsSnapshot = req.ItemsSnapshot
	}
	if req.TaxBreakdown != nil {
		invoice.TaxBreakdown = req.TaxBreakdown
	}
	if req.DueDate != nil {
		dueDate, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			return nil, fmt.Errorf("invalid due_date format: %w", err)
		}
		invoice.DueDate = dueDate
	}
	if req.Metadata != nil {
		invoice.Metadata = req.Metadata
	}
	if req.PriceAdjustments != nil {
		invoice.PriceAdjustments = req.PriceAdjustments
	}

	invoice.UpdatedAt = time.Now()
	invoice.Version++

	if err := s.invoiceRepo.Update(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to update invoice: %w", err)
	}

	return invoice, nil
}

// FinalizeInvoice finalizes an invoice (DRAFT -> OPEN)
func (s *SubscriptionInvoiceService) FinalizeInvoice(ctx context.Context, id uuid.UUID) (*models.SubscriptionInvoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if invoice.Status != "DRAFT" {
		return nil, fmt.Errorf("can only finalize draft invoices")
	}

	invoice.Status = "OPEN"
	invoice.UpdatedAt = time.Now()
	invoice.Version++

	if err := s.invoiceRepo.Update(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to finalize invoice: %w", err)
	}

	// TODO: Send invoice email to customer

	return invoice, nil
}

// MarkAsPaid marks invoice as paid
func (s *SubscriptionInvoiceService) MarkAsPaid(ctx context.Context, id uuid.UUID, amountPaid float64, paidAtStr *string) (*models.SubscriptionInvoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if invoice.Status == "PAID" {
		return invoice, nil
	}

	if invoice.Status != "OPEN" {
		return nil, fmt.Errorf("can only mark open invoices as paid")
	}

	var paidAt time.Time
	if paidAtStr != nil && *paidAtStr != "" {
		parsed, err := time.Parse(time.RFC3339, *paidAtStr)
		if err != nil {
			return nil, fmt.Errorf("invalid paid_at format: %w", err)
		}
		paidAt = parsed
	} else {
		paidAt = time.Now()
	}

	invoice.AmountPaid = amountPaid
	invoice.AmountDue = invoice.TotalAmount - amountPaid

	if invoice.AmountDue <= 0 {
		invoice.Status = "PAID"
	}

	invoice.PaidAt = &paidAt
	invoice.UpdatedAt = time.Now()
	invoice.Version++

	if err := s.invoiceRepo.Update(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to mark invoice as paid: %w", err)
	}

	return invoice, nil
}

// VoidInvoice voids an invoice
func (s *SubscriptionInvoiceService) VoidInvoice(ctx context.Context, id uuid.UUID) (*models.SubscriptionInvoice, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("invoice not found: %w", err)
	}

	if invoice.Status == "PAID" {
		return nil, fmt.Errorf("cannot void paid invoice")
	}

	invoice.Status = "VOID"
	invoice.UpdatedAt = time.Now()
	invoice.Version++

	if err := s.invoiceRepo.Update(ctx, invoice); err != nil {
		return nil, fmt.Errorf("failed to void invoice: %w", err)
	}

	return invoice, nil
}

// GeneratePDF generates invoice PDF
func (s *SubscriptionInvoiceService) GeneratePDF(ctx context.Context, id uuid.UUID) (string, error) {
	invoice, err := s.invoiceRepo.GetByID(ctx, id)
	if err != nil {
		return "", fmt.Errorf("invoice not found: %w", err)
	}

	// TODO: Implement PDF generation
	// For now, just return a placeholder URL
	pdfURL := fmt.Sprintf("https://storage.example.com/invoices/%s.pdf", invoice.InvoiceNumber)

	invoice.PDFURL = &pdfURL
	invoice.UpdatedAt = time.Now()

	if err := s.invoiceRepo.Update(ctx, invoice); err != nil {
		return "", fmt.Errorf("failed to update invoice with PDF URL: %w", err)
	}

	return pdfURL, nil
}

// Helper functions
func (s *SubscriptionInvoiceService) generateInvoiceNumber() string {
	return fmt.Sprintf("INV-%d", time.Now().Unix())
}
