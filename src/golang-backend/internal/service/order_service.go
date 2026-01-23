package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/cache"
)

type OrderService struct {
	orderRepo repository.OrderRepository
	cache     cache.Cache
}

func NewOrderService(orderRepo repository.OrderRepository, cache cache.Cache) *OrderService {
	return &OrderService{
		orderRepo: orderRepo,
		cache:     cache,
	}
}

// GetByID gets order by ID
func (s *OrderService) GetByID(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	cacheKey := cache.OrderCacheKey(id.String())
	var order models.Order
	err := s.cache.GetJSON(ctx, cacheKey, &order)
	if err == nil {
		return &order, nil
	}

	dbOrder, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	_ = s.cache.SetJSON(ctx, cacheKey, dbOrder, cache.OrderTTL)
	return dbOrder, nil
}

// ListByTenant lists orders by tenant
func (s *OrderService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Order, int64, error) {
	offset := (page - 1) * limit
	orders, total, err := s.orderRepo.ListByTenant(ctx, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

// CreateOrder creates a new order
func (s *OrderService) CreateOrder(ctx context.Context, req CreateOrderRequest) (*models.Order, error) {
	if req.Quantity <= 0 {
		return nil, fmt.Errorf("quantity must be greater than 0")
	}

	if req.TotalAmount < 0 {
		return nil, fmt.Errorf("total amount must be non-negative")
	}

	order := &models.Order{
		ID:           uuid.New(),
		TenantID:     req.TenantID,
		CustomerID:   req.CustomerID,
		ProductID:    req.ProductID,
		Quantity:     req.Quantity,
		UnitPrice:    req.UnitPrice,
		TotalAmount:  req.TotalAmount,
		Currency:     req.Currency,
		BillingCycle: req.BillingCycle,
		Status:       req.Status,
		Notes:        req.Notes,
		Metadata:     req.Metadata,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if order.Status == "" {
		order.Status = "pending"
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return order, nil
}

// UpdateOrder updates an order
func (s *OrderService) UpdateOrder(ctx context.Context, id uuid.UUID, req UpdateOrderRequest) (*models.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	if req.Status != nil {
		order.Status = *req.Status
	}
	if req.Notes != nil {
		order.Notes = req.Notes
	}
	if req.Metadata != nil {
		order.Metadata = req.Metadata
	}
	if req.ProcessedAt != nil {
		order.ProcessedAt = req.ProcessedAt
	}
	if req.CompletedAt != nil {
		order.CompletedAt = req.CompletedAt
	}
	if req.CancelledAt != nil {
		order.CancelledAt = req.CancelledAt
	}

	order.UpdatedAt = time.Now()

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to update order: %w", err)
	}

	cacheKey := cache.OrderCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return order, nil
}

// DeleteOrder deletes an order
func (s *OrderService) DeleteOrder(ctx context.Context, id uuid.UUID) error {
	if err := s.orderRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}

	cacheKey := cache.OrderCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}

// CancelOrder cancels an order
func (s *OrderService) CancelOrder(ctx context.Context, id uuid.UUID, reason string) (*models.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	if order.Status == "completed" {
		return nil, fmt.Errorf("cannot cancel completed order")
	}

	if order.Status == "cancelled" {
		return nil, fmt.Errorf("order already cancelled")
	}

	now := time.Now()
	order.Status = "cancelled"
	order.CancelledAt = &now
	if reason != "" {
		notes := reason
		order.Notes = &notes
	}
	order.UpdatedAt = now

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to cancel order: %w", err)
	}

	cacheKey := cache.OrderCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return order, nil
}

// CompleteOrder completes an order
func (s *OrderService) CompleteOrder(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	if order.Status == "cancelled" {
		return nil, fmt.Errorf("cannot complete cancelled order")
	}

	if order.Status == "completed" {
		return nil, fmt.Errorf("order already completed")
	}

	now := time.Now()
	order.Status = "completed"
	order.CompletedAt = &now
	order.UpdatedAt = now

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to complete order: %w", err)
	}

	cacheKey := cache.OrderCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return order, nil
}
