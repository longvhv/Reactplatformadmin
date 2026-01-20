package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type OrderService struct {
	repo *repository.OrderRepository
}

func NewOrderService(repo *repository.OrderRepository) *OrderService {
	return &OrderService{repo: repo}
}

func (s *OrderService) GetAll(ctx context.Context, filters models.OrderFilters) ([]models.Order, error) {
	return s.repo.GetAll(ctx, filters)
}

func (s *OrderService) GetByID(ctx context.Context, id string) (*models.Order, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid order ID format")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *OrderService) GetByOrderNumber(ctx context.Context, orderNumber string) (*models.Order, error) {
	return s.repo.GetByOrderNumber(ctx, orderNumber)
}

func (s *OrderService) Create(ctx context.Context, req models.CreateOrderRequest) (*models.Order, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	existing, _ := s.repo.GetByOrderNumber(ctx, req.OrderNumber)
	if existing != nil {
		return nil, fmt.Errorf("order number already exists")
	}

	return s.repo.Create(ctx, req)
}

func (s *OrderService) Update(ctx context.Context, id string, req models.UpdateOrderRequest) (*models.Order, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid order ID format")
	}

	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, req)
}

func (s *OrderService) Delete(ctx context.Context, id string) error {
	if !isValidUUID(id) {
		return fmt.Errorf("invalid order ID format")
	}
	return s.repo.Delete(ctx, id)
}

func (s *OrderService) validateCreateRequest(req models.CreateOrderRequest) error {
	orderNumber := strings.TrimSpace(req.OrderNumber)
	if orderNumber == "" {
		return fmt.Errorf("order number is required")
	}

	if len(req.CurrencyCode) != 3 {
		return fmt.Errorf("currency code must be 3 characters")
	}

	if req.TotalAmount < 0 {
		return fmt.Errorf("total amount cannot be negative")
	}

	if req.ItemsSnapshot == nil || len(req.ItemsSnapshot) == 0 {
		return fmt.Errorf("order must have at least one item")
	}

	if req.BillingInfo == nil {
		return fmt.Errorf("billing info is required")
	}

	return nil
}

func (s *OrderService) validateUpdateRequest(req models.UpdateOrderRequest) error {
	if req.TotalAmount != nil && *req.TotalAmount < 0 {
		return fmt.Errorf("total amount cannot be negative")
	}

	if req.SubtotalAmount != nil && *req.SubtotalAmount < 0 {
		return fmt.Errorf("subtotal amount cannot be negative")
	}

	if req.TaxAmount != nil && *req.TaxAmount < 0 {
		return fmt.Errorf("tax amount cannot be negative")
	}

	if req.DiscountAmount != nil && *req.DiscountAmount < 0 {
		return fmt.Errorf("discount amount cannot be negative")
	}

	return nil
}
