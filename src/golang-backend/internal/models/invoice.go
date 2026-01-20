package models

import "time"

// InvoiceStatus represents invoice status
type InvoiceStatus string

const (
	InvoiceStatusDraft         InvoiceStatus = "DRAFT"
	InvoiceStatusOpen          InvoiceStatus = "OPEN"
	InvoiceStatusPaid          InvoiceStatus = "PAID"
	InvoiceStatusVoid          InvoiceStatus = "VOID"
	InvoiceStatusUncollectible InvoiceStatus = "UNCOLLECTIBLE"
)

// Invoice represents a subscription invoice
type Invoice struct {
	BaseModel
	TenantID            string                 `json:"tenant_id" db:"tenant_id" validate:"required,uuid"`
	SubscriptionID      *string                `json:"subscription_id,omitempty" db:"subscription_id"`
	OrderID             *string                `json:"order_id,omitempty" db:"order_id"`
	InvoiceNumber       string                 `json:"invoice_number" db:"invoice_number" validate:"required"`
	Status              InvoiceStatus          `json:"status" db:"status" validate:"required"`
	CurrencyCode        string                 `json:"currency_code" db:"currency_code" validate:"required,len=3"`
	Subtotal            float64                `json:"subtotal" db:"subtotal"`
	TaxAmount           float64                `json:"tax_amount" db:"tax_amount"`
	DiscountAmount      float64                `json:"discount_amount" db:"discount_amount"`
	TotalAmount         float64                `json:"total_amount" db:"total_amount"`
	AmountPaid          float64                `json:"amount_paid" db:"amount_paid"`
	AmountDue           float64                `json:"amount_due" db:"amount_due"`
	BillingInfo         map[string]interface{} `json:"billing_info" db:"billing_info"`
	ItemsSnapshot       []interface{}          `json:"items_snapshot" db:"items_snapshot"`
	TaxBreakdown        []interface{}          `json:"tax_breakdown" db:"tax_breakdown"`
	BillingPeriodStart  time.Time              `json:"billing_period_start" db:"billing_period_start" validate:"required"`
	BillingPeriodEnd    time.Time              `json:"billing_period_end" db:"billing_period_end" validate:"required"`
	DueDate             time.Time              `json:"due_date" db:"due_date" validate:"required"`
	PaidAt              *time.Time             `json:"paid_at,omitempty" db:"paid_at"`
	Metadata            map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	PriceAdjustments    []interface{}          `json:"price_adjustments" db:"price_adjustments"`
	PDFURL              *string                `json:"pdf_url,omitempty" db:"pdf_url"`
}

// CreateInvoiceRequest represents request to create an invoice
type CreateInvoiceRequest struct {
	TenantID           string                 `json:"tenant_id" validate:"required,uuid"`
	SubscriptionID     *string                `json:"subscription_id,omitempty" validate:"omitempty,uuid"`
	OrderID            *string                `json:"order_id,omitempty" validate:"omitempty,uuid"`
	InvoiceNumber      string                 `json:"invoice_number" validate:"required"`
	Status             InvoiceStatus          `json:"status,omitempty"`
	CurrencyCode       string                 `json:"currency_code" validate:"required,len=3"`
	Subtotal           float64                `json:"subtotal" validate:"min=0"`
	TaxAmount          float64                `json:"tax_amount,omitempty" validate:"min=0"`
	DiscountAmount     float64                `json:"discount_amount,omitempty" validate:"min=0"`
	TotalAmount        float64                `json:"total_amount" validate:"required,min=0"`
	BillingInfo        map[string]interface{} `json:"billing_info" validate:"required"`
	ItemsSnapshot      []interface{}          `json:"items_snapshot" validate:"required"`
	TaxBreakdown       []interface{}          `json:"tax_breakdown,omitempty"`
	BillingPeriodStart time.Time              `json:"billing_period_start" validate:"required"`
	BillingPeriodEnd   time.Time              `json:"billing_period_end" validate:"required"`
	DueDate            time.Time              `json:"due_date" validate:"required"`
	Metadata           map[string]interface{} `json:"metadata,omitempty"`
	PriceAdjustments   []interface{}          `json:"price_adjustments,omitempty"`
	PDFURL             *string                `json:"pdf_url,omitempty"`
}

// UpdateInvoiceRequest represents request to update an invoice
type UpdateInvoiceRequest struct {
	Status           *InvoiceStatus         `json:"status,omitempty"`
	Subtotal         *float64               `json:"subtotal,omitempty" validate:"omitempty,min=0"`
	TaxAmount        *float64               `json:"tax_amount,omitempty" validate:"omitempty,min=0"`
	DiscountAmount   *float64               `json:"discount_amount,omitempty" validate:"omitempty,min=0"`
	TotalAmount      *float64               `json:"total_amount,omitempty" validate:"omitempty,min=0"`
	AmountPaid       *float64               `json:"amount_paid,omitempty" validate:"omitempty,min=0"`
	BillingInfo      map[string]interface{} `json:"billing_info,omitempty"`
	ItemsSnapshot    []interface{}          `json:"items_snapshot,omitempty"`
	TaxBreakdown     []interface{}          `json:"tax_breakdown,omitempty"`
	DueDate          *time.Time             `json:"due_date,omitempty"`
	PaidAt           *time.Time             `json:"paid_at,omitempty"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
	PriceAdjustments []interface{}          `json:"price_adjustments,omitempty"`
	PDFURL           *string                `json:"pdf_url,omitempty"`
}

// InvoiceFilters represents filters for querying invoices
type InvoiceFilters struct {
	TenantID       *string        `json:"tenant_id,omitempty"`
	SubscriptionID *string        `json:"subscription_id,omitempty"`
	OrderID        *string        `json:"order_id,omitempty"`
	Status         *InvoiceStatus `json:"status,omitempty"`
	Search         *string        `json:"search,omitempty"`
	StartDate      *time.Time     `json:"start_date,omitempty"`
	EndDate        *time.Time     `json:"end_date,omitempty"`
	Overdue        *bool          `json:"overdue,omitempty"`
}
