package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// ORDER RETURN - Return Requests
// ============================================================================
// Purpose: Handle product returns and exchanges
// Table: order_returns
// Primary Key: _id (UUID)
// Features: Return authorization, Refund processing, Exchange handling
// ============================================================================

// ReturnStatus represents the return request status
type ReturnStatus string

const (
	ReturnStatusRequested    ReturnStatus = "REQUESTED"
	ReturnStatusApproved     ReturnStatus = "APPROVED"
	ReturnStatusRejected     ReturnStatus = "REJECTED"
	ReturnStatusShipped      ReturnStatus = "SHIPPED"       // Customer shipped back
	ReturnStatusReceived     ReturnStatus = "RECEIVED"      // Received at warehouse
	ReturnStatusInspecting   ReturnStatus = "INSPECTING"    // Being inspected
	ReturnStatusCompleted    ReturnStatus = "COMPLETED"
	ReturnStatusCanceled     ReturnStatus = "CANCELED"
)

// ReturnReason represents why the return is requested
type ReturnReason string

const (
	ReturnReasonDefective      ReturnReason = "DEFECTIVE"
	ReturnReasonWrongItem      ReturnReason = "WRONG_ITEM"
	ReturnReasonNotAsDescribed ReturnReason = "NOT_AS_DESCRIBED"
	ReturnReasonChangedMind    ReturnReason = "CHANGED_MIND"
	ReturnReasonSizeIssue      ReturnReason = "SIZE_ISSUE"
	ReturnReasonDamaged        ReturnReason = "DAMAGED"
	ReturnReasonOther          ReturnReason = "OTHER"
)

// ReturnType represents the type of return
type ReturnType string

const (
	ReturnTypeRefund   ReturnType = "REFUND"
	ReturnTypeExchange ReturnType = "EXCHANGE"
	ReturnTypeCredit   ReturnType = "CREDIT" // Store credit
)

type OrderReturn struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID uuid.UUID `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`

	// Return Info (6 fields)
	ReturnNumber string       `gorm:"column:return_number;type:varchar(50);uniqueIndex;not null" json:"return_number"`
	Type         ReturnType   `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Status       ReturnStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Reason       ReturnReason `gorm:"column:reason;type:varchar(30);not null" json:"reason"`
	Description  *string      `gorm:"column:description;type:text" json:"description,omitempty"`
	Images       JSONB        `gorm:"column:images;type:jsonb" json:"images,omitempty"` // URLs to return images

	// Amounts (4 fields)
	ItemsTotal      float64 `gorm:"column:items_total;type:decimal(15,2);not null" json:"items_total"`
	ShippingRefund  float64 `gorm:"column:shipping_refund;type:decimal(15,2);default:0" json:"shipping_refund"`
	RestockingFee   float64 `gorm:"column:restocking_fee;type:decimal(15,2);default:0" json:"restocking_fee"`
	RefundAmount    float64 `gorm:"column:refund_amount;type:decimal(15,2);not null" json:"refund_amount"`
	Currency        string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Approval (4 fields)
	ApprovedAt     *time.Time `gorm:"column:approved_at" json:"approved_at,omitempty"`
	ApprovedBy     *uuid.UUID `gorm:"column:approved_by;type:uuid" json:"approved_by,omitempty"`
	RejectedAt     *time.Time `gorm:"column:rejected_at" json:"rejected_at,omitempty"`
	RejectionReason *string   `gorm:"column:rejection_reason;type:text" json:"rejection_reason,omitempty"`

	// Return Shipping (4 fields)
	ReturnTrackingNumber *string    `gorm:"column:return_tracking_number;type:varchar(100)" json:"return_tracking_number,omitempty"`
	ReturnCarrier        *string    `gorm:"column:return_carrier;type:varchar(50)" json:"return_carrier,omitempty"`
	ReturnShippedAt      *time.Time `gorm:"column:return_shipped_at" json:"return_shipped_at,omitempty"`
	ReturnReceivedAt     *time.Time `gorm:"column:return_received_at" json:"return_received_at,omitempty"`

	// Inspection (3 fields)
	InspectedAt     *time.Time `gorm:"column:inspected_at" json:"inspected_at,omitempty"`
	InspectedBy     *uuid.UUID `gorm:"column:inspected_by;type:uuid" json:"inspected_by,omitempty"`
	InspectionNotes *string    `gorm:"column:inspection_notes;type:text" json:"inspection_notes,omitempty"`

	// Completion (2 fields)
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	CompletedBy *uuid.UUID `gorm:"column:completed_by;type:uuid" json:"completed_by,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Order       *Order           `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	ReturnItems []OrderReturnItem `gorm:"foreignKey:ReturnID" json:"items,omitempty"`
	Refunds     []OrderRefund     `gorm:"foreignKey:ReturnID" json:"refunds,omitempty"`
}

func (OrderReturn) TableName() string {
	return "order_returns"
}

// Helper Methods
func (or *OrderReturn) CanApprove() bool {
	return or.Status == ReturnStatusRequested
}

func (or *OrderReturn) Approve(userID uuid.UUID) error {
	if !or.CanApprove() {
		return errors.New("return cannot be approved in current status")
	}
	now := time.Now()
	or.Status = ReturnStatusApproved
	or.ApprovedAt = &now
	or.ApprovedBy = &userID
	return nil
}

func (or *OrderReturn) Reject(reason string, userID uuid.UUID) error {
	if !or.CanApprove() {
		return errors.New("return cannot be rejected in current status")
	}
	now := time.Now()
	or.Status = ReturnStatusRejected
	or.RejectedAt = &now
	or.RejectionReason = &reason
	or.UpdatedBy = &userID
	return nil
}

func (or *OrderReturn) MarkAsReceived(userID uuid.UUID) {
	now := time.Now()
	or.Status = ReturnStatusReceived
	or.ReturnReceivedAt = &now
	or.UpdatedBy = &userID
}

func (or *OrderReturn) StartInspection(userID uuid.UUID) {
	or.Status = ReturnStatusInspecting
	or.UpdatedBy = &userID
}

func (or *OrderReturn) CompleteInspection(notes string, userID uuid.UUID) {
	now := time.Now()
	or.InspectedAt = &now
	or.InspectedBy = &userID
	or.InspectionNotes = &notes
}

func (or *OrderReturn) Complete(userID uuid.UUID) {
	now := time.Now()
	or.Status = ReturnStatusCompleted
	or.CompletedAt = &now
	or.CompletedBy = &userID
}

// ============================================================================
// ORDER RETURN ITEM - Items being returned
// ============================================================================

type OrderReturnItem struct {
	// Identity (3 fields)
	ID          uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ReturnID    uuid.UUID `gorm:"column:return_id;type:uuid;not null;index" json:"return_id"`
	OrderItemID uuid.UUID `gorm:"column:order_item_id;type:uuid;not null;index" json:"order_item_id"`

	// Item Info (4 fields)
	Quantity       int     `gorm:"column:quantity;not null" json:"quantity"`
	UnitPrice      float64 `gorm:"column:unit_price;type:decimal(15,2);not null" json:"unit_price"`
	RefundAmount   float64 `gorm:"column:refund_amount;type:decimal(15,2);not null" json:"refund_amount"`
	RestockingFee  float64 `gorm:"column:restocking_fee;type:decimal(15,2);default:0" json:"restocking_fee"`

	// Condition (2 fields)
	Condition      *string `gorm:"column:condition;type:varchar(50)" json:"condition,omitempty"` // new, used, damaged
	ConditionNotes *string `gorm:"column:condition_notes;type:text" json:"condition_notes,omitempty"`

	// Restocking (2 fields)
	IsRestocked   bool       `gorm:"column:is_restocked;default:false" json:"is_restocked"`
	RestockedAt   *time.Time `gorm:"column:restocked_at" json:"restocked_at,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Return    *OrderReturn `gorm:"foreignKey:ReturnID" json:"return,omitempty"`
	OrderItem *OrderItem   `gorm:"foreignKey:OrderItemID" json:"order_item,omitempty"`
}

func (OrderReturnItem) TableName() string {
	return "order_return_items"
}

// ============================================================================
// ORDER REFUND - Refund Transactions
// ============================================================================

type RefundStatus string

const (
	RefundStatusPending   RefundStatus = "PENDING"
	RefundStatusProcessing RefundStatus = "PROCESSING"
	RefundStatusCompleted RefundStatus = "COMPLETED"
	RefundStatusFailed    RefundStatus = "FAILED"
	RefundStatusCanceled  RefundStatus = "CANCELED"
)

type RefundMethod string

const (
	RefundMethodOriginal   RefundMethod = "ORIGINAL"    // Refund to original payment method
	RefundMethodStoreCredit RefundMethod = "STORE_CREDIT"
	RefundMethodBankTransfer RefundMethod = "BANK_TRANSFER"
	RefundMethodCheck      RefundMethod = "CHECK"
)

type OrderRefund struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID  uuid.UUID  `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`
	ReturnID *uuid.UUID `gorm:"column:return_id;type:uuid;index" json:"return_id,omitempty"`

	// Refund Info (6 fields)
	RefundNumber string       `gorm:"column:refund_number;type:varchar(50);uniqueIndex;not null" json:"refund_number"`
	Amount       float64      `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`
	Currency     string       `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`
	Method       RefundMethod `gorm:"column:method;type:varchar(20);not null" json:"method"`
	Status       RefundStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Reason       *string      `gorm:"column:reason;type:text" json:"reason,omitempty"`

	// Payment Info (3 fields)
	OriginalPaymentID *uuid.UUID `gorm:"column:original_payment_id;type:uuid" json:"original_payment_id,omitempty"`
	TransactionID     *string    `gorm:"column:transaction_id;type:varchar(255)" json:"transaction_id,omitempty"`
	Provider          *string    `gorm:"column:provider;type:varchar(50)" json:"provider,omitempty"` // Stripe, PayPal

	// Response (2 fields)
	ProviderResponse JSONB   `gorm:"column:provider_response;type:jsonb" json:"provider_response,omitempty"`
	ErrorMessage     *string `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Processing (3 fields)
	ProcessedAt *time.Time `gorm:"column:processed_at" json:"processed_at,omitempty"`
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	FailedAt    *time.Time `gorm:"column:failed_at" json:"failed_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Order  *Order       `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Return *OrderReturn `gorm:"foreignKey:ReturnID" json:"return,omitempty"`
}

func (OrderRefund) TableName() string {
	return "order_refunds"
}

func (rf *OrderRefund) IsCompleted() bool {
	return rf.Status == RefundStatusCompleted
}

func (rf *OrderRefund) MarkAsProcessing(userID *uuid.UUID) {
	rf.Status = RefundStatusProcessing
	now := time.Now()
	rf.ProcessedAt = &now
	rf.UpdatedBy = userID
}

func (rf *OrderRefund) MarkAsCompleted(transactionID string, userID *uuid.UUID) {
	rf.Status = RefundStatusCompleted
	now := time.Now()
	rf.CompletedAt = &now
	rf.TransactionID = &transactionID
	rf.UpdatedBy = userID
}

func (rf *OrderRefund) MarkAsFailed(errorMessage string, userID *uuid.UUID) {
	rf.Status = RefundStatusFailed
	now := time.Now()
	rf.FailedAt = &now
	rf.ErrorMessage = &errorMessage
	rf.UpdatedBy = userID
}

// ============================================================================
// EXCHANGE REQUEST - Product Exchanges
// ============================================================================

type ExchangeStatus string

const (
	ExchangeStatusRequested  ExchangeStatus = "REQUESTED"
	ExchangeStatusApproved   ExchangeStatus = "APPROVED"
	ExchangeStatusRejected   ExchangeStatus = "REJECTED"
	ExchangeStatusProcessing ExchangeStatus = "PROCESSING"
	ExchangeStatusShipped    ExchangeStatus = "SHIPPED"
	ExchangeStatusCompleted  ExchangeStatus = "COMPLETED"
	ExchangeStatusCanceled   ExchangeStatus = "CANCELED"
)

type ExchangeRequest struct {
	// Identity (3 fields)
	ID          uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OrderID     uuid.UUID `gorm:"column:order_id;type:uuid;not null;index" json:"order_id"`
	ReturnID    uuid.UUID `gorm:"column:return_id;type:uuid;not null;index" json:"return_id"`

	// Exchange Info (4 fields)
	ExchangeNumber string         `gorm:"column:exchange_number;type:varchar(50);uniqueIndex;not null" json:"exchange_number"`
	Status         ExchangeStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Reason         *string        `gorm:"column:reason;type:text" json:"reason,omitempty"`
	Notes          *string        `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// New Order (2 fields)
	NewOrderID     *uuid.UUID `gorm:"column:new_order_id;type:uuid" json:"new_order_id,omitempty"` // Order created for exchange
	PriceDifference float64   `gorm:"column:price_difference;type:decimal(15,2);default:0" json:"price_difference"` // Positive if customer owes, negative if refund

	// Approval (3 fields)
	ApprovedAt *time.Time `gorm:"column:approved_at" json:"approved_at,omitempty"`
	ApprovedBy *uuid.UUID `gorm:"column:approved_by;type:uuid" json:"approved_by,omitempty"`
	RejectedAt *time.Time `gorm:"column:rejected_at" json:"rejected_at,omitempty"`

	// Completion (2 fields)
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	CompletedBy *uuid.UUID `gorm:"column:completed_by;type:uuid" json:"completed_by,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Order      *Order           `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Return     *OrderReturn     `gorm:"foreignKey:ReturnID" json:"return,omitempty"`
	NewOrder   *Order           `gorm:"foreignKey:NewOrderID" json:"new_order,omitempty"`
	ExchangeItems []ExchangeItem `gorm:"foreignKey:ExchangeID" json:"items,omitempty"`
}

func (ExchangeRequest) TableName() string {
	return "exchange_requests"
}

func (er *ExchangeRequest) Approve(userID uuid.UUID) error {
	if er.Status != ExchangeStatusRequested {
		return errors.New("exchange can only be approved when requested")
	}
	now := time.Now()
	er.Status = ExchangeStatusApproved
	er.ApprovedAt = &now
	er.ApprovedBy = &userID
	return nil
}

func (er *ExchangeRequest) Complete(userID uuid.UUID) {
	now := time.Now()
	er.Status = ExchangeStatusCompleted
	er.CompletedAt = &now
	er.CompletedBy = &userID
}

// ============================================================================
// EXCHANGE ITEM - Items in exchange
// ============================================================================

type ExchangeItem struct {
	// Identity (3 fields)
	ID            uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ExchangeID    uuid.UUID `gorm:"column:exchange_id;type:uuid;not null;index" json:"exchange_id"`
	OrderItemID   uuid.UUID `gorm:"column:order_item_id;type:uuid;not null;index" json:"order_item_id"`

	// Old Item (3 fields)
	OldProductID  uuid.UUID  `gorm:"column:old_product_id;type:uuid;not null" json:"old_product_id"`
	OldVariantID  *uuid.UUID `gorm:"column:old_variant_id;type:uuid" json:"old_variant_id,omitempty"`
	OldQuantity   int        `gorm:"column:old_quantity;not null" json:"old_quantity"`

	// New Item (3 fields)
	NewProductID  uuid.UUID  `gorm:"column:new_product_id;type:uuid;not null" json:"new_product_id"`
	NewVariantID  *uuid.UUID `gorm:"column:new_variant_id;type:uuid" json:"new_variant_id,omitempty"`
	NewQuantity   int        `gorm:"column:new_quantity;not null" json:"new_quantity"`

	// Pricing (2 fields)
	OldPrice float64 `gorm:"column:old_price;type:decimal(15,2);not null" json:"old_price"`
	NewPrice float64 `gorm:"column:new_price;type:decimal(15,2);not null" json:"new_price"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Exchange *ExchangeRequest `gorm:"foreignKey:ExchangeID" json:"exchange,omitempty"`
}

func (ExchangeItem) TableName() string {
	return "exchange_items"
}

func (ei *ExchangeItem) GetPriceDifference() float64 {
	return (ei.NewPrice * float64(ei.NewQuantity)) - (ei.OldPrice * float64(ei.OldQuantity))
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateReturnNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("RET-%s-%s", dateStr, randomStr)
}

func generateRefundNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("REF-%s-%s", dateStr, randomStr)
}

func generateExchangeNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("EXC-%s-%s", dateStr, randomStr)
}

// CreateReturn creates a return request
func CreateReturn(
	db *gorm.DB,
	orderID uuid.UUID,
	returnType ReturnType,
	reason ReturnReason,
	description *string,
	items []OrderReturnItem,
	customerID uuid.UUID,
) (*OrderReturn, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get order
		var order Order
		if err := tx.First(&order, orderID).Error; err != nil {
			return err
		}

		// Check if order can be returned
		if !order.CanRefund() {
			return errors.New("order cannot be returned")
		}

		// Calculate totals
		var itemsTotal float64
		for _, item := range items {
			itemsTotal += item.RefundAmount
		}

		// Create return
		orderReturn := &OrderReturn{
			OrderID:      orderID,
			ReturnNumber: generateReturnNumber(),
			Type:         returnType,
			Status:       ReturnStatusRequested,
			Reason:       reason,
			Description:  description,
			ItemsTotal:   itemsTotal,
			RefundAmount: itemsTotal, // Before fees
			Currency:     order.Currency,
			CreatedBy:    &customerID,
		}

		if err := tx.Create(orderReturn).Error; err != nil {
			return err
		}

		// Create return items
		for i := range items {
			items[i].ReturnID = orderReturn.ID
		}
		if err := tx.Create(&items).Error; err != nil {
			return err
		}

		orderReturn.ReturnItems = items
		return nil
	}), nil
}

// ProcessRefund processes a refund for a return
func ProcessRefund(
	db *gorm.DB,
	returnID uuid.UUID,
	method RefundMethod,
	userID *uuid.UUID,
) (*OrderRefund, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get return
		var orderReturn OrderReturn
		if err := tx.Preload("Order").First(&orderReturn, returnID).Error; err != nil {
			return err
		}

		if orderReturn.Status != ReturnStatusCompleted {
			return errors.New("return must be completed before refund")
		}

		// Create refund
		refund := &OrderRefund{
			OrderID:      orderReturn.OrderID,
			ReturnID:     &returnID,
			RefundNumber: generateRefundNumber(),
			Amount:       orderReturn.RefundAmount,
			Currency:     orderReturn.Currency,
			Method:       method,
			Status:       RefundStatusPending,
			CreatedBy:    userID,
		}

		if err := tx.Create(refund).Error; err != nil {
			return err
		}

		// TODO: Process payment refund via payment provider

		// Update order
		var order Order
		if err := tx.First(&order, orderReturn.OrderID).Error; err != nil {
			return err
		}

		order.Status = OrderStatusRefunded
		if err := tx.Save(&order).Error; err != nil {
			return err
		}

		return nil
	}), nil
}

// CreateExchange creates an exchange request
func CreateExchange(
	db *gorm.DB,
	returnID uuid.UUID,
	exchangeItems []ExchangeItem,
	userID *uuid.UUID,
) (*ExchangeRequest, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get return
		var orderReturn OrderReturn
		if err := tx.First(&orderReturn, returnID).Error; err != nil {
			return err
		}

		if orderReturn.Type != ReturnTypeExchange {
			return errors.New("return must be of type EXCHANGE")
		}

		// Calculate price difference
		var priceDiff float64
		for _, item := range exchangeItems {
			priceDiff += item.GetPriceDifference()
		}

		// Create exchange
		exchange := &ExchangeRequest{
			OrderID:         orderReturn.OrderID,
			ReturnID:        returnID,
			ExchangeNumber:  generateExchangeNumber(),
			Status:          ExchangeStatusRequested,
			PriceDifference: priceDiff,
			CreatedBy:       userID,
		}

		if err := tx.Create(exchange).Error; err != nil {
			return err
		}

		// Create exchange items
		for i := range exchangeItems {
			exchangeItems[i].ExchangeID = exchange.ID
		}
		if err := tx.Create(&exchangeItems).Error; err != nil {
			return err
		}

		exchange.ExchangeItems = exchangeItems
		return nil
	}), nil
}

// ApproveReturn approves a return request
func ApproveReturn(
	db *gorm.DB,
	returnID uuid.UUID,
	userID uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var orderReturn OrderReturn
		if err := tx.First(&orderReturn, returnID).Error; err != nil {
			return err
		}

		if err := orderReturn.Approve(userID); err != nil {
			return err
		}

		return tx.Save(&orderReturn).Error
	})
}

// RestockReturnedItems restocks items from a return
func RestockReturnedItems(
	db *gorm.DB,
	returnID uuid.UUID,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var returnItems []OrderReturnItem
		if err := tx.Where("return_id = ?", returnID).
			Preload("OrderItem").
			Find(&returnItems).Error; err != nil {
			return err
		}

		for _, item := range returnItems {
			if item.IsRestocked {
				continue
			}

			// Get product inventory
			var inventory ProductInventory
			err := tx.Where("product_id = ? AND variant_id = ?",
				item.OrderItem.ProductID, item.OrderItem.VariantID).
				First(&inventory).Error

			if err != nil && err != gorm.ErrRecordNotFound {
				return err
			}

			// Restock
			if err == nil {
				if err := inventory.Restock(int64(item.Quantity)); err != nil {
					return err
				}
				if err := tx.Save(&inventory).Error; err != nil {
					return err
				}
			}

			// Mark as restocked
			now := time.Now()
			item.IsRestocked = true
			item.RestockedAt = &now
			if err := tx.Save(&item).Error; err != nil {
				return err
			}
		}

		return nil
	})
}
