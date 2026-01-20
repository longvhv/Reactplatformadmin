package models

import "time"

// OrderType represents order type
type OrderType string

const (
	OrderTypeNew       OrderType = "NEW"
	OrderTypeRenewal   OrderType = "RENEWAL"
	OrderTypeUpgrade   OrderType = "UPGRADE"
	OrderTypeDowngrade OrderType = "DOWNGRADE"
	OrderTypeAddOn     OrderType = "ADD_ON"
)

// OrderStatus represents order status
type OrderStatus string

const (
	OrderStatusDraft     OrderStatus = "DRAFT"
	OrderStatusPending   OrderStatus = "PENDING"
	OrderStatusPaid      OrderStatus = "PAID"
	OrderStatusCancelled OrderStatus = "CANCELLED"
	OrderStatusFailed    OrderStatus = "FAILED"
	OrderStatusRefunded  OrderStatus = "REFUNDED"
)

// Order represents a subscription order
type Order struct {
	BaseModel
	TenantID       string                 `json:"tenant_id" db:"tenant_id" validate:"required,uuid"`
	CreatedBy      *string                `json:"created_by,omitempty" db:"created_by"`
	OrderNumber    string                 `json:"order_number" db:"order_number" validate:"required"`
	PONumber       *string                `json:"po_number,omitempty" db:"po_number"`
	Type           OrderType              `json:"type" db:"type" validate:"required"`
	Status         OrderStatus            `json:"status" db:"status" validate:"required"`
	CurrencyCode   string                 `json:"currency_code" db:"currency_code" validate:"required,len=3"`
	SubtotalAmount float64                `json:"subtotal_amount" db:"subtotal_amount"`
	TaxAmount      float64                `json:"tax_amount" db:"tax_amount"`
	DiscountAmount float64                `json:"discount_amount" db:"discount_amount"`
	CreditApplied  float64                `json:"credit_applied" db:"credit_applied"`
	TotalAmount    float64                `json:"total_amount" db:"total_amount"`
	ItemsSnapshot  []interface{}          `json:"items_snapshot" db:"items_snapshot"`
	BillingInfo    map[string]interface{} `json:"billing_info" db:"billing_info"`
	PaymentMethod  *string                `json:"payment_method,omitempty" db:"payment_method"`
	PaymentRefID   *string                `json:"payment_ref_id,omitempty" db:"payment_ref_id"`
}

// CreateOrderRequest represents request to create an order
type CreateOrderRequest struct {
	TenantID       string                 `json:"tenant_id" validate:"required,uuid"`
	CreatedBy      *string                `json:"created_by,omitempty" validate:"omitempty,uuid"`
	OrderNumber    string                 `json:"order_number" validate:"required"`
	PONumber       *string                `json:"po_number,omitempty"`
	Type           OrderType              `json:"type" validate:"required"`
	Status         OrderStatus            `json:"status,omitempty"`
	CurrencyCode   string                 `json:"currency_code" validate:"required,len=3"`
	SubtotalAmount float64                `json:"subtotal_amount" validate:"min=0"`
	TaxAmount      float64                `json:"tax_amount,omitempty" validate:"min=0"`
	DiscountAmount float64                `json:"discount_amount,omitempty" validate:"min=0"`
	CreditApplied  float64                `json:"credit_applied,omitempty" validate:"min=0"`
	TotalAmount    float64                `json:"total_amount" validate:"required,min=0"`
	ItemsSnapshot  []interface{}          `json:"items_snapshot" validate:"required"`
	BillingInfo    map[string]interface{} `json:"billing_info" validate:"required"`
	PaymentMethod  *string                `json:"payment_method,omitempty"`
	PaymentRefID   *string                `json:"payment_ref_id,omitempty"`
}

// UpdateOrderRequest represents request to update an order
type UpdateOrderRequest struct {
	Status         *OrderStatus           `json:"status,omitempty"`
	PONumber       *string                `json:"po_number,omitempty"`
	SubtotalAmount *float64               `json:"subtotal_amount,omitempty" validate:"omitempty,min=0"`
	TaxAmount      *float64               `json:"tax_amount,omitempty" validate:"omitempty,min=0"`
	DiscountAmount *float64               `json:"discount_amount,omitempty" validate:"omitempty,min=0"`
	CreditApplied  *float64               `json:"credit_applied,omitempty" validate:"omitempty,min=0"`
	TotalAmount    *float64               `json:"total_amount,omitempty" validate:"omitempty,min=0"`
	ItemsSnapshot  []interface{}          `json:"items_snapshot,omitempty"`
	BillingInfo    map[string]interface{} `json:"billing_info,omitempty"`
	PaymentMethod  *string                `json:"payment_method,omitempty"`
	PaymentRefID   *string                `json:"payment_ref_id,omitempty"`
}

// OrderFilters represents filters for querying orders
type OrderFilters struct {
	TenantID  *string      `json:"tenant_id,omitempty"`
	CreatedBy *string      `json:"created_by,omitempty"`
	Type      *OrderType   `json:"type,omitempty"`
	Status    *OrderStatus `json:"status,omitempty"`
	Search    *string      `json:"search,omitempty"`
	StartDate *time.Time   `json:"start_date,omitempty"`
	EndDate   *time.Time   `json:"end_date,omitempty"`
}
