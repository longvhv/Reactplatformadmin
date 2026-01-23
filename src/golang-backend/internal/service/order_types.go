package service

import (
	"time"

	"github.com/google/uuid"
)

// CreateOrderRequest represents create order request
type CreateOrderRequest struct {
	TenantID      uuid.UUID              `json:"tenant_id" binding:"required"`
	CustomerID    uuid.UUID              `json:"customer_id" binding:"required"`
	ProductID     uuid.UUID              `json:"product_id" binding:"required"`
	Quantity      int                    `json:"quantity" binding:"required,min=1"`
	UnitPrice     float64                `json:"unit_price" binding:"required,min=0"`
	TotalAmount   float64                `json:"total_amount" binding:"required,min=0"`
	Currency      string                 `json:"currency" binding:"required"`
	BillingCycle  *string                `json:"billing_cycle"`
	Status        string                 `json:"status"`
	Notes         *string                `json:"notes"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// UpdateOrderRequest represents update order request
type UpdateOrderRequest struct {
	Status      *string                `json:"status"`
	Notes       *string                `json:"notes"`
	Metadata    map[string]interface{} `json:"metadata"`
	ProcessedAt *time.Time             `json:"processed_at"`
	CompletedAt *time.Time             `json:"completed_at"`
	CancelledAt *time.Time             `json:"cancelled_at"`
}
