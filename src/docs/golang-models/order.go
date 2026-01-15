package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// ORDER - Main Order Model
// ============================================================================
// Purpose: Core order entity for e-commerce/subscription orders
// Table: orders
// Primary Key: _id (UUID)
// Features: Multi-status, Payment tracking, Shipping, Tax calculation
// ============================================================================

// OrderType represents the type of order
type OrderType string

const (
	OrderTypeProduct      OrderType = "PRODUCT"      // Physical/digital product
	OrderTypeSubscription OrderType = "SUBSCRIPTION" // Subscription order
	OrderTypeService      OrderType = "SERVICE"      // Service order
	OrderTypeRenewal      OrderType = "RENEWAL"      // Subscription renewal
)

// OrderStatus represents the order lifecycle status
type OrderStatus string

const (
	OrderStatusDraft      OrderStatus = "DRAFT"      // Being created
	OrderStatusPending    OrderStatus = "PENDING"    // Pending payment
	OrderStatusConfirmed  OrderStatus = "CONFIRMED"  // Payment confirmed
	OrderStatusProcessing OrderStatus = "PROCESSING" // Being processed
	OrderStatusShipped    OrderStatus = "SHIPPED"    // Shipped
	OrderStatusDelivered  OrderStatus = "DELIVERED"  // Delivered
	OrderStatusCompleted  OrderStatus = "COMPLETED"  // Completed
	OrderStatusCanceled   OrderStatus = "CANCELED"   // Canceled
	OrderStatusRefunded   OrderStatus = "REFUNDED"   // Refunded
	OrderStatusFailed     OrderStatus = "FAILED"     // Payment failed
)

// PaymentStatus represents payment status
type PaymentStatus string

const (
	PaymentStatusPending    PaymentStatus = "PENDING"
	PaymentStatusAuthorized PaymentStatus = "AUTHORIZED"
	PaymentStatusPaid       PaymentStatus = "PAID"
	PaymentStatusPartiallyPaid PaymentStatus = "PARTIALLY_PAID"
	PaymentStatusFailed     PaymentStatus = "FAILED"
	PaymentStatusRefunded   PaymentStatus = "REFUNDED"
	PaymentStatusCanceled   PaymentStatus = "CANCELED"
)

// FulfillmentStatus represents fulfillment status
type FulfillmentStatus string

const (
	FulfillmentStatusUnfulfilled        FulfillmentStatus = "UNFULFILLED"
	FulfillmentStatusPartiallyFulfilled FulfillmentStatus = "PARTIALLY_FULFILLED"
	FulfillmentStatusFulfilled          FulfillmentStatus = "FULFILLED"
	FulfillmentStatusCanceled           FulfillmentStatus = "CANCELED"
)

// ShippingAddress stores shipping address (JSONB)
type ShippingAddress struct {
	FirstName   string  `json:"first_name"`
	LastName    string  `json:"last_name"`
	Company     *string `json:"company,omitempty"`
	Address1    string  `json:"address1"`
	Address2    *string `json:"address2,omitempty"`
	City        string  `json:"city"`
	State       *string `json:"state,omitempty"`
	PostalCode  string  `json:"postal_code"`
	Country     string  `json:"country"`
	Phone       *string `json:"phone,omitempty"`
	Email       *string `json:"email,omitempty"`
}

// Scan implements sql.Scanner for ShippingAddress
func (sa *ShippingAddress) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan ShippingAddress")
	}
	return json.Unmarshal(bytes, sa)
}

// Value implements driver.Valuer for ShippingAddress
func (sa ShippingAddress) Value() (driver.Value, error) {
	return json.Marshal(sa)
}

// BillingAddress stores billing address (JSONB)
type BillingAddress ShippingAddress

func (ba *BillingAddress) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan BillingAddress")
	}
	return json.Unmarshal(bytes, ba)
}

func (ba BillingAddress) Value() (driver.Value, error) {
	return json.Marshal(ba)
}

// JSONB type for PostgreSQL jsonb
type JSONB map[string]interface{}

func (j *JSONB) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan JSONB")
	}
	return json.Unmarshal(bytes, j)
}

func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// ============================================================================
// Order - Main Model (35 fields)
// ============================================================================

type Order struct {
	// ========== Identity & Relationships (5 fields) ==========
	ID             uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID       *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CustomerID     uuid.UUID  `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`
	SubscriptionID *uuid.UUID `gorm:"column:subscription_id;type:uuid;index" json:"subscription_id,omitempty"`
	PackageID      *uuid.UUID `gorm:"column:package_id;type:uuid" json:"package_id,omitempty"`

	// ========== Order Info (5 fields) ==========
	OrderNumber string      `gorm:"column:order_number;type:varchar(50);uniqueIndex;not null" json:"order_number"`
	Type        OrderType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status      OrderStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Source      *string     `gorm:"column:source;type:varchar(50)" json:"source,omitempty"` // web, mobile, api
	Notes       *string     `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// ========== Amounts (7 fields) ==========
	Subtotal       float64 `gorm:"column:subtotal;type:decimal(15,2);not null" json:"subtotal"`
	TaxAmount      float64 `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`
	ShippingAmount float64 `gorm:"column:shipping_amount;type:decimal(15,2);default:0" json:"shipping_amount"`
	DiscountAmount float64 `gorm:"column:discount_amount;type:decimal(15,2);default:0" json:"discount_amount"`
	TotalAmount    float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`
	PaidAmount     float64 `gorm:"column:paid_amount;type:decimal(15,2);default:0" json:"paid_amount"`
	Currency       string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// ========== Status Tracking (3 fields) ==========
	PaymentStatus     PaymentStatus     `gorm:"column:payment_status;type:varchar(20);not null;index" json:"payment_status"`
	FulfillmentStatus FulfillmentStatus `gorm:"column:fulfillment_status;type:varchar(30);not null" json:"fulfillment_status"`
	ShippingStatus    *string           `gorm:"column:shipping_status;type:varchar(20)" json:"shipping_status,omitempty"`

	// ========== Addresses (2 fields) ==========
	ShippingAddress *ShippingAddress `gorm:"column:shipping_address;type:jsonb" json:"shipping_address,omitempty"`
	BillingAddress  *BillingAddress  `gorm:"column:billing_address;type:jsonb" json:"billing_address,omitempty"`

	// ========== Payment Info (3 fields) ==========
	PaymentMethodID *uuid.UUID `gorm:"column:payment_method_id;type:uuid" json:"payment_method_id,omitempty"`
	TransactionID   *string    `gorm:"column:transaction_id;type:varchar(255)" json:"transaction_id,omitempty"`
	PaidAt          *time.Time `gorm:"column:paid_at" json:"paid_at,omitempty"`

	// ========== Discount & Coupon (2 fields) ==========
	CouponCode *string `gorm:"column:coupon_code;type:varchar(50)" json:"coupon_code,omitempty"`
	CouponID   *uuid.UUID `gorm:"column:coupon_id;type:uuid" json:"coupon_id,omitempty"`

	// ========== Fulfillment (2 fields) ==========
	FulfilledAt      *time.Time `gorm:"column:fulfilled_at" json:"fulfilled_at,omitempty"`
	EstimatedDelivery *time.Time `gorm:"column:estimated_delivery" json:"estimated_delivery,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit Fields (5 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
	CanceledAt *time.Time `gorm:"column:canceled_at" json:"canceled_at,omitempty"`

	// ========== Soft Delete & Versioning (3 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationships
	Items         []OrderItem         `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	StatusHistory []OrderStatusHistory `gorm:"foreignKey:OrderID" json:"status_history,omitempty"`
	Payments      []OrderPayment      `gorm:"foreignKey:OrderID" json:"payments,omitempty"`
}

// TableName specifies the table name for Order
func (Order) TableName() string {
	return "orders"
}

// ============================================================================
// GORM Hooks
// ============================================================================

func (o *Order) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}

	if o.OrderNumber == "" {
		o.OrderNumber = generateOrderNumber()
	}

	if err := o.Validate(); err != nil {
		return err
	}

	o.CalculateTotals()

	return nil
}

func (o *Order) BeforeUpdate(tx *gorm.DB) error {
	o.Version++
	return nil
}

// ============================================================================
// Validation
// ============================================================================

func (o *Order) Validate() error {
	if o.CustomerID == uuid.Nil {
		return errors.New("customer ID is required")
	}
	if o.Subtotal < 0 {
		return errors.New("subtotal cannot be negative")
	}
	if o.TotalAmount < 0 {
		return errors.New("total amount cannot be negative")
	}
	return nil
}

// ============================================================================
// Helper Methods
// ============================================================================

func (o *Order) CalculateTotals() {
	o.TotalAmount = o.Subtotal + o.TaxAmount + o.ShippingAmount - o.DiscountAmount
	if o.TotalAmount < 0 {
		o.TotalAmount = 0
	}
}

func (o *Order) IsPaid() bool {
	return o.PaymentStatus == PaymentStatusPaid
}

func (o *Order) IsFullyPaid() bool {
	return o.PaidAmount >= o.TotalAmount
}

func (o *Order) IsPartiallyPaid() bool {
	return o.PaidAmount > 0 && o.PaidAmount < o.TotalAmount
}

func (o *Order) IsCanceled() bool {
	return o.Status == OrderStatusCanceled
}

func (o *Order) CanCancel() bool {
	return o.Status == OrderStatusDraft ||
		o.Status == OrderStatusPending ||
		o.Status == OrderStatusConfirmed
}

func (o *Order) CanRefund() bool {
	return o.IsPaid() && (o.Status == OrderStatusCompleted || o.Status == OrderStatusDelivered)
}

func (o *Order) GetOutstandingAmount() float64 {
	outstanding := o.TotalAmount - o.PaidAmount
	if outstanding < 0 {
		return 0
	}
	return outstanding
}

func (o *Order) MarkAsPaid(transactionID string, paidAmount float64) {
	now := time.Now()
	o.PaidAmount += paidAmount
	o.TransactionID = &transactionID
	o.PaidAt = &now

	if o.IsFullyPaid() {
		o.PaymentStatus = PaymentStatusPaid
	} else if o.IsPartiallyPaid() {
		o.PaymentStatus = PaymentStatusPartiallyPaid
	}
}

func (o *Order) Cancel(reason string) error {
	if !o.CanCancel() {
		return fmt.Errorf("order in status %s cannot be canceled", o.Status)
	}

	now := time.Now()
	o.Status = OrderStatusCanceled
	o.CanceledAt = &now
	o.FulfillmentStatus = FulfillmentStatusCanceled

	if o.Notes == nil {
		o.Notes = &reason
	} else {
		note := fmt.Sprintf("%s\nCancellation: %s", *o.Notes, reason)
		o.Notes = &note
	}

	return nil
}

func (o *Order) Confirm() error {
	if o.Status != OrderStatusPending {
		return errors.New("only pending orders can be confirmed")
	}
	o.Status = OrderStatusConfirmed
	return nil
}

func (o *Order) StartProcessing() error {
	if o.Status != OrderStatusConfirmed {
		return errors.New("only confirmed orders can be processed")
	}
	o.Status = OrderStatusProcessing
	return nil
}

func (o *Order) MarkAsShipped() error {
	if o.Status != OrderStatusProcessing {
		return errors.New("only processing orders can be shipped")
	}
	o.Status = OrderStatusShipped
	return nil
}

func (o *Order) MarkAsDelivered() error {
	if o.Status != OrderStatusShipped {
		return errors.New("only shipped orders can be delivered")
	}
	now := time.Now()
	o.Status = OrderStatusDelivered
	o.FulfilledAt = &now
	o.FulfillmentStatus = FulfillmentStatusFulfilled
	return nil
}

func (o *Order) Complete() error {
	if o.Status != OrderStatusDelivered {
		return errors.New("only delivered orders can be completed")
	}
	o.Status = OrderStatusCompleted
	return nil
}

// ============================================================================
// ORDER ITEM - Order Line Items
// ============================================================================

type OrderItem struct {
	// Identity (4 fields)
	ID        uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID   uuid.UUID  `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`
	ProductID uuid.UUID  `gorm:"column:product_id;type:uuid;not null;index" json:"product_id"`
	VariantID *uuid.UUID `gorm:"column:variant_id;type:uuid" json:"variant_id,omitempty"`

	// Item Info (5 fields)
	SKU         *string `gorm:"column:sku;type:varchar(100)" json:"sku,omitempty"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	ImageURL    *string `gorm:"column:image_url;type:text" json:"image_url,omitempty"`
	Quantity    int     `gorm:"column:quantity;not null" json:"quantity"`

	// Pricing (4 fields)
	UnitPrice      float64 `gorm:"column:unit_price;type:decimal(15,2);not null" json:"unit_price"`
	Subtotal       float64 `gorm:"column:subtotal;type:decimal(15,2);not null" json:"subtotal"`
	TaxAmount      float64 `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`
	DiscountAmount float64 `gorm:"column:discount_amount;type:decimal(15,2);default:0" json:"discount_amount"`
	TotalAmount    float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`

	// Fulfillment (2 fields)
	FulfillmentStatus FulfillmentStatus `gorm:"column:fulfillment_status;type:varchar(30);default:'UNFULFILLED'" json:"fulfillment_status"`
	FulfilledQuantity int               `gorm:"column:fulfilled_quantity;default:0" json:"fulfilled_quantity"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Order   *Order          `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Product *Product        `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	Variant *ProductVariant `gorm:"foreignKey:VariantID" json:"variant,omitempty"`
}

func (OrderItem) TableName() string {
	return "order_items"
}

func (oi *OrderItem) CalculateTotal() {
	oi.Subtotal = float64(oi.Quantity) * oi.UnitPrice
	oi.TotalAmount = oi.Subtotal + oi.TaxAmount - oi.DiscountAmount
}

func (oi *OrderItem) IsFulfilled() bool {
	return oi.FulfilledQuantity >= oi.Quantity
}

func (oi *OrderItem) GetUnfulfilledQuantity() int {
	return oi.Quantity - oi.FulfilledQuantity
}

// ============================================================================
// ORDER STATUS HISTORY - Track status changes
// ============================================================================

type OrderStatusHistory struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID uuid.UUID `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`

	// Status Change (4 fields)
	FromStatus OrderStatus `gorm:"column:from_status;type:varchar(20)" json:"from_status"`
	ToStatus   OrderStatus `gorm:"column:to_status;type:varchar(20);not null" json:"to_status"`
	Reason     *string     `gorm:"column:reason;type:text" json:"reason,omitempty"`
	Notes      *string     `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Order *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}

func (OrderStatusHistory) TableName() string {
	return "order_status_history"
}

// ============================================================================
// ORDER PAYMENT - Payment Records
// ============================================================================

type PaymentMethod string

const (
	PaymentMethodCreditCard   PaymentMethod = "CREDIT_CARD"
	PaymentMethodDebitCard    PaymentMethod = "DEBIT_CARD"
	PaymentMethodPayPal       PaymentMethod = "PAYPAL"
	PaymentMethodStripe       PaymentMethod = "STRIPE"
	PaymentMethodBankTransfer PaymentMethod = "BANK_TRANSFER"
	PaymentMethodCOD          PaymentMethod = "COD" // Cash on delivery
	PaymentMethodWallet       PaymentMethod = "WALLET"
)

type OrderPayment struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID uuid.UUID `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`

	// Payment Info (6 fields)
	PaymentMethod PaymentMethod `gorm:"column:payment_method;type:varchar(50);not null" json:"payment_method"`
	Amount        float64       `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`
	Currency      string        `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`
	Status        PaymentStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	TransactionID *string       `gorm:"column:transaction_id;type:varchar(255)" json:"transaction_id,omitempty"`
	Provider      *string       `gorm:"column:provider;type:varchar(50)" json:"provider,omitempty"` // Stripe, PayPal, etc.

	// Response (2 fields)
	ProviderResponse JSONB   `gorm:"column:provider_response;type:jsonb" json:"provider_response,omitempty"`
	ErrorMessage     *string `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (3 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Order *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}

func (OrderPayment) TableName() string {
	return "order_payments"
}

func (op *OrderPayment) IsSuccessful() bool {
	return op.Status == PaymentStatusPaid || op.Status == PaymentStatusAuthorized
}

// ============================================================================
// ORDER NOTE - Internal Notes
// ============================================================================

type OrderNote struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID uuid.UUID `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`

	// Note (3 fields)
	Note       string `gorm:"column:note;type:text;not null" json:"note"`
	IsInternal bool   `gorm:"column:is_internal;default:true" json:"is_internal"` // Internal vs customer-facing
	Type       *string `gorm:"column:type;type:varchar(50)" json:"type,omitempty"` // info, warning, error

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Order *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}

func (OrderNote) TableName() string {
	return "order_notes"
}

// ============================================================================
// ORDER DISCOUNT - Applied Discounts
// ============================================================================

type DiscountType string

const (
	DiscountTypePercentage DiscountType = "PERCENTAGE"
	DiscountTypeFixed      DiscountType = "FIXED"
	DiscountTypeFreeShipping DiscountType = "FREE_SHIPPING"
)

type OrderDiscount struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID uuid.UUID `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`

	// Discount Info (5 fields)
	Code        string       `gorm:"column:code;type:varchar(50);not null" json:"code"`
	Type        DiscountType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Value       float64      `gorm:"column:value;type:decimal(15,2);not null" json:"value"` // % or fixed amount
	Amount      float64      `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"` // Calculated discount
	Description *string      `gorm:"column:description;type:text" json:"description,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	AppliedBy *uuid.UUID `gorm:"column:applied_by;type:uuid" json:"applied_by,omitempty"`

	// Relationship
	Order *Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}

func (OrderDiscount) TableName() string {
	return "order_discounts"
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateOrderNumber() string {
	// Format: ORD-YYYYMMDD-XXXXX
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("ORD-%s-%s", dateStr, randomStr)
}

// CreateOrder creates a new order with items
func CreateOrder(
	db *gorm.DB,
	customerID uuid.UUID,
	items []OrderItem,
	shippingAddress *ShippingAddress,
	billingAddress *BillingAddress,
	couponCode *string,
) (*Order, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Calculate totals
		var subtotal float64
		for i := range items {
			items[i].CalculateTotal()
			subtotal += items[i].TotalAmount
		}

		// Create order
		order := &Order{
			CustomerID:        customerID,
			Type:              OrderTypeProduct,
			Status:            OrderStatusPending,
			PaymentStatus:     PaymentStatusPending,
			FulfillmentStatus: FulfillmentStatusUnfulfilled,
			Subtotal:          subtotal,
			Currency:          "USD",
			ShippingAddress:   shippingAddress,
			BillingAddress:    billingAddress,
			CouponCode:        couponCode,
		}

		// Apply coupon if provided
		if couponCode != nil {
			// TODO: Implement coupon logic
		}

		order.CalculateTotals()

		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// Create order items
		for i := range items {
			items[i].OrderID = order.ID
		}
		if err := tx.Create(&items).Error; err != nil {
			return err
		}

		// Create status history
		history := &OrderStatusHistory{
			OrderID:    order.ID,
			ToStatus:   OrderStatusPending,
			Notes:      strPtr("Order created"),
		}
		if err := tx.Create(history).Error; err != nil {
			return err
		}

		order.Items = items
		return nil
	}), nil
}

// UpdateOrderStatus updates order status and creates history
func UpdateOrderStatus(
	db *gorm.DB,
	orderID uuid.UUID,
	newStatus OrderStatus,
	reason *string,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var order Order
		if err := tx.First(&order, orderID).Error; err != nil {
			return err
		}

		oldStatus := order.Status
		order.Status = newStatus
		order.UpdatedBy = userID

		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		// Create history
		history := &OrderStatusHistory{
			OrderID:    orderID,
			FromStatus: oldStatus,
			ToStatus:   newStatus,
			Reason:     reason,
			CreatedBy:  userID,
		}

		return tx.Create(history).Error
	})
}

// ProcessPayment processes a payment for an order
func ProcessPayment(
	db *gorm.DB,
	orderID uuid.UUID,
	paymentMethod PaymentMethod,
	amount float64,
	transactionID *string,
	provider *string,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var order Order
		if err := tx.First(&order, orderID).Error; err != nil {
			return err
		}

		// Create payment record
		payment := &OrderPayment{
			OrderID:       orderID,
			PaymentMethod: paymentMethod,
			Amount:        amount,
			Currency:      order.Currency,
			Status:        PaymentStatusPaid,
			TransactionID: transactionID,
			Provider:      provider,
		}

		if err := tx.Create(payment).Error; err != nil {
			return err
		}

		// Update order
		if transactionID != nil {
			order.MarkAsPaid(*transactionID, amount)
		} else {
			order.MarkAsPaid("", amount)
		}

		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		// Update status if fully paid
		if order.IsFullyPaid() && order.Status == OrderStatusPending {
			return UpdateOrderStatus(tx, orderID, OrderStatusConfirmed, strPtr("Payment received"), nil)
		}

		return nil
	})
}

func strPtr(s string) *string {
	return &s
}
