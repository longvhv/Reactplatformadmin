package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type InvoiceService struct {
	repo *repository.InvoiceRepository
}

func NewInvoiceService(repo *repository.InvoiceRepository) *InvoiceService {
	return &InvoiceService{repo: repo}
}

func (s *InvoiceService) GetAll(ctx context.Context, filters models.InvoiceFilters) ([]models.Invoice, error) {
	return s.repo.GetAll(ctx, filters)
}

func (s *InvoiceService) GetByID(ctx context.Context, id string) (*models.Invoice, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid invoice ID format")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *InvoiceService) GetByInvoiceNumber(ctx context.Context, invoiceNumber string) (*models.Invoice, error) {
	return s.repo.GetByInvoiceNumber(ctx, invoiceNumber)
}

func (s *InvoiceService) Create(ctx context.Context, req models.CreateInvoiceRequest) (*models.Invoice, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	existing, _ := s.repo.GetByInvoiceNumber(ctx, req.InvoiceNumber)
	if existing != nil {
		return nil, fmt.Errorf("invoice number already exists")
	}

	return s.repo.Create(ctx, req)
}

func (s *InvoiceService) Update(ctx context.Context, id string, req models.UpdateInvoiceRequest) (*models.Invoice, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid invoice ID format")
	}

	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, req)
}

func (s *InvoiceService) Delete(ctx context.Context, id string) error {
	if !isValidUUID(id) {
		return fmt.Errorf("invalid invoice ID format")
	}
	return s.repo.Delete(ctx, id)
}

func (s *InvoiceService) validateCreateRequest(req models.CreateInvoiceRequest) error {
	invoiceNumber := strings.TrimSpace(req.InvoiceNumber)
	if invoiceNumber == "" {
		return fmt.Errorf("invoice number is required")
	}

	if len(req.CurrencyCode) != 3 {
		return fmt.Errorf("currency code must be 3 characters")
	}

	if req.TotalAmount < 0 {
		return fmt.Errorf("total amount cannot be negative")
	}

	if req.ItemsSnapshot == nil || len(req.ItemsSnapshot) == 0 {
		return fmt.Errorf("invoice must have at least one item")
	}

	if req.BillingInfo == nil {
		return fmt.Errorf("billing info is required")
	}

	if req.BillingPeriodStart.After(req.BillingPeriodEnd) {
		return fmt.Errorf("billing period start must be before end")
	}

	return nil
}

func (s *InvoiceService) validateUpdateRequest(req models.UpdateInvoiceRequest) error {
	if req.TotalAmount != nil && *req.TotalAmount < 0 {
		return fmt.Errorf("total amount cannot be negative")
	}

	if req.Subtotal != nil && *req.Subtotal < 0 {
		return fmt.Errorf("subtotal cannot be negative")
	}

	if req.TaxAmount != nil && *req.TaxAmount < 0 {
		return fmt.Errorf("tax amount cannot be negative")
	}

	if req.DiscountAmount != nil && *req.DiscountAmount < 0 {
		return fmt.Errorf("discount amount cannot be negative")
	}

	if req.AmountPaid != nil && *req.AmountPaid < 0 {
		return fmt.Errorf("amount paid cannot be negative")
	}

	return nil
}
