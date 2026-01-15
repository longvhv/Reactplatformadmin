package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// INVOICE PAYMENT - Payment Records
// ============================================================================
// Purpose: Track payments received for invoices
// Table: invoice_payments
// Primary Key: _id (UUID)
// Features: Multi-payment methods, Partial payments, Refunds
// ============================================================================

type PaymentMethod string

const (
	PaymentMethodCreditCard   PaymentMethod = "CREDIT_CARD"
	PaymentMethodDebitCard    PaymentMethod = "DEBIT_CARD"
	PaymentMethodBankTransfer PaymentMethod = "BANK_TRANSFER"
	PaymentMethodCash         PaymentMethod = "CASH"
	PaymentMethodCheck        PaymentMethod = "CHECK"
	PaymentMethodPayPal       PaymentMethod = "PAYPAL"
	PaymentMethodStripe       PaymentMethod = "STRIPE"
	PaymentMethodWire         PaymentMethod = "WIRE"
	PaymentMethodACH          PaymentMethod = "ACH"
	PaymentMethodOther        PaymentMethod = "OTHER"
)

type PaymentStatus string

const (
	PaymentStatusPending    PaymentStatus = "PENDING"
	PaymentStatusProcessing PaymentStatus = "PROCESSING"
	PaymentStatusCompleted  PaymentStatus = "COMPLETED"
	PaymentStatusFailed     PaymentStatus = "FAILED"
	PaymentStatusRefunded   PaymentStatus = "REFUNDED"
	PaymentStatusCanceled   PaymentStatus = "CANCELED"
)

type InvoicePayment struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	InvoiceID uuid.UUID `gorm:"column:invoice_id;type:uuid;not null;index" json:"invoice_id"`

	// Payment Info (7 fields)
	PaymentNumber string        `gorm:"column:payment_number;type:varchar(50);uniqueIndex;not null" json:"payment_number"`
	PaymentMethod PaymentMethod `gorm:"column:payment_method;type:varchar(50);not null" json:"payment_method"`
	Amount        float64       `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`
	Currency      string        `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`
	Status        PaymentStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	PaymentDate   time.Time     `gorm:"column:payment_date;not null" json:"payment_date"`
	Reference     *string       `gorm:"column:reference;type:varchar(255)" json:"reference,omitempty"` // Check number, transaction ID

	// Payment Provider (3 fields)
	Provider         *string `gorm:"column:provider;type:varchar(50)" json:"provider,omitempty"` // Stripe, PayPal, etc.
	TransactionID    *string `gorm:"column:transaction_id;type:varchar(255)" json:"transaction_id,omitempty"`
	ProviderResponse JSONB   `gorm:"column:provider_response;type:jsonb" json:"provider_response,omitempty"`

	// Bank Details (for transfers/checks) (3 fields)
	BankName      *string `gorm:"column:bank_name;type:varchar(100)" json:"bank_name,omitempty"`
	AccountNumber *string `gorm:"column:account_number;type:varchar(50)" json:"account_number,omitempty"`
	CheckNumber   *string `gorm:"column:check_number;type:varchar(50)" json:"check_number,omitempty"`

	// Processing (3 fields)
	ProcessedAt *time.Time `gorm:"column:processed_at" json:"processed_at,omitempty"`
	FailedAt    *time.Time `gorm:"column:failed_at" json:"failed_at,omitempty"`
	ErrorMessage *string   `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Notes (1 field)
	Notes *string `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Receipt (2 fields)
	ReceiptURL       *string `gorm:"column:receipt_url;type:text" json:"receipt_url,omitempty"`
	ReceiptGenerated bool    `gorm:"column:receipt_generated;default:false" json:"receipt_generated"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Invoice *Invoice        `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
	Receipt *PaymentReceipt `gorm:"foreignKey:PaymentID" json:"receipt,omitempty"`
}

func (InvoicePayment) TableName() string {
	return "invoice_payments"
}

// Helper Methods
func (ip *InvoicePayment) IsCompleted() bool {
	return ip.Status == PaymentStatusCompleted
}

func (ip *InvoicePayment) IsPending() bool {
	return ip.Status == PaymentStatusPending
}

func (ip *InvoicePayment) MarkAsCompleted(transactionID *string, userID *uuid.UUID) {
	now := time.Now()
	ip.Status = PaymentStatusCompleted
	ip.ProcessedAt = &now
	ip.TransactionID = transactionID
	ip.UpdatedBy = userID
}

func (ip *InvoicePayment) MarkAsFailed(errorMessage string, userID *uuid.UUID) {
	now := time.Now()
	ip.Status = PaymentStatusFailed
	ip.FailedAt = &now
	ip.ErrorMessage = &errorMessage
	ip.UpdatedBy = userID
}

// ============================================================================
// PAYMENT RECEIPT - Payment Receipts
// ============================================================================

type PaymentReceipt struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PaymentID uuid.UUID `gorm:"column:payment_id;type:uuid;not null;uniqueIndex" json:"payment_id"`

	// Receipt Info (4 fields)
	ReceiptNumber string    `gorm:"column:receipt_number;type:varchar(50);uniqueIndex;not null" json:"receipt_number"`
	ReceiptDate   time.Time `gorm:"column:receipt_date;not null" json:"receipt_date"`
	Amount        float64   `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`
	Currency      string    `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Document (3 fields)
	PDFURL       *string `gorm:"column:pdf_url;type:text" json:"pdf_url,omitempty"`
	PDFGenerated bool    `gorm:"column:pdf_generated;default:false" json:"pdf_generated"`
	PublicURL    *string `gorm:"column:public_url;type:text" json:"public_url,omitempty"`

	// Email (2 fields)
	EmailSent bool       `gorm:"column:email_sent;default:false" json:"email_sent"`
	SentAt    *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Payment *InvoicePayment `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
}

func (PaymentReceipt) TableName() string {
	return "payment_receipts"
}

// ============================================================================
// PAYMENT ALLOCATION - Allocate payments to multiple invoices
// ============================================================================

type PaymentAllocation struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	PaymentID uuid.UUID `gorm:"column:payment_id;type:uuid;not null;index" json:"payment_id"`

	// Allocation (2 fields)
	InvoiceID uuid.UUID `gorm:"column:invoice_id;type:uuid;not null;index" json:"invoice_id"`
	Amount    float64   `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationships
	Payment *InvoicePayment `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
	Invoice *Invoice        `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
}

func (PaymentAllocation) TableName() string {
	return "payment_allocations"
}

// ============================================================================
// PAYMENT REFUND - Refunds
// ============================================================================

type RefundReason string

const (
	RefundReasonOverpayment   RefundReason = "OVERPAYMENT"
	RefundReasonCancellation  RefundReason = "CANCELLATION"
	RefundReasonError         RefundReason = "ERROR"
	RefundReasonCustomerRequest RefundReason = "CUSTOMER_REQUEST"
	RefundReasonOther         RefundReason = "OTHER"
)

type PaymentRefund struct {
	// Identity (2 fields)
	ID              uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	OriginalPaymentID uuid.UUID `gorm:"column:original_payment_id;type:uuid;not null;index" json:"original_payment_id"`

	// Refund Info (6 fields)
	RefundNumber string       `gorm:"column:refund_number;type:varchar(50);uniqueIndex;not null" json:"refund_number"`
	Amount       float64      `gorm:"column:amount;type:decimal(15,2);not null" json:"amount"`
	Currency     string       `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`
	Reason       RefundReason `gorm:"column:reason;type:varchar(30);not null" json:"reason"`
	Status       PaymentStatus `gorm:"column:status;type:varchar(20);not null" json:"status"`
	RefundDate   time.Time    `gorm:"column:refund_date;not null" json:"refund_date"`

	// Provider Info (3 fields)
	Provider      *string `gorm:"column:provider;type:varchar(50)" json:"provider,omitempty"`
	TransactionID *string `gorm:"column:transaction_id;type:varchar(255)" json:"transaction_id,omitempty"`
	ProviderResponse JSONB `gorm:"column:provider_response;type:jsonb" json:"provider_response,omitempty"`

	// Processing (2 fields)
	ProcessedAt  *time.Time `gorm:"column:processed_at" json:"processed_at,omitempty"`
	ErrorMessage *string    `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Notes (1 field)
	Notes *string `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationship
	OriginalPayment *InvoicePayment `gorm:"foreignKey:OriginalPaymentID" json:"original_payment,omitempty"`
}

func (PaymentRefund) TableName() string {
	return "payment_refunds"
}

// ============================================================================
// Helper Functions
// ============================================================================

func generatePaymentNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("PAY-%s-%s", dateStr, randomStr)
}

func generateReceiptNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("RCP-%s-%s", dateStr, randomStr)
}

func generateRefundNumber() string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	return fmt.Sprintf("RFD-%s-%s", dateStr, randomStr)
}

// RecordPayment records a payment for an invoice
func RecordPayment(
	db *gorm.DB,
	invoiceID uuid.UUID,
	amount float64,
	paymentMethod PaymentMethod,
	paymentDate time.Time,
	reference *string,
	userID *uuid.UUID,
) (*InvoicePayment, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get invoice
		var invoice Invoice
		if err := tx.First(&invoice, invoiceID).Error; err != nil {
			return err
		}

		// Check amount
		outstanding := invoice.GetOutstandingAmount()
		if amount > outstanding {
			return fmt.Errorf("payment amount ($%.2f) exceeds outstanding amount ($%.2f)", amount, outstanding)
		}

		// Create payment
		payment := &InvoicePayment{
			InvoiceID:     invoiceID,
			PaymentNumber: generatePaymentNumber(),
			PaymentMethod: paymentMethod,
			Amount:        amount,
			Currency:      invoice.Currency,
			Status:        PaymentStatusCompleted,
			PaymentDate:   paymentDate,
			Reference:     reference,
			CreatedBy:     userID,
		}

		now := time.Now()
		payment.ProcessedAt = &now

		if err := tx.Create(payment).Error; err != nil {
			return err
		}

		// Update invoice
		invoice.MarkAsPaid(amount, &paymentDate)
		invoice.UpdateStatus()

		if err := tx.Save(&invoice).Error; err != nil {
			return err
		}

		// Create receipt
		receipt := &PaymentReceipt{
			PaymentID:     payment.ID,
			ReceiptNumber: generateReceiptNumber(),
			ReceiptDate:   paymentDate,
			Amount:        amount,
			Currency:      invoice.Currency,
			CreatedBy:     userID,
		}

		if err := tx.Create(receipt).Error; err != nil {
			return err
		}

		payment.Receipt = receipt
		return nil
	}), nil
}

// RecordMultiInvoicePayment records a payment for multiple invoices
func RecordMultiInvoicePayment(
	db *gorm.DB,
	allocations []PaymentAllocation,
	paymentMethod PaymentMethod,
	paymentDate time.Time,
	reference *string,
	userID *uuid.UUID,
) (*InvoicePayment, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Calculate total amount
		var totalAmount float64
		var currency string

		for _, allocation := range allocations {
			var invoice Invoice
			if err := tx.First(&invoice, allocation.InvoiceID).Error; err != nil {
				return err
			}

			if currency == "" {
				currency = invoice.Currency
			} else if currency != invoice.Currency {
				return errors.New("all invoices must have the same currency")
			}

			outstanding := invoice.GetOutstandingAmount()
			if allocation.Amount > outstanding {
				return fmt.Errorf("allocation for invoice %s exceeds outstanding amount", invoice.InvoiceNumber)
			}

			totalAmount += allocation.Amount
		}

		// Create payment
		payment := &InvoicePayment{
			InvoiceID:     allocations[0].InvoiceID, // Primary invoice
			PaymentNumber: generatePaymentNumber(),
			PaymentMethod: paymentMethod,
			Amount:        totalAmount,
			Currency:      currency,
			Status:        PaymentStatusCompleted,
			PaymentDate:   paymentDate,
			Reference:     reference,
			CreatedBy:     userID,
		}

		now := time.Now()
		payment.ProcessedAt = &now

		if err := tx.Create(payment).Error; err != nil {
			return err
		}

		// Create allocations and update invoices
		for i := range allocations {
			allocations[i].PaymentID = payment.ID
			allocations[i].CreatedBy = userID

			if err := tx.Create(&allocations[i]).Error; err != nil {
				return err
			}

			// Update invoice
			var invoice Invoice
			if err := tx.First(&invoice, allocations[i].InvoiceID).Error; err != nil {
				return err
			}

			invoice.MarkAsPaid(allocations[i].Amount, &paymentDate)
			invoice.UpdateStatus()

			if err := tx.Save(&invoice).Error; err != nil {
				return err
			}
		}

		return nil
	}), nil
}

// RefundPayment creates a refund for a payment
func RefundPayment(
	db *gorm.DB,
	paymentID uuid.UUID,
	amount float64,
	reason RefundReason,
	notes *string,
	userID *uuid.UUID,
) (*PaymentRefund, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get payment
		var payment InvoicePayment
		if err := tx.Preload("Invoice").First(&payment, paymentID).Error; err != nil {
			return err
		}

		if !payment.IsCompleted() {
			return errors.New("can only refund completed payments")
		}

		if amount > payment.Amount {
			return fmt.Errorf("refund amount ($%.2f) exceeds payment amount ($%.2f)", amount, payment.Amount)
		}

		// Create refund
		refund := &PaymentRefund{
			OriginalPaymentID: paymentID,
			RefundNumber:      generateRefundNumber(),
			Amount:            amount,
			Currency:          payment.Currency,
			Reason:            reason,
			Status:            PaymentStatusCompleted,
			RefundDate:        time.Now(),
			Notes:             notes,
			CreatedBy:         userID,
		}

		now := time.Now()
		refund.ProcessedAt = &now

		if err := tx.Create(refund).Error; err != nil {
			return err
		}

		// Update payment status if fully refunded
		if amount >= payment.Amount {
			payment.Status = PaymentStatusRefunded
			if err := tx.Save(&payment).Error; err != nil {
				return err
			}
		}

		// Update invoice
		if payment.Invoice != nil {
			invoice := payment.Invoice
			invoice.PaidAmount -= amount
			invoice.UpdateStatus()

			if err := tx.Save(invoice).Error; err != nil {
				return err
			}
		}

		return nil
	}), nil
}

// WriteOffInvoice writes off an unpaid invoice as bad debt
func WriteOffInvoice(
	db *gorm.DB,
	invoiceID uuid.UUID,
	reason string,
	userID uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var invoice Invoice
		if err := tx.First(&invoice, invoiceID).Error; err != nil {
			return err
		}

		if invoice.IsPaid() {
			return errors.New("cannot write off a paid invoice")
		}

		invoice.Status = InvoiceStatusWrittenOff
		invoice.UpdatedBy = &userID

		if invoice.Notes == nil {
			invoice.Notes = &reason
		} else {
			note := fmt.Sprintf("%s\nWritten off: %s", *invoice.Notes, reason)
			invoice.Notes = &note
		}

		return tx.Save(&invoice).Error
	})
}

// GenerateAgingReport generates an aging report for unpaid invoices
func GenerateAgingReport(db *gorm.DB, customerID *uuid.UUID) (*AgingReport, error) {
	query := db.Model(&Invoice{}).
		Where("status IN ?", []InvoiceStatus{
			InvoiceStatusSent,
			InvoiceStatusViewed,
			InvoiceStatusPartiallyPaid,
			InvoiceStatusOverdue,
		})

	if customerID != nil {
		query = query.Where("customer_id = ?", customerID)
	}

	var invoices []Invoice
	if err := query.Find(&invoices).Error; err != nil {
		return nil, err
	}

	report := &AgingReport{
		GeneratedAt: time.Now(),
		Buckets: map[string]*AgingBucket{
			"Current":     {Name: "Current"},
			"1-30 days":   {Name: "1-30 days"},
			"31-60 days":  {Name: "31-60 days"},
			"61-90 days":  {Name: "61-90 days"},
			"90+ days":    {Name: "90+ days"},
		},
	}

	for _, invoice := range invoices {
		outstanding := invoice.GetOutstandingAmount()
		category := invoice.GetAgingCategory()

		bucket := report.Buckets[category]
		bucket.InvoiceCount++
		bucket.TotalAmount += outstanding
		bucket.Invoices = append(bucket.Invoices, invoice)

		report.TotalOutstanding += outstanding
		report.TotalInvoices++
	}

	return report, nil
}

// AgingReport structures aging report data
type AgingReport struct {
	GeneratedAt      time.Time                `json:"generated_at"`
	TotalInvoices    int                      `json:"total_invoices"`
	TotalOutstanding float64                  `json:"total_outstanding"`
	Buckets          map[string]*AgingBucket  `json:"buckets"`
}

type AgingBucket struct {
	Name         string    `json:"name"`
	InvoiceCount int       `json:"invoice_count"`
	TotalAmount  float64   `json:"total_amount"`
	Invoices     []Invoice `json:"invoices,omitempty"`
}
