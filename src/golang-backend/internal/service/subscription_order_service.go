package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type SubscriptionOrderService struct {
	orderRepo repository.SubscriptionOrderRepository
}

func NewSubscriptionOrderService(orderRepo repository.SubscriptionOrderRepository) *SubscriptionOrderService {
	return &SubscriptionOrderService{
		orderRepo: orderRepo,
	}
}

type CreateSubscriptionOrderRequest struct {
	TenantID        uuid.UUID              `json:"tenant_id" binding:"required"`
	PONumber        *string                `json:"po_number"`
	Type            string                 `json:"type" binding:"required"`
	CurrencyCode    string                 `json:"currency_code"`
	SubtotalAmount  float64                `json:"subtotal_amount"`
	TaxAmount       float64                `json:"tax_amount"`
	DiscountAmount  float64                `json:"discount_amount"`
	CreditApplied   float64                `json:"credit_applied"`
	TotalAmount     float64                `json:"total_amount" binding:"required"`
	ItemsSnapshot   []interface{}          `json:"items_snapshot"`
	BillingInfo     map[string]interface{} `json:"billing_info"`
	PaymentMethod   *string                `json:"payment_method"`
	PaymentRefID    *string                `json:"payment_ref_id"`
	CreatedBy       uuid.UUID              `json:"-"`
}

type UpdateSubscriptionOrderRequest struct {
	PONumber       *string                `json:"po_number"`
	Status         *string                `json:"status"`
	SubtotalAmount *float64               `json:"subtotal_amount"`
	TaxAmount      *float64               `json:"tax_amount"`
	DiscountAmount *float64               `json:"discount_amount"`
	CreditApplied  *float64               `json:"credit_applied"`
	TotalAmount    *float64               `json:"total_amount"`
	ItemsSnapshot  []interface{}          `json:"items_snapshot"`
	BillingInfo    map[string]interface{} `json:"billing_info"`
	PaymentMethod  *string                `json:"payment_method"`
	PaymentRefID   *string                `json:"payment_ref_id"`
}

// GetByID gets order by ID
func (s *SubscriptionOrderService) GetByID(ctx context.Context, id uuid.UUID) (*models.SubscriptionOrder, error) {
	return s.orderRepo.GetByID(ctx, id)
}

// GetByOrderNumber gets order by order number
func (s *SubscriptionOrderService) GetByOrderNumber(ctx context.Context, orderNumber string) (*models.SubscriptionOrder, error) {
	return s.orderRepo.GetByOrderNumber(ctx, orderNumber)
}

// ListByTenant lists orders by tenant
func (s *SubscriptionOrderService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status, orderType string, page, limit int) ([]*models.SubscriptionOrder, int64, error) {
	offset := (page - 1) * limit
	return s.orderRepo.ListByTenant(ctx, tenantID, status, orderType, limit, offset)
}

// CreateOrder creates a new order
func (s *SubscriptionOrderService) CreateOrder(ctx context.Context, req CreateSubscriptionOrderRequest) (*models.SubscriptionOrder, error) {
	// Generate order number
	orderNumber := s.generateOrderNumber()

	currencyCode := req.CurrencyCode
	if currencyCode == "" {
		currencyCode = "VND"
	}

	itemsSnapshot := req.ItemsSnapshot
	if itemsSnapshot == nil {
		itemsSnapshot = []interface{}{}
	}

	billingInfo := req.BillingInfo
	if billingInfo == nil {
		billingInfo = make(map[string]interface{})
	}

	order := &models.SubscriptionOrder{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		CreatedBy:      &req.CreatedBy,
		OrderNumber:    orderNumber,
		PONumber:       req.PONumber,
		Type:           req.Type,
		Status:         "PENDING",
		CurrencyCode:   currencyCode,
		SubtotalAmount: req.SubtotalAmount,
		TaxAmount:      req.TaxAmount,
		DiscountAmount: req.DiscountAmount,
		CreditApplied:  req.CreditApplied,
		TotalAmount:    req.TotalAmount,
		ItemsSnapshot:  itemsSnapshot,
		BillingInfo:    billingInfo,
		PaymentMethod:  req.PaymentMethod,
		PaymentRefID:   req.PaymentRefID,
		Version:        1,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	return order, nil
}

// UpdateOrder updates an order
func (s *SubscriptionOrderService) UpdateOrder(ctx context.Context, id uuid.UUID, req UpdateSubscriptionOrderRequest) (*models.SubscriptionOrder, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	// Can only update draft or pending orders
	if order.Status != "DRAFT" && order.Status != "PENDING" {
		return nil, fmt.Errorf("cannot update order with status: %s", order.Status)
	}

	if req.PONumber != nil {
		order.PONumber = req.PONumber
	}
	if req.Status != nil {
		order.Status = *req.Status
	}
	if req.SubtotalAmount != nil {
		order.SubtotalAmount = *req.SubtotalAmount
	}
	if req.TaxAmount != nil {
		order.TaxAmount = *req.TaxAmount
	}
	if req.DiscountAmount != nil {
		order.DiscountAmount = *req.DiscountAmount
	}
	if req.CreditApplied != nil {
		order.CreditApplied = *req.CreditApplied
	}
	if req.TotalAmount != nil {
		order.TotalAmount = *req.TotalAmount
	}
	if req.ItemsSnapshot != nil {
		order.ItemsSnapshot = req.ItemsSnapshot
	}
	if req.BillingInfo != nil {
		order.BillingInfo = req.BillingInfo
	}
	if req.PaymentMethod != nil {
		order.PaymentMethod = req.PaymentMethod
	}
	if req.PaymentRefID != nil {
		order.PaymentRefID = req.PaymentRefID
	}

	order.UpdatedAt = time.Now()
	order.Version++

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to update order: %w", err)
	}

	return order, nil
}

// MarkAsPaid marks order as paid
func (s *SubscriptionOrderService) MarkAsPaid(ctx context.Context, id uuid.UUID, paymentMethod string, paymentRefID *string) (*models.SubscriptionOrder, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	if order.Status == "PAID" {
		return order, nil
	}

	if order.Status != "PENDING" {
		return nil, fmt.Errorf("can only mark pending orders as paid")
	}

	order.Status = "PAID"
	order.PaymentMethod = &paymentMethod
	if paymentRefID != nil {
		order.PaymentRefID = paymentRefID
	}
	order.UpdatedAt = time.Now()
	order.Version++

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to mark order as paid: %w", err)
	}

	// TODO: Trigger subscription activation, asset provisioning, etc.

	return order, nil
}

// CancelOrder cancels an order
func (s *SubscriptionOrderService) CancelOrder(ctx context.Context, id uuid.UUID) (*models.SubscriptionOrder, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	if order.Status == "PAID" {
		return nil, fmt.Errorf("cannot cancel paid order, use refund instead")
	}

	if order.Status == "CANCELLED" {
		return order, nil
	}

	order.Status = "CANCELLED"
	order.UpdatedAt = time.Now()
	order.Version++

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to cancel order: %w", err)
	}

	return order, nil
}

// RefundOrder refunds an order
func (s *SubscriptionOrderService) RefundOrder(ctx context.Context, id uuid.UUID, refundAmount *float64, reason *string) (*models.SubscriptionOrder, error) {
	order, err := s.orderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	if order.Status != "PAID" {
		return nil, fmt.Errorf("can only refund paid orders")
	}

	// Store refund info in billing_info
	if order.BillingInfo == nil {
		order.BillingInfo = make(map[string]interface{})
	}
	order.BillingInfo["refund_amount"] = refundAmount
	order.BillingInfo["refund_reason"] = reason
	order.BillingInfo["refunded_at"] = time.Now()

	order.Status = "REFUNDED"
	order.UpdatedAt = time.Now()
	order.Version++

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to refund order: %w", err)
	}

	// TODO: Trigger refund processing, subscription cancellation, etc.

	return order, nil
}

// Helper functions
func (s *SubscriptionOrderService) generateOrderNumber() string {
	return fmt.Sprintf("ORD-%d", time.Now().Unix())
}
