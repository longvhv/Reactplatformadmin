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
// INVOICE - Main Invoice Model
// ============================================================================
// Purpose: Core invoice/bill entity for billing and accounting
// Table: invoices
// Primary Key: _id (UUID)
// Features: Multi-status, Tax calculation, Payment tracking, PDF generation
// ============================================================================

// InvoiceType represents the type of invoice
type InvoiceType string

const (
	InvoiceTypeStandard   InvoiceType = "STANDARD"    // Regular invoice
	InvoiceTypeProforma   InvoiceType = "PROFORMA"    // Proforma invoice
	InvoiceTypeRecurring  InvoiceType = "RECURRING"   // Recurring invoice
	InvoiceTypeCredit     InvoiceType = "CREDIT_NOTE" // Credit note
	InvoiceTypeDebit      InvoiceType = "DEBIT_NOTE"  // Debit note
)

// InvoiceStatus represents the invoice lifecycle status
type InvoiceStatus string

const (
	InvoiceStatusDraft        InvoiceStatus = "DRAFT"
	InvoiceStatusSent         InvoiceStatus = "SENT"
	InvoiceStatusViewed       InvoiceStatus = "VIEWED"
	InvoiceStatusPartiallyPaid InvoiceStatus = "PARTIALLY_PAID"
	InvoiceStatusPaid         InvoiceStatus = "PAID"
	InvoiceStatusOverdue      InvoiceStatus = "OVERDUE"
	InvoiceStatusVoid         InvoiceStatus = "VOID"
	InvoiceStatusWrittenOff   InvoiceStatus = "WRITTEN_OFF"
)

// PaymentTerms represents payment terms
type PaymentTerms string

const (
	PaymentTermsImmediate PaymentTerms = "IMMEDIATE"     // Due immediately
	PaymentTermsNet7      PaymentTerms = "NET_7"         // Due in 7 days
	PaymentTermsNet15     PaymentTerms = "NET_15"        // Due in 15 days
	PaymentTermsNet30     PaymentTerms = "NET_30"        // Due in 30 days
	PaymentTermsNet60     PaymentTerms = "NET_60"        // Due in 60 days
	PaymentTermsNet90     PaymentTerms = "NET_90"        // Due in 90 days
	PaymentTermsEOM       PaymentTerms = "EOM"           // End of month
	PaymentTermsCustom    PaymentTerms = "CUSTOM"        // Custom terms
)

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
// Invoice - Main Model (38 fields)
// ============================================================================

type Invoice struct {
	// ========== Identity & Relationships (6 fields) ==========
	ID           uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID     *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CustomerID   uuid.UUID  `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`
	OrderID      *uuid.UUID `gorm:"column:order_id;type:uuid;index" json:"order_id,omitempty"`
	SubscriptionID *uuid.UUID `gorm:"column:subscription_id;type:uuid;index" json:"subscription_id,omitempty"`
	ParentInvoiceID *uuid.UUID `gorm:"column:parent_invoice_id;type:uuid" json:"parent_invoice_id,omitempty"` // For credit/debit notes

	// ========== Invoice Info (7 fields) ==========
	InvoiceNumber string        `gorm:"column:invoice_number;type:varchar(50);uniqueIndex;not null" json:"invoice_number"`
	Type          InvoiceType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status        InvoiceStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title         *string       `gorm:"column:title;type:varchar(255)" json:"title,omitempty"`
	Description   *string       `gorm:"column:description;type:text" json:"description,omitempty"`
	Reference     *string       `gorm:"column:reference;type:varchar(100)" json:"reference,omitempty"` // PO number, etc.
	Notes         *string       `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// ========== Amounts (7 fields) ==========
	Subtotal       float64 `gorm:"column:subtotal;type:decimal(15,2);not null" json:"subtotal"`
	TaxAmount      float64 `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`
	DiscountAmount float64 `gorm:"column:discount_amount;type:decimal(15,2);default:0" json:"discount_amount"`
	ShippingAmount float64 `gorm:"column:shipping_amount;type:decimal(15,2);default:0" json:"shipping_amount"`
	AdjustmentAmount float64 `gorm:"column:adjustment_amount;type:decimal(15,2);default:0" json:"adjustment_amount"` // Manual adjustment
	TotalAmount    float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`
	PaidAmount     float64 `gorm:"column:paid_amount;type:decimal(15,2);default:0" json:"paid_amount"`
	Currency       string  `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// ========== Payment Terms (3 fields) ==========
	PaymentTerms  PaymentTerms `gorm:"column:payment_terms;type:varchar(20);not null" json:"payment_terms"`
	DueDate       time.Time    `gorm:"column:due_date;not null;index" json:"due_date"`
	LateFee       *float64     `gorm:"column:late_fee;type:decimal(15,2)" json:"late_fee,omitempty"`

	// ========== Dates (6 fields) ==========
	InvoiceDate   time.Time  `gorm:"column:invoice_date;not null" json:"invoice_date"`
	SentAt        *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`
	ViewedAt      *time.Time `gorm:"column:viewed_at" json:"viewed_at,omitempty"`
	PaidAt        *time.Time `gorm:"column:paid_at" json:"paid_at,omitempty"`
	VoidedAt      *time.Time `gorm:"column:voided_at" json:"voided_at,omitempty"`
	LastReminderAt *time.Time `gorm:"column:last_reminder_at" json:"last_reminder_at,omitempty"`

	// ========== Document (3 fields) ==========
	PDFURL        *string `gorm:"column:pdf_url;type:text" json:"pdf_url,omitempty"`
	PDFGenerated  bool    `gorm:"column:pdf_generated;default:false" json:"pdf_generated"`
	PublicURL     *string `gorm:"column:public_url;type:text" json:"public_url,omitempty"` // Public shareable link

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit Fields (5 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
	VoidedBy  *uuid.UUID `gorm:"column:voided_by;type:uuid" json:"voided_by,omitempty"`

	// ========== Soft Delete & Versioning (3 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationships
	LineItems     []InvoiceLineItem  `gorm:"foreignKey:InvoiceID" json:"line_items,omitempty"`
	Taxes         []InvoiceTax       `gorm:"foreignKey:InvoiceID" json:"taxes,omitempty"`
	Payments      []InvoicePayment   `gorm:"foreignKey:InvoiceID" json:"payments,omitempty"`
	CreditNotes   []Invoice          `gorm:"foreignKey:ParentInvoiceID" json:"credit_notes,omitempty"`
}

// TableName specifies the table name for Invoice
func (Invoice) TableName() string {
	return "invoices"
}

// ============================================================================
// GORM Hooks
// ============================================================================

func (inv *Invoice) BeforeCreate(tx *gorm.DB) error {
	if inv.ID == uuid.Nil {
		inv.ID = uuid.New()
	}

	if inv.InvoiceNumber == "" {
		inv.InvoiceNumber = generateInvoiceNumber(inv.Type)
	}

	if err := inv.Validate(); err != nil {
		return err
	}

	inv.CalculateTotals()

	return nil
}

func (inv *Invoice) BeforeUpdate(tx *gorm.DB) error {
	inv.Version++
	return nil
}

// ============================================================================
// Validation
// ============================================================================

func (inv *Invoice) Validate() error {
	if inv.CustomerID == uuid.Nil {
		return errors.New("customer ID is required")
	}
	if inv.Subtotal < 0 {
		return errors.New("subtotal cannot be negative")
	}
	if inv.TotalAmount < 0 {
		return errors.New("total amount cannot be negative")
	}
	return nil
}

// ============================================================================
// Helper Methods
// ============================================================================

func (inv *Invoice) CalculateTotals() {
	inv.TotalAmount = inv.Subtotal + inv.TaxAmount + inv.ShippingAmount - 
		inv.DiscountAmount + inv.AdjustmentAmount
	
	if inv.TotalAmount < 0 {
		inv.TotalAmount = 0
	}
}

func (inv *Invoice) IsPaid() bool {
	return inv.Status == InvoiceStatusPaid
}

func (inv *Invoice) IsFullyPaid() bool {
	return inv.PaidAmount >= inv.TotalAmount
}

func (inv *Invoice) IsPartiallyPaid() bool {
	return inv.PaidAmount > 0 && inv.PaidAmount < inv.TotalAmount
}

func (inv *Invoice) IsOverdue() bool {
	if inv.IsPaid() || inv.Status == InvoiceStatusVoid {
		return false
	}
	return time.Now().After(inv.DueDate)
}

func (inv *Invoice) IsDraft() bool {
	return inv.Status == InvoiceStatusDraft
}

func (inv *Invoice) CanEdit() bool {
	return inv.Status == InvoiceStatusDraft
}

func (inv *Invoice) CanVoid() bool {
	return inv.Status != InvoiceStatusVoid && inv.Status != InvoiceStatusPaid
}

func (inv *Invoice) GetOutstandingAmount() float64 {
	outstanding := inv.TotalAmount - inv.PaidAmount
	if outstanding < 0 {
		return 0
	}
	return outstanding
}

func (inv *Invoice) GetDaysOverdue() int {
	if !inv.IsOverdue() {
		return 0
	}
	duration := time.Since(inv.DueDate)
	return int(duration.Hours() / 24)
}

func (inv *Invoice) GetAgingCategory() string {
	days := inv.GetDaysOverdue()
	if days <= 0 {
		return "Current"
	} else if days <= 30 {
		return "1-30 days"
	} else if days <= 60 {
		return "31-60 days"
	} else if days <= 90 {
		return "61-90 days"
	} else {
		return "90+ days"
	}
}

func (inv *Invoice) MarkAsSent() {
	now := time.Now()
	inv.Status = InvoiceStatusSent
	inv.SentAt = &now
}

func (inv *Invoice) MarkAsViewed() {
	if inv.ViewedAt == nil {
		now := time.Now()
		inv.Status = InvoiceStatusViewed
		inv.ViewedAt = &now
	}
}

func (inv *Invoice) MarkAsPaid(amount float64, paidAt *time.Time) {
	inv.PaidAmount += amount
	
	if inv.IsFullyPaid() {
		inv.Status = InvoiceStatusPaid
		if paidAt != nil {
			inv.PaidAt = paidAt
		} else {
			now := time.Now()
			inv.PaidAt = &now
		}
	} else if inv.IsPartiallyPaid() {
		inv.Status = InvoiceStatusPartiallyPaid
	}
}

func (inv *Invoice) Void(reason string, voidedBy uuid.UUID) error {
	if !inv.CanVoid() {
		return errors.New("invoice cannot be voided")
	}
	
	now := time.Now()
	inv.Status = InvoiceStatusVoid
	inv.VoidedAt = &now
	inv.VoidedBy = &voidedBy
	
	if inv.Notes == nil {
		inv.Notes = &reason
	} else {
		note := fmt.Sprintf("%s\nVoided: %s", *inv.Notes, reason)
		inv.Notes = &note
	}
	
	return nil
}

func (inv *Invoice) UpdateStatus() {
	// Update status based on payment and due date
	if inv.IsFullyPaid() {
		inv.Status = InvoiceStatusPaid
	} else if inv.IsPartiallyPaid() {
		inv.Status = InvoiceStatusPartiallyPaid
	} else if inv.IsOverdue() && inv.Status != InvoiceStatusDraft {
		inv.Status = InvoiceStatusOverdue
	}
}

// ============================================================================
// INVOICE LINE ITEM - Invoice Line Items
// ============================================================================

type InvoiceLineItem struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	InvoiceID uuid.UUID `gorm:"column:invoice_id;type:uuid;not null;index" json:"invoice_id"`

	// Item Info (6 fields)
	ProductID   *uuid.UUID `gorm:"column:product_id;type:uuid" json:"product_id,omitempty"`
	SKU         *string    `gorm:"column:sku;type:varchar(100)" json:"sku,omitempty"`
	Name        string     `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string    `gorm:"column:description;type:text" json:"description,omitempty"`
	Quantity    float64    `gorm:"column:quantity;type:decimal(10,2);not null" json:"quantity"`
	UnitType    *string    `gorm:"column:unit_type;type:varchar(20)" json:"unit_type,omitempty"` // hours, items, kg, etc.

	// Pricing (5 fields)
	UnitPrice      float64 `gorm:"column:unit_price;type:decimal(15,2);not null" json:"unit_price"`
	Subtotal       float64 `gorm:"column:subtotal;type:decimal(15,2);not null" json:"subtotal"`
	TaxRate        float64 `gorm:"column:tax_rate;type:decimal(5,2);default:0" json:"tax_rate"` // Percentage
	TaxAmount      float64 `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`
	DiscountAmount float64 `gorm:"column:discount_amount;type:decimal(15,2);default:0" json:"discount_amount"`
	TotalAmount    float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`

	// Ordering (1 field)
	DisplayOrder int `gorm:"column:display_order;default:0" json:"display_order"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Invoice *Invoice `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
}

func (InvoiceLineItem) TableName() string {
	return "invoice_line_items"
}

func (item *InvoiceLineItem) CalculateTotal() {
	item.Subtotal = item.Quantity * item.UnitPrice
	item.TaxAmount = item.Subtotal * (item.TaxRate / 100)
	item.TotalAmount = item.Subtotal + item.TaxAmount - item.DiscountAmount
}

// ============================================================================
// INVOICE TAX - Tax Breakdown
// ============================================================================

type TaxType string

const (
	TaxTypeVAT         TaxType = "VAT"          // Value Added Tax
	TaxTypeGST         TaxType = "GST"          // Goods and Services Tax
	TaxTypeSalesTax    TaxType = "SALES_TAX"    // Sales Tax
	TaxTypeWithholding TaxType = "WITHHOLDING"  // Withholding Tax
	TaxTypeCustom      TaxType = "CUSTOM"       // Custom Tax
)

type InvoiceTax struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	InvoiceID uuid.UUID `gorm:"column:invoice_id;type:uuid;not null;index" json:"invoice_id"`

	// Tax Info (6 fields)
	TaxRateID   *uuid.UUID `gorm:"column:tax_rate_id;type:uuid" json:"tax_rate_id,omitempty"`
	Name        string     `gorm:"column:name;type:varchar(100);not null" json:"name"`
	Type        TaxType    `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Rate        float64    `gorm:"column:rate;type:decimal(5,2);not null" json:"rate"` // Percentage
	TaxableAmount float64  `gorm:"column:taxable_amount;type:decimal(15,2);not null" json:"taxable_amount"`
	TaxAmount   float64    `gorm:"column:tax_amount;type:decimal(15,2);not null" json:"tax_amount"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Invoice *Invoice `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
}

func (InvoiceTax) TableName() string {
	return "invoice_taxes"
}

func (tax *InvoiceTax) CalculateTaxAmount() {
	tax.TaxAmount = tax.TaxableAmount * (tax.Rate / 100)
}

// ============================================================================
// TAX RATE - Tax Rate Configuration
// ============================================================================

type TaxRate struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Tax Info (6 fields)
	Code        string  `gorm:"column:code;type:varchar(50);uniqueIndex;not null" json:"code"`
	Name        string  `gorm:"column:name;type:varchar(100);not null" json:"name"`
	Type        TaxType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Rate        float64 `gorm:"column:rate;type:decimal(5,2);not null" json:"rate"` // Percentage
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	IsCompound  bool    `gorm:"column:is_compound;default:false" json:"is_compound"` // Tax on tax

	// Applicability (3 fields)
	IsDefault bool    `gorm:"column:is_default;default:false" json:"is_default"`
	Country   *string `gorm:"column:country;type:varchar(2)" json:"country,omitempty"` // ISO country code
	State     *string `gorm:"column:state;type:varchar(50)" json:"state,omitempty"`

	// Status (2 fields)
	IsActive  bool       `gorm:"column:is_active;default:true" json:"is_active"`
	ValidFrom *time.Time `gorm:"column:valid_from" json:"valid_from,omitempty"`
	ValidTo   *time.Time `gorm:"column:valid_to" json:"valid_to,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Version (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`
}

func (TaxRate) TableName() string {
	return "tax_rates"
}

func (tr *TaxRate) IsValid() bool {
	now := time.Now()
	
	if !tr.IsActive {
		return false
	}
	
	if tr.ValidFrom != nil && now.Before(*tr.ValidFrom) {
		return false
	}
	
	if tr.ValidTo != nil && now.After(*tr.ValidTo) {
		return false
	}
	
	return true
}

// ============================================================================
// CREDIT NOTE - Credit Notes
// ============================================================================

type CreditNoteReason string

const (
	CreditNoteReasonReturn     CreditNoteReason = "RETURN"
	CreditNoteReasonDiscount   CreditNoteReason = "DISCOUNT"
	CreditNoteReasonError      CreditNoteReason = "BILLING_ERROR"
	CreditNoteReasonGoodwill   CreditNoteReason = "GOODWILL"
	CreditNoteReasonOther      CreditNoteReason = "OTHER"
)

// Credit notes are stored as invoices with type CREDIT_NOTE
// Additional helper methods for credit notes

func (inv *Invoice) IsCreditNote() bool {
	return inv.Type == InvoiceTypeCredit
}

func (inv *Invoice) CreateCreditNote(
	reason CreditNoteReason,
	amount float64,
	description string,
	userID uuid.UUID,
) *Invoice {
	creditNote := &Invoice{
		TenantID:        inv.TenantID,
		CustomerID:      inv.CustomerID,
		ParentInvoiceID: &inv.ID,
		Type:            InvoiceTypeCredit,
		Status:          InvoiceStatusDraft,
		InvoiceDate:     time.Now(),
		DueDate:         time.Now(),
		Currency:        inv.Currency,
		Subtotal:        -amount, // Negative for credit
		TotalAmount:     -amount,
		PaymentTerms:    PaymentTermsImmediate,
		Description:     &description,
		CreatedBy:       &userID,
	}
	
	creditNote.Metadata = JSONB{
		"reason": reason,
		"parent_invoice_number": inv.InvoiceNumber,
	}
	
	return creditNote
}

// ============================================================================
// Helper Functions
// ============================================================================

func generateInvoiceNumber(invoiceType InvoiceType) string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randomStr := fmt.Sprintf("%05d", now.Unix()%100000)
	
	var prefix string
	switch invoiceType {
	case InvoiceTypeProforma:
		prefix = "PRO"
	case InvoiceTypeCredit:
		prefix = "CN"
	case InvoiceTypeDebit:
		prefix = "DN"
	default:
		prefix = "INV"
	}
	
	return fmt.Sprintf("%s-%s-%s", prefix, dateStr, randomStr)
}

// CreateInvoice creates a new invoice with line items
func CreateInvoice(
	db *gorm.DB,
	customerID uuid.UUID,
	invoiceDate time.Time,
	paymentTerms PaymentTerms,
	lineItems []InvoiceLineItem,
	userID *uuid.UUID,
) (*Invoice, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Calculate due date
		dueDate := calculateDueDate(invoiceDate, paymentTerms)
		
		// Calculate totals from line items
		var subtotal, taxAmount float64
		for i := range lineItems {
			lineItems[i].CalculateTotal()
			subtotal += lineItems[i].Subtotal
			taxAmount += lineItems[i].TaxAmount
		}
		
		// Create invoice
		invoice := &Invoice{
			CustomerID:   customerID,
			Type:         InvoiceTypeStandard,
			Status:       InvoiceStatusDraft,
			InvoiceDate:  invoiceDate,
			DueDate:      dueDate,
			PaymentTerms: paymentTerms,
			Subtotal:     subtotal,
			TaxAmount:    taxAmount,
			Currency:     "USD",
			CreatedBy:    userID,
		}
		
		invoice.CalculateTotals()
		
		if err := tx.Create(invoice).Error; err != nil {
			return err
		}
		
		// Create line items
		for i := range lineItems {
			lineItems[i].InvoiceID = invoice.ID
		}
		if err := tx.Create(&lineItems).Error; err != nil {
			return err
		}
		
		invoice.LineItems = lineItems
		return nil
	}), nil
}

// UpdateInvoiceLineItems updates invoice line items and recalculates totals
func UpdateInvoiceLineItems(
	db *gorm.DB,
	invoiceID uuid.UUID,
	lineItems []InvoiceLineItem,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var invoice Invoice
		if err := tx.First(&invoice, invoiceID).Error; err != nil {
			return err
		}
		
		if !invoice.CanEdit() {
			return errors.New("invoice cannot be edited")
		}
		
		// Delete existing line items
		if err := tx.Where("invoice_id = ?", invoiceID).Delete(&InvoiceLineItem{}).Error; err != nil {
			return err
		}
		
		// Create new line items
		var subtotal, taxAmount float64
		for i := range lineItems {
			lineItems[i].InvoiceID = invoiceID
			lineItems[i].CalculateTotal()
			subtotal += lineItems[i].Subtotal
			taxAmount += lineItems[i].TaxAmount
		}
		
		if err := tx.Create(&lineItems).Error; err != nil {
			return err
		}
		
		// Update invoice totals
		invoice.Subtotal = subtotal
		invoice.TaxAmount = taxAmount
		invoice.CalculateTotals()
		
		return tx.Save(&invoice).Error
	})
}

// SendInvoice marks invoice as sent and creates notification
func SendInvoice(
	db *gorm.DB,
	invoiceID uuid.UUID,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var invoice Invoice
		if err := tx.First(&invoice, invoiceID).Error; err != nil {
			return err
		}
		
		if invoice.Status == InvoiceStatusDraft {
			invoice.MarkAsSent()
			invoice.UpdatedBy = userID
			
			if err := tx.Save(&invoice).Error; err != nil {
				return err
			}
			
			// TODO: Send email notification
		}
		
		return nil
	})
}

// VoidInvoice voids an invoice
func VoidInvoice(
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
		
		if err := invoice.Void(reason, userID); err != nil {
			return err
		}
		
		return tx.Save(&invoice).Error
	})
}

// CalculateDueDate calculates due date based on payment terms
func calculateDueDate(invoiceDate time.Time, terms PaymentTerms) time.Time {
	switch terms {
	case PaymentTermsImmediate:
		return invoiceDate
	case PaymentTermsNet7:
		return invoiceDate.AddDate(0, 0, 7)
	case PaymentTermsNet15:
		return invoiceDate.AddDate(0, 0, 15)
	case PaymentTermsNet30:
		return invoiceDate.AddDate(0, 0, 30)
	case PaymentTermsNet60:
		return invoiceDate.AddDate(0, 0, 60)
	case PaymentTermsNet90:
		return invoiceDate.AddDate(0, 0, 90)
	case PaymentTermsEOM:
		// End of month
		year, month, _ := invoiceDate.Date()
		lastDay := time.Date(year, month+1, 0, 0, 0, 0, 0, invoiceDate.Location())
		return lastDay
	default:
		return invoiceDate.AddDate(0, 0, 30)
	}
}

func strPtr(s string) *string {
	return &s
}

func floatPtr(f float64) *float64 {
	return &f
}
